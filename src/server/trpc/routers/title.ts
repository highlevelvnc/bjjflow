import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

const CreateTitleInput = z.object({
  member_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  competition: z.string().min(2).max(200),
  category: z.string().max(100).optional(),
  weight_class: z.string().max(50).optional(),
  placement: z.enum(["gold", "silver", "bronze", "other"]).default("gold"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
})

export const titleRouter = router({
  /**
   * List all titles for the academy, newest first.
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20), offset: z.number().int().min(0).default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0

      const { data, count } = await supabase
        .from("member_titles")
        .select("*, members!inner(full_name, belt_rank, stripes)", { count: "exact" })
        .eq("academy_id", ctx.academyId!)
        .order("date", { ascending: false })
        .range(offset, offset + limit - 1)

      return {
        items: (data ?? []).map((t) => {
          const member = t.members as unknown as { full_name: string; belt_rank: string; stripes: number }
          return {
            id: t.id,
            member_id: t.member_id,
            member_name: member.full_name,
            member_belt: member.belt_rank,
            member_stripes: member.stripes,
            title: t.title,
            competition: t.competition,
            category: t.category,
            weight_class: t.weight_class,
            placement: t.placement,
            date: t.date,
            notes: t.notes,
            created_at: t.created_at,
          }
        }),
        total: count ?? 0,
      }
    }),

  /**
   * List titles for a specific member.
   */
  forMember: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data } = await supabase
        .from("member_titles")
        .select("*")
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", input.memberId)
        .order("date", { ascending: false })

      return data ?? []
    }),

  /**
   * Recent titles for dashboard — last 10.
   */
  recent: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data } = await supabase
      .from("member_titles")
      .select("*, members!inner(full_name, belt_rank, stripes)")
      .eq("academy_id", ctx.academyId!)
      .order("date", { ascending: false })
      .limit(5)

    return (data ?? []).map((t) => {
      const member = t.members as unknown as { full_name: string; belt_rank: string; stripes: number }
      return {
        id: t.id,
        member_id: t.member_id,
        member_name: member.full_name,
        member_belt: member.belt_rank,
        title: t.title,
        competition: t.competition,
        placement: t.placement as string,
        date: t.date,
      }
    })
  }),

  /**
   * Create a new title/achievement.
   */
  create: instructorProcedure
    .input(CreateTitleInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("member_titles")
        .insert({
          academy_id: ctx.academyId!,
          member_id: input.member_id,
          title: input.title,
          competition: input.competition,
          category: input.category ?? null,
          weight_class: input.weight_class ?? null,
          placement: input.placement,
          date: input.date,
          notes: input.notes ?? null,
        })
        .select("id")
        .single()

      if (error) throw new Error("Falha ao registrar título")
      return data
    }),

  /**
   * Delete a title.
   */
  delete: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { error } = await supabase
        .from("member_titles")
        .delete()
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)

      if (error) throw new Error("Falha ao excluir título")
      return { success: true }
    }),
})
