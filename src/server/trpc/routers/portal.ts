import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const portalRouter = router({
  /**
   * Returns the current member's profile for the student portal.
   */
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.member!.id,
      full_name: ctx.member!.full_name,
      email: ctx.member!.email,
      role: ctx.member!.role,
      belt_rank: ctx.member!.belt_rank,
      stripes: ctx.member!.stripes,
      avatar_url: ctx.member!.avatar_url,
      created_at: ctx.member!.created_at,
    }
  }),

  /**
   * Returns attendance history for the current member.
   * Ordered by session date descending, limited.
   */
  myAttendance: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(30),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 30
      const offset = input?.offset ?? 0

      const { data: attendance, count } = await supabase
        .from("attendance")
        .select("id, session_id, checked_in_at, check_in_method", { count: "exact", head: false })
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", ctx.member!.id)
        .order("checked_in_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (!attendance || attendance.length === 0) return { items: [], total: count ?? 0 }

      // Resolve session details
      const sessionIds = [...new Set(attendance.map((a) => a.session_id))]
      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("id, class_id, date, start_time, end_time")
        .eq("academy_id", ctx.academyId!)
        .in("id", sessionIds)

      const classIds = [...new Set((sessions ?? []).map((s) => s.class_id))]
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, gi_type")
        .eq("academy_id", ctx.academyId!)
        .in("id", classIds.length > 0 ? classIds : ["none"])

      const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s]))
      const classMap = new Map((classes ?? []).map((c) => [c.id, c]))

      const items = attendance.map((a) => {
        const session = sessionMap.get(a.session_id)
        const cls = session ? classMap.get(session.class_id) : null
        return {
          id: a.id,
          checked_in_at: a.checked_in_at,
          check_in_method: a.check_in_method,
          session: session
            ? {
                date: session.date,
                start_time: session.start_time,
                end_time: session.end_time,
                class_name: cls?.name ?? "Unknown",
                gi_type: cls?.gi_type ?? null,
              }
            : null,
        }
      })

      return { items, total: count ?? 0 }
    }),

  /**
   * Returns attendance stats for the current member.
   */
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!

    // Get total attendance count
    const { count: totalAttendance } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)

    // Get last 30 days attendance
    const { count: last30Days } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .gte("checked_in_at", thirtyDaysAgo)

    // Get last 90 days attendance
    const { count: last90Days } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .gte("checked_in_at", ninetyDaysAgo)

    // Get total completed sessions in last 30 days (for rate calculation)
    const { count: totalSessions30 } = await supabase
      .from("class_sessions")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", thirtyDaysAgo)

    const rate30 = totalSessions30 && totalSessions30 > 0
      ? Math.round(((last30Days ?? 0) / totalSessions30) * 100)
      : 0

    return {
      totalAttendance: totalAttendance ?? 0,
      last30Days: last30Days ?? 0,
      last90Days: last90Days ?? 0,
      attendanceRate30: rate30,
      memberSince: ctx.member!.created_at,
    }
  }),

  /**
   * Returns belt promotion history for the current member.
   */
  myBeltHistory: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data } = await supabase
      .from("member_belt_history")
      .select("id, belt_rank, stripes, promoted_at, notes")
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .order("promoted_at", { ascending: false })

    return data ?? []
  }),
})
