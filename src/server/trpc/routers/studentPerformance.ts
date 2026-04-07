import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { MVP_TECHNIQUES } from "@/lib/techniques/mvp"

/**
 * Student performance router — powers /aluno/performance.
 *
 * Aggregates technique_events for the *currently authenticated member*
 * (no admin/instructor scoping). Always returns one row per MVP technique
 * even when there is no data, so the radar chart never shows gaps.
 */
export const studentPerformanceRouter = router({
  /**
   * Returns aggregated technique counts for the logged-in student.
   *
   * @param period - "month" (last 30 days) or "all" (lifetime)
   */
  byTechnique: protectedProcedure
    .input(
      z.object({
        period: z.enum(["month", "all"]).default("month"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      let query = supabase
        .from("technique_events")
        .select("technique_slug, event_type")
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", ctx.member!.id)

      if (input.period === "month") {
        const since = new Date()
        since.setDate(since.getDate() - 30)
        query = query.gte("created_at", since.toISOString())
      }

      const { data, error } = await query
      if (error) throw new Error("Falha ao carregar desempenho")

      // Pre-seed every MVP technique with zeros so the radar always has
      // 6 vertices, even before the student logs anything.
      const buckets = new Map<
        string,
        { attempts: number; successes: number; submissions: number }
      >()
      for (const t of MVP_TECHNIQUES) {
        buckets.set(t.slug, { attempts: 0, successes: 0, submissions: 0 })
      }

      for (const row of data ?? []) {
        const bucket = buckets.get(row.technique_slug)
        if (!bucket) continue // ignore unknown / legacy slugs
        if (row.event_type === "attempt") bucket.attempts += 1
        else if (row.event_type === "success") bucket.successes += 1
        else if (row.event_type === "submission") bucket.submissions += 1
      }

      return MVP_TECHNIQUES.map((t) => {
        const b = buckets.get(t.slug)!
        return {
          slug: t.slug,
          label: t.label,
          attempts: b.attempts,
          successes: b.successes,
          submissions: b.submissions,
        }
      })
    }),
})
