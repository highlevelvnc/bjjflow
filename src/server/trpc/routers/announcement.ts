import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { TRPCError } from "@trpc/server"

export const announcementRouter = router({
  /**
   * List announcements for the current academy.
   * Pinned first, then by published_at desc.
   * Filters out expired announcements.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0
      const now = new Date().toISOString()

      // Fetch announcements: not expired
      const { data, count } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: false })
        .eq("academy_id", ctx.academyId!)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1)

      // Fetch author names for the announcements
      const authorIds = [...new Set((data ?? []).map((a) => a.author_id).filter((id): id is string => id !== null))]
      let authorMap: Record<string, string> = {}
      if (authorIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("id, full_name")
          .in("id", authorIds)
        if (members) {
          authorMap = Object.fromEntries(members.map((m) => [m.id, m.full_name]))
        }
      }

      const items = (data ?? []).map((a) => ({
        ...a,
        author_name: a.author_id ? authorMap[a.author_id] ?? "Unknown" : "Unknown",
      }))

      return { items, total: count ?? 0 }
    }),

  /**
   * Create a new announcement. Instructor+ access required.
   */
  create: instructorProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(5000),
        priority: z.enum(["normal", "important", "urgent"]).default("normal"),
        pinned: z.boolean().default(false),
        expires_at: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("announcements")
        .insert({
          academy_id: ctx.academyId!,
          title: input.title,
          content: input.content,
          priority: input.priority,
          pinned: input.pinned,
          author_id: ctx.member!.id,
          published_at: new Date().toISOString(),
          expires_at: input.expires_at ?? null,
        })
        .select("id, title")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Update an announcement. Only author or admin can update.
   */
  update: instructorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).max(5000).optional(),
        priority: z.enum(["normal", "important", "urgent"]).optional(),
        pinned: z.boolean().optional(),
        expires_at: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Fetch existing to check ownership
      const { data: existing } = await supabase
        .from("announcements")
        .select("id, author_id")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found." })
      }

      // Only author or admin can update
      if (existing.author_id !== ctx.member!.id && ctx.member!.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the author or an admin can edit." })
      }

      const { id, ...updates } = input
      const { data, error } = await supabase
        .from("announcements")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("academy_id", ctx.academyId!)
        .select("id, title")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Delete an announcement. Admin only.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)

      if (error) throw error
      return { success: true }
    }),

  /**
   * Toggle pinned state. Instructor+ access.
   */
  pin: instructorProcedure
    .input(z.object({ id: z.string().uuid(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("announcements")
        .update({ pinned: input.pinned, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .select("id, pinned")
        .single()

      if (error) throw error
      return data
    }),
})
