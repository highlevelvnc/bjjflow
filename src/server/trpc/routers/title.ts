import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
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

const MATCH_METHODS = [
  "submission",
  "points",
  "advantage",
  "penalty",
  "decision",
  "dq",
  "wo",
] as const

const CreateMatchInput = z.object({
  title_id: z.string().uuid(),
  match_order: z.number().int().min(1).max(20).default(1),
  result: z.enum(["win", "loss", "draw"]),
  method: z.enum(MATCH_METHODS),
  submission_type: z.string().max(60).optional(),
  points_for: z.number().int().min(0).max(99).optional(),
  points_against: z.number().int().min(0).max(99).optional(),
  advantages_for: z.number().int().min(0).max(99).optional(),
  advantages_against: z.number().int().min(0).max(99).optional(),
  finish_time: z.string().max(10).optional(),
  opponent_name: z.string().max(120).optional(),
  opponent_team: z.string().max(120).optional(),
  notes: z.string().max(300).optional(),
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
   * Detalhe de um título único, com a faixa do aluno na época do registro.
   */
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("member_titles")
        .select("*, members!inner(full_name, belt_rank, stripes)")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        })
      }

      const member = data.members as unknown as {
        full_name: string
        belt_rank: string
        stripes: number
      }
      return {
        id: data.id,
        member_id: data.member_id,
        member_name: member.full_name,
        member_belt: member.belt_rank,
        member_stripes: member.stripes,
        title: data.title,
        competition: data.competition,
        category: data.category,
        weight_class: data.weight_class,
        placement: data.placement,
        date: data.date,
        notes: data.notes,
        created_at: data.created_at,
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

  // ─── Competition matches (ADCC-style fight cards) ──────────────────────

  /**
   * Lista todas as lutas vinculadas a um título, em ordem.
   */
  matchesFor: protectedProcedure
    .input(z.object({ titleId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { data, error } = await supabase
        .from("competition_matches")
        .select("*")
        .eq("academy_id", ctx.academyId!)
        .eq("title_id", input.titleId)
        .order("match_order", { ascending: true })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao carregar lutas",
        })
      }
      return data ?? []
    }),

  /**
   * Cria uma luta nova vinculada a um título.
   * Apenas instrutor/admin pode registrar.
   */
  createMatch: instructorProcedure
    .input(CreateMatchInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Look up the title to grab member_id and confirm tenant
      const { data: title, error: titleErr } = await supabase
        .from("member_titles")
        .select("id, member_id, academy_id")
        .eq("id", input.title_id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (titleErr || !title) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        })
      }

      const { data, error } = await supabase
        .from("competition_matches")
        .insert({
          academy_id: ctx.academyId!,
          title_id: title.id,
          member_id: title.member_id,
          match_order: input.match_order,
          result: input.result,
          method: input.method,
          submission_type: input.submission_type ?? null,
          points_for: input.points_for ?? null,
          points_against: input.points_against ?? null,
          advantages_for: input.advantages_for ?? null,
          advantages_against: input.advantages_against ?? null,
          finish_time: input.finish_time ?? null,
          opponent_name: input.opponent_name ?? null,
          opponent_team: input.opponent_team ?? null,
          notes: input.notes ?? null,
        })
        .select("id")
        .single()

      if (error) {
        console.error("[title.createMatch]", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao registrar luta",
        })
      }
      return data
    }),

  /** Excluir uma luta. */
  deleteMatch: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { error } = await supabase
        .from("competition_matches")
        .delete()
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao excluir luta",
        })
      }
      return { success: true }
    }),
})
