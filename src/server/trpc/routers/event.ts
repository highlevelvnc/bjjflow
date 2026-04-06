import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { TRPCError } from "@trpc/server"

export const eventRouter = router({
  /**
   * List events for the academy. Default: upcoming only. Optional: include past.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          includePast: z.boolean().default(false),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0
      const includePast = input?.includePast ?? false

      let query = supabase
        .from("events")
        .select("*", { count: "exact", head: false })
        .eq("academy_id", ctx.academyId!)
        .order("start_date", { ascending: true })
        .range(offset, offset + limit - 1)

      if (!includePast) {
        const today = new Date().toISOString().split("T")[0]!
        query = query.gte("start_date", today)
      }

      const { data, count, error } = await query

      if (error) throw error

      return { items: data ?? [], total: count ?? 0 }
    }),

  /**
   * Get a single event by ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." })
      }

      return data
    }),

  /**
   * Create a new event. Admin access required.
   */
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(5000).optional(),
        event_type: z
          .enum(["seminar", "competition", "social", "workshop", "other"])
          .default("other"),
        start_date: z.string().min(1),
        end_date: z.string().optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        location: z.string().max(500).optional(),
        is_public: z.boolean().default(false),
        max_participants: z.number().int().min(1).optional(),
        registration_required: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("events")
        .insert({
          academy_id: ctx.academyId!,
          title: input.title,
          description: input.description ?? null,
          event_type: input.event_type,
          start_date: input.start_date,
          end_date: input.end_date ?? null,
          start_time: input.start_time ?? null,
          end_time: input.end_time ?? null,
          location: input.location ?? null,
          is_public: input.is_public,
          max_participants: input.max_participants ?? null,
          registration_required: input.registration_required,
          created_by: ctx.member!.id,
        })
        .select("id, title")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Update an event. Admin access required.
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional().nullable(),
        event_type: z
          .enum(["seminar", "competition", "social", "workshop", "other"])
          .optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional().nullable(),
        start_time: z.string().optional().nullable(),
        end_time: z.string().optional().nullable(),
        location: z.string().max(500).optional().nullable(),
        is_public: z.boolean().optional(),
        max_participants: z.number().int().min(1).optional().nullable(),
        registration_required: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { id, ...updates } = input

      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .eq("academy_id", ctx.academyId!)
        .select("id, title")
        .single()

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." })
      }

      return data
    }),

  /**
   * Delete an event. Admin access required.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)

      if (error) throw error
      return { success: true }
    }),
})
