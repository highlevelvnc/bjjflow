import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { getMemberBillingStatus } from "@/lib/billing/block"

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
   * Returns weekly training streak stats for the current member.
   */
  myStreak: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // Get all attendance dates for this member, ordered desc
    const { data } = await supabase
      .from("attendance")
      .select("checked_in_at")
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .order("checked_in_at", { ascending: false })

    if (!data || data.length === 0)
      return { currentStreak: 0, longestStreak: 0, totalDays: 0, lastTraining: null }

    // Get unique training days
    const trainingDays = [
      ...new Set(data.map((a) => a.checked_in_at.split("T")[0])),
    ]
      .sort()
      .reverse()

    // Group by ISO week (Sunday start)
    const weekKeys = [
      ...new Set(
        trainingDays.map((day) => {
          const d = new Date(day + "T00:00:00")
          const weekStart = new Date(d)
          weekStart.setDate(d.getDate() - d.getDay())
          return weekStart.toISOString().split("T")[0]!
        }),
      ),
    ]
      .sort()
      .reverse()

    // Current streak: consecutive weeks from this week going back
    const today = new Date()
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)

    let currentStreak = 0
    for (let i = 0; i < 52; i++) {
      const checkWeek = new Date(thisWeekStart)
      checkWeek.setDate(thisWeekStart.getDate() - i * 7)
      const checkKey = checkWeek.toISOString().split("T")[0]
      if (weekKeys.includes(checkKey!)) {
        currentStreak++
      } else {
        if (i === 0) continue // skip this week if no training yet (might be Monday)
        break
      }
    }

    // Longest streak
    let longestStreak = 0
    let tempStreak = 0
    const sortedWeeks = [...weekKeys].sort()
    for (let i = 0; i < sortedWeeks.length; i++) {
      if (i === 0) {
        tempStreak = 1
        continue
      }
      const prev = new Date(sortedWeeks[i - 1]! + "T00:00:00")
      const curr = new Date(sortedWeeks[i]! + "T00:00:00")
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays <= 7) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return {
      currentStreak,
      longestStreak,
      totalDays: trainingDays.length,
      lastTraining: trainingDays[0] ?? null,
    }
  }),

  /**
   * Compares the current member's attendance to the academy average.
   */
  myComparison: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]!

    // My attendance in last 30 days
    const { count: myCount } = await supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .gte("checked_in_at", thirtyDaysAgo)

    // All active students
    const { data: allStudents } = await supabase
      .from("members")
      .select("id")
      .eq("academy_id", ctx.academyId!)
      .eq("role", "student")
      .eq("status", "active")

    const studentIds = (allStudents ?? []).map((s) => s.id)

    if (studentIds.length === 0)
      return { myCount: 0, avgCount: 0, percentile: 0, totalStudents: 0 }

    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("member_id")
      .eq("academy_id", ctx.academyId!)
      .in("member_id", studentIds)
      .gte("checked_in_at", thirtyDaysAgo)

    // Count per student
    const counts = new Map<string, number>()
    for (const a of allAttendance ?? []) {
      counts.set(a.member_id, (counts.get(a.member_id) ?? 0) + 1)
    }

    const allCounts = studentIds.map((id) => counts.get(id) ?? 0)
    const avgCount =
      allCounts.length > 0
        ? Math.round(allCounts.reduce((a, b) => a + b, 0) / allCounts.length)
        : 0

    // Percentile: what % of students did I outperform?
    const myActual = myCount ?? 0
    const belowMe = allCounts.filter((c) => c < myActual).length
    const percentile =
      allCounts.length > 0 ? Math.round((belowMe / allCounts.length) * 100) : 0

    return {
      myCount: myActual,
      avgCount,
      percentile,
      totalStudents: studentIds.length,
    }
  }),

  /**
   * Returns the current member's billing status (overdue payments + block flag).
   * Used by the portal to show a payment-blocked banner.
   */
  myBillingStatus: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    return getMemberBillingStatus(supabase, ctx.academyId!, ctx.member!.id)
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

  /**
   * Títulos / conquistas em campeonatos do aluno logado.
   * Junta com a tabela `members` para mostrar a faixa do dia.
   */
  myTitles: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("member_titles")
      .select("id, title, competition, category, weight_class, placement, date, notes")
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .order("date", { ascending: false })

    if (error) return []
    return data ?? []
  }),

  /**
   * Próximas aulas (sessions) das próximas 7 dias.
   * Usado no card "Próxima aula" do home do aluno.
   */
  myNextSessions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const today = new Date().toISOString().split("T")[0]!
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!

      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("id, class_id, date, start_time, end_time, status")
        .eq("academy_id", ctx.academyId!)
        .gte("date", today)
        .lte("date", in7Days)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(input?.limit ?? 5)

      if (!sessions || sessions.length === 0) return []

      const classIds = [...new Set(sessions.map((s) => s.class_id))]
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, gi_type")
        .eq("academy_id", ctx.academyId!)
        .in("id", classIds)

      const classMap = new Map((classes ?? []).map((c) => [c.id, c]))

      return sessions.map((s) => {
        const cls = classMap.get(s.class_id)
        return {
          id: s.id,
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          status: s.status,
          className: cls?.name ?? "Aula",
          giType: cls?.gi_type ?? null,
        }
      })
    }),

  /**
   * Mural / informativos visíveis para o aluno (não expirados).
   * Versão enxuta da `announcement.list` que retorna direto o que o portal precisa.
   */
  myAnnouncements: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, priority, pinned, published_at, expires_at, author_id")
        .eq("academy_id", ctx.academyId!)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(input?.limit ?? 10)

      if (error || !data) return []

      const authorIds = [
        ...new Set(data.map((a) => a.author_id).filter((id): id is string => !!id)),
      ]

      let authorMap: Record<string, string> = {}
      if (authorIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("id, full_name")
          .in("id", authorIds)
        authorMap = Object.fromEntries((members ?? []).map((m) => [m.id, m.full_name]))
      }

      return data.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        pinned: a.pinned,
        publishedAt: a.published_at,
        authorName: a.author_id ? authorMap[a.author_id] ?? "Academia" : "Academia",
      }))
    }),
})
