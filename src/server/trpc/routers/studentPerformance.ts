import "server-only"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { MVP_TECHNIQUES, type TechniqueSlug } from "@/lib/techniques/mvp"

/**
 * Student performance router — powers /aluno/performance.
 *
 * Aggregates technique_events for the *currently authenticated member*
 * (no admin/instructor scoping). Always returns one row per MVP technique
 * even when there is no data, so the radar chart never shows gaps.
 */

const PERIOD = z.enum(["month", "all"])
const VALID_SLUGS = MVP_TECHNIQUES.map((t) => t.slug) as [TechniqueSlug, ...TechniqueSlug[]]

type Counts = { attempts: number; successes: number; submissions: number }

function emptyBuckets(): Map<string, Counts> {
  const map = new Map<string, Counts>()
  for (const t of MVP_TECHNIQUES) {
    map.set(t.slug, { attempts: 0, successes: 0, submissions: 0 })
  }
  return map
}

function rollUp(rows: { technique_slug: string; event_type: string }[]) {
  const buckets = emptyBuckets()
  for (const row of rows) {
    const b = buckets.get(row.technique_slug)
    if (!b) continue
    if (row.event_type === "attempt") b.attempts += 1
    else if (row.event_type === "success") b.successes += 1
    else if (row.event_type === "submission") b.submissions += 1
  }
  return buckets
}

