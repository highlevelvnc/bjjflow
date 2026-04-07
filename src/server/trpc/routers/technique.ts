import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router } from "../init"
import { protectedProcedure, instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { BJJ_BASE_TECHNIQUES } from "@/lib/techniques/bjjBase"

// Faixas reconhecidas — usadas como enum nos endpoints de filtro/criação.
// Posição e categoria são livres (taxonomia por academia, validada no app).
const BELTS = ["white", "blue", "purple", "brown", "black"] as const

export const techniqueRouter = router({
  // ─── Técnica do dia ─────────────────────────────────────────────────────
  /**
   * Returns today's technique for the academy.
   * Uses day-of-year as a seed to rotate through available techniques.
   */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data: techniques } = await supabase
      .from("techniques")
      .select(
        "id, name, description, position, category, belt_level, instructions, key_points",
      )
      .eq("academy_id", ctx.academyId!)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (!techniques || techniques.length === 0) return null

    // Use day-of-year as seed
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const index = dayOfYear % techniques.length

    return techniques[index]!
  }),

  // ─── Listagem com filtros ──────────────────────────────────────────────
  /**
   * Lista todas as técnicas da academia com filtros opcionais.
   * Retorna também a contagem total e a contagem por posição (para tabs).
   * Acesso: instrutor+
   */
  list: instructorProcedure
    .input(
      z
        .object({
          position: z.string().max(100).optional(),
          category: z.string().max(100).optional(),
          belt_level: z.enum(BELTS).optional(),
          search: z.string().max(120).optional(),
          limit: z.number().int().min(1).max(500).default(500),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      let query = supabase
        .from("techniques")
        .select(
          "id, name, description, position, category, belt_level, difficulty, instructions, key_points, tags, is_published, sort_order, created_at",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)

      if (input?.position) query = query.eq("position", input.position)
      if (input?.category) query = query.eq("category", input.category)
      if (input?.belt_level) query = query.eq("belt_level", input.belt_level)
      if (input?.search) {
        // ilike no nome OU descrição (postgrest "or")
        const like = `%${input.search}%`
        query = query.or(`name.ilike.${like},description.ilike.${like}`)
      }

      const { data, count, error } = await query
        .order("position", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
        .limit(input?.limit ?? 500)

      if (error) throw error

      // Conta por posição (sem filtro de posição) para mostrar nos tabs
      const { data: countsRaw } = await supabase
        .from("techniques")
        .select("position")
        .eq("academy_id", ctx.academyId!)

      const countsByPosition: Record<string, number> = {}
      for (const row of countsRaw ?? []) {
        countsByPosition[row.position] = (countsByPosition[row.position] ?? 0) + 1
      }

      return {
        items: data ?? [],
        total: count ?? 0,
        countsByPosition,
      }
    }),

  // ─── Detalhe de uma técnica ───────────────────────────────────────────
  byId: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { data, error } = await supabase
        .from("techniques")
        .select(
          "id, name, description, position, category, sub_category, belt_level, difficulty, instructions, key_points, tags, is_published, sort_order, created_at, updated_at",
        )
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .single()

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Técnica não encontrada" })
      return data
    }),

  // ─── Criar / atualizar / remover ──────────────────────────────────────
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        position: z.string().min(1).max(100),
        category: z.string().min(1).max(100),
        belt_level: z.enum(BELTS).default("white"),
        difficulty: z.number().int().min(1).max(5).default(1),
        instructions: z.string().max(5000).optional(),
        key_points: z.array(z.string().max(500)).max(20).optional(),
        tags: z.array(z.string().max(60)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("techniques")
        .insert({
          academy_id: ctx.academyId!,
          name: input.name,
          description: input.description ?? null,
          position: input.position,
          category: input.category,
          belt_level: input.belt_level,
          difficulty: input.difficulty,
          instructions: input.instructions ?? null,
          key_points: input.key_points ?? null,
          tags: input.tags ?? [],
          created_by: ctx.member?.id ?? null,
        })
        .select("id, name")
        .single()

      if (error) {
        console.error("[technique.create]", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Falha ao criar técnica",
        })
      }
      return data
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).nullable().optional(),
        position: z.string().min(1).max(100).optional(),
        category: z.string().min(1).max(100).optional(),
        belt_level: z.enum(BELTS).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        instructions: z.string().max(5000).nullable().optional(),
        key_points: z.array(z.string().max(500)).max(20).nullable().optional(),
        tags: z.array(z.string().max(60)).max(20).optional(),
        is_published: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { id, ...rest } = input

      const { error } = await supabase
        .from("techniques")
        .update(rest)
        .eq("academy_id", ctx.academyId!)
        .eq("id", id)

      if (error) {
        console.error("[technique.update]", error)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }
      return { ok: true }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { error } = await supabase
        .from("techniques")
        .delete()
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)

      if (error) {
        console.error("[technique.delete]", error)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }
      return { ok: true }
    }),

  // ─── Seed da base de BJJ brasileiro ────────────────────────────────────
  /**
   * Importa o catálogo de técnicas-base do BJJ brasileiro para a academia.
   * Idempotente: técnicas com o mesmo nome (na mesma academia) são ignoradas.
   * Acesso: admin.
   */
  seedBjjBase: adminProcedure.mutation(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // 1. Lê os nomes já existentes para deduplicar
    const { data: existing, error: existingError } = await supabase
      .from("techniques")
      .select("name")
      .eq("academy_id", ctx.academyId!)

    if (existingError) {
      console.error("[technique.seedBjjBase] read existing", existingError)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao consultar técnicas existentes",
      })
    }

    const existingNames = new Set((existing ?? []).map((r) => r.name.toLowerCase()))

    const toInsert = BJJ_BASE_TECHNIQUES.filter(
      (t) => !existingNames.has(t.name.toLowerCase()),
    ).map((t, i) => ({
      academy_id: ctx.academyId!,
      name: t.name,
      description: t.description,
      position: t.position,
      category: t.category,
      belt_level: t.belt_level,
      difficulty: t.difficulty,
      instructions: t.instructions,
      key_points: t.key_points,
      tags: t.tags,
      sort_order: i,
      is_published: true,
      created_by: ctx.member?.id ?? null,
    }))

    if (toInsert.length === 0) {
      return { inserted: 0, skipped: BJJ_BASE_TECHNIQUES.length }
    }

    const { error } = await supabase.from("techniques").insert(toInsert)

    if (error) {
      console.error("[technique.seedBjjBase] insert", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Falha ao importar a base de técnicas",
      })
    }

    return {
      inserted: toInsert.length,
      skipped: BJJ_BASE_TECHNIQUES.length - toInsert.length,
    }
  }),

  // ─── Técnica do dia (manual) ───────────────────────────────────────────
  /**
   * Manually set today's technique by linking it to today's sessions.
   * Instructor+ access required.
   */
  setTodayTechnique: instructorProcedure
    .input(
      z.object({
        techniqueId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const today = new Date().toISOString().split("T")[0]!

      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("id")
        .eq("academy_id", ctx.academyId!)
        .eq("date", today)

      if (!sessions || sessions.length === 0) {
        return { linked: 0 }
      }

      let linked = 0
      for (const session of sessions) {
        const { error } = await supabase.from("session_techniques").upsert(
          {
            academy_id: ctx.academyId!,
            session_id: session.id,
            technique_id: input.techniqueId,
          },
          { onConflict: "session_id,technique_id" },
        )
        if (!error) linked++
      }

      return { linked }
    }),
})