export const studentPerformanceRouter = router({
  // ─── Aggregated counts per technique (radar chart) ─────────────────────
  /**
   * Returns aggregated technique counts for the logged-in student plus
   * the previous-period totals for delta indicators.
   */
  byTechnique: protectedProcedure
    .input(z.object({ period: PERIOD.default("month") }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const now = new Date()
      const sinceCurrent = new Date(now)
      if (input.period === "month") sinceCurrent.setDate(sinceCurrent.getDate() - 30)

      // Build base query
      let baseQuery = supabase
        .from("technique_events")
        .select("technique_slug, event_type, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", ctx.member!.id)

      if (input.period === "month") {
        baseQuery = baseQuery.gte("created_at", sinceCurrent.toISOString())
      }

      const { data, error } = await baseQuery
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao carregar desempenho" })

      const buckets = rollUp(data ?? [])

      // Previous-period totals (only for "month")
      const prevTotals: Counts = { attempts: 0, successes: 0, submissions: 0 }
      if (input.period === "month") {
        const sincePrev = new Date(now)
        sincePrev.setDate(sincePrev.getDate() - 60)
        const untilPrev = new Date(now)
        untilPrev.setDate(untilPrev.getDate() - 30)

        const { data: prevData } = await supabase
          .from("technique_events")
          .select("event_type")
          .eq("academy_id", ctx.academyId!)
          .eq("member_id", ctx.member!.id)
          .gte("created_at", sincePrev.toISOString())
          .lt("created_at", untilPrev.toISOString())

        for (const row of prevData ?? []) {
          if (row.event_type === "attempt") prevTotals.attempts += 1
          else if (row.event_type === "success") prevTotals.successes += 1
          else if (row.event_type === "submission") prevTotals.submissions += 1
        }
      }

      const items = MVP_TECHNIQUES.map((t) => {
        const b = buckets.get(t.slug)!
        return {
          slug: t.slug,
          label: t.label,
          attempts: b.attempts,
          successes: b.successes,
          submissions: b.submissions,
        }
      })

      const totals: Counts = items.reduce(
        (acc, i) => ({
          attempts: acc.attempts + i.attempts,
          successes: acc.successes + i.successes,
          submissions: acc.submissions + i.submissions,
        }),
        { attempts: 0, successes: 0, submissions: 0 },
      )

      return { items, totals, prevTotals }
    }),

  // ─── Resumo / overview ─────────────────────────────────────────────────
  /**
   * High-level stats: streak, top technique, total events, success rate.
   * Lifetime data — used in the header overview.
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("technique_events")
      .select("technique_slug, event_type, created_at")
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .order("created_at", { ascending: false })

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao calcular resumo" })

    const rows = data ?? []
    const totalEvents = rows.length

    let attempts = 0
    let successes = 0
    let submissions = 0
    const perTechnique = emptyBuckets()
    for (const row of rows) {
      if (row.event_type === "attempt") attempts += 1
      else if (row.event_type === "success") successes += 1
      else if (row.event_type === "submission") submissions += 1
      const b = perTechnique.get(row.technique_slug)
      if (b) {
        if (row.event_type === "attempt") b.attempts += 1
        else if (row.event_type === "success") b.successes += 1
        else if (row.event_type === "submission") b.submissions += 1
      }
    }

    const denominator = attempts + successes + submissions
    const successRate =
      denominator === 0 ? 0 : Math.round(((successes + submissions) / denominator) * 100)

    // Top technique by total events
    let topSlug: string | null = null
    let topCount = 0
    for (const t of MVP_TECHNIQUES) {
      const b = perTechnique.get(t.slug)!
      const total = b.attempts + b.successes + b.submissions
      if (total > topCount) {
        topCount = total
        topSlug = t.slug
      }
    }
    const topLabel = MVP_TECHNIQUES.find((t) => t.slug === topSlug)?.label ?? null

    // Streak: consecutive days with at least one event ending today (or yesterday)
    const dateSet = new Set<string>()
    for (const row of rows) {
      const day = new Date(row.created_at).toISOString().slice(0, 10)
      dateSet.add(day)
    }

    let streak = 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    // Allow streak to start from yesterday if today has no log yet
    let allowSkipToday = true
    while (true) {
      const key = cursor.toISOString().slice(0, 10)
      if (dateSet.has(key)) {
        streak += 1
        allowSkipToday = false
      } else if (allowSkipToday) {
        allowSkipToday = false
      } else {
        break
      }
      cursor.setDate(cursor.getDate() - 1)
      if (streak > 365) break // safety
    }

    const lastEventAt = rows[0]?.created_at ?? null

    return {
      totalEvents,
      attempts,
      successes,
      submissions,
      successRate,
      streak,
      topTechnique: topLabel ? { slug: topSlug!, label: topLabel, count: topCount } : null,
      lastEventAt,
    }
  }),

  // ─── Eventos recentes (timeline) ───────────────────────────────────────
  recent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 10

      const { data, error } = await supabase
        .from("technique_events")
        .select("id, technique_slug, event_type, notes, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", ctx.member!.id)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao carregar histórico" })

      return (data ?? []).map((row) => ({
        id: row.id,
        slug: row.technique_slug,
        label: MVP_TECHNIQUES.find((t) => t.slug === row.technique_slug)?.label ?? row.technique_slug,
        eventType: row.event_type as "attempt" | "success" | "submission",
        notes: row.notes,
        createdAt: row.created_at,
      }))
    }),

  // ─── Logar evento (quick log) ──────────────────────────────────────────
  /**
   * Permite ao próprio aluno registrar uma tentativa, sucesso ou finalização.
   * Aceita apenas slugs do conjunto MVP — qualquer outro retorna 400.
   */
  logEvent: protectedProcedure
    .input(
      z.object({
        slug: z.enum(VALID_SLUGS),
        eventType: z.enum(["attempt", "success", "submission"]),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      if (!ctx.member?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você precisa estar vinculado a uma academia para registrar técnicas.",
        })
      }

      const { error } = await supabase.from("technique_events").insert({
        academy_id: ctx.academyId!,
        member_id: ctx.member.id,
        technique_slug: input.slug,
        event_type: input.eventType,
        notes: input.notes ?? null,
      })

      if (error) {
        console.error("[studentPerformance.logEvent]", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Falha ao registrar evento",
        })
      }
      return { ok: true }
    }),

  // ─── Excluir evento (caso erre o registro) ─────────────────────────────
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { error } = await supabase
        .from("technique_events")
        .delete()
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", ctx.member!.id)
        .eq("id", input.id)

      if (error) {
        console.error("[studentPerformance.deleteEvent]", error)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }
      return { ok: true }
    }),
})
