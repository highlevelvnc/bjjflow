import "server-only"
import { router } from "../init"
import { instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ninetyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function thirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function sixtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 60)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

export const analyticsRouter = router({
  /**
   * Returns attendance data per class per day-of-week for the last 90 days.
   * Used to display class fill rates.
   */
  classHeatmap: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const cutoff = ninetyDaysAgo()

    // 1. Get all completed sessions in last 90 days
    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("id, class_id, date, attendance_count")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", cutoff)
      .order("date", { ascending: true })

    if (!sessions || sessions.length === 0) return []

    // 2. Get class info
    const classIds = [...new Set(sessions.map((s) => s.class_id))]
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, day_of_week, max_students")
      .eq("academy_id", ctx.academyId!)
      .in("id", classIds)

    const classMap = new Map((classes ?? []).map((c) => [c.id, c]))

    // 3. Group by class_id and day_of_week
    const grouped = new Map<
      string,
      { totalAttendance: number; maxAttendance: number; sessionCount: number }
    >()

    for (const session of sessions) {
      const cls = classMap.get(session.class_id)
      if (!cls) continue
      const dayOfWeek = new Date(session.date + "T00:00:00").getDay()
      const key = `${session.class_id}::${dayOfWeek}`

      const existing = grouped.get(key) ?? {
        totalAttendance: 0,
        maxAttendance: 0,
        sessionCount: 0,
      }

      existing.totalAttendance += session.attendance_count
      existing.maxAttendance = Math.max(existing.maxAttendance, session.attendance_count)
      existing.sessionCount += 1
      grouped.set(key, existing)
    }

    // 4. Build result
    const result: {
      classId: string
      className: string
      dayOfWeek: number
      avgAttendance: number
      maxAttendance: number
      totalSessions: number
      fillRate: number
    }[] = []

    for (const [key, data] of grouped.entries()) {
      const [classId, dayStr] = key.split("::")
      const cls = classMap.get(classId!)
      if (!cls) continue

      const avg = data.totalAttendance / data.sessionCount
      const maxStudents = cls.max_students ?? 0

      result.push({
        classId: classId!,
        className: cls.name,
        dayOfWeek: Number(dayStr),
        avgAttendance: Math.round(avg * 10) / 10,
        maxAttendance: data.maxAttendance,
        totalSessions: data.sessionCount,
        fillRate: maxStudents > 0 ? Math.round((avg / maxStudents) * 100) : 0,
      })
    }

    return result
  }),

  /**
   * Returns attendance distribution by hour of day.
   */
  hourlyDistribution: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const cutoff = ninetyDaysAgo()

    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("start_time, attendance_count")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", cutoff)

    if (!sessions || sessions.length === 0) return []

    // Group by hour
    const hourMap = new Map<number, { totalAttendance: number; count: number }>()

    for (const session of sessions) {
      const hour = parseInt(session.start_time.split(":")[0]!, 10)
      const existing = hourMap.get(hour) ?? { totalAttendance: 0, count: 0 }
      existing.totalAttendance += session.attendance_count
      existing.count += 1
      hourMap.set(hour, existing)
    }

    const result: { hour: number; avgAttendance: number; totalSessions: number }[] = []

    for (const [hour, data] of hourMap.entries()) {
      result.push({
        hour,
        avgAttendance: Math.round((data.totalAttendance / data.count) * 10) / 10,
        totalSessions: data.count,
      })
    }

    return result.sort((a, b) => a.hour - b.hour)
  }),

  /**
   * Returns a day x hour grid of average attendance for a visual heatmap.
   */
  weeklyHeatmap: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const cutoff = ninetyDaysAgo()

    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("date, start_time, attendance_count")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", cutoff)

    if (!sessions || sessions.length === 0) {
      return { grid: [] as { day: number; hour: number; value: number }[], maxValue: 0 }
    }

    // Build a map of day+hour → attendance values
    const cellMap = new Map<string, number[]>()

    for (const session of sessions) {
      const dayOfWeek = new Date(session.date + "T00:00:00").getDay()
      const hour = parseInt(session.start_time.split(":")[0]!, 10)
      const key = `${dayOfWeek}::${hour}`
      const existing = cellMap.get(key) ?? []
      existing.push(session.attendance_count)
      cellMap.set(key, existing)
    }

    const grid: { day: number; hour: number; value: number }[] = []
    let maxValue = 0

    for (const [key, values] of cellMap.entries()) {
      const [dayStr, hourStr] = key.split("::")
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const rounded = Math.round(avg * 10) / 10
      if (rounded > maxValue) maxValue = rounded

      grid.push({
        day: Number(dayStr),
        hour: Number(hourStr),
        value: rounded,
      })
    }

    return { grid, maxValue }
  }),

  /**
   * ML-lite churn scoring based on attendance pattern analysis.
   * Returns top 20 students sorted by churn score descending.
   */
  churnPrediction: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const _now = todayStr()
    const d30 = thirtyDaysAgo()
    const d60 = sixtyDaysAgo()
    const d90 = ninetyDaysAgo()

    // 1. Get all active students
    const { data: students } = await supabase
      .from("members")
      .select("id, full_name, belt_rank, stripes, created_at")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "active")
      .in("role", ["student"])

    if (!students || students.length === 0) return []

    // 2. Get all attendance records for the last 90 days
    //    We need to join through class_sessions to get dates
    const { data: allSessions } = await supabase
      .from("class_sessions")
      .select("id, date")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", d90)

    if (!allSessions || allSessions.length === 0) {
      // No sessions at all — everyone gets a high churn score
      return students.slice(0, 20).map((s) => ({
        memberId: s.id,
        memberName: s.full_name,
        beltRank: s.belt_rank,
        churnScore: 90,
        currentFreq: 0,
        previousFreq: 0,
        trend: 0,
        daysSinceLastSession: 90,
        riskLevel: "critical" as const,
      }))
    }

    const sessionIds = allSessions.map((s) => s.id)
    const sessionDateMap = new Map(allSessions.map((s) => [s.id, s.date]))

    // Batch-fetch all attendance records for these sessions
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("member_id, session_id")
      .eq("academy_id", ctx.academyId!)
      .in("session_id", sessionIds)

    // Build member attendance map
    const memberAttendance = new Map<string, string[]>() // member_id → dates[]
    for (const record of allAttendance ?? []) {
      const date = sessionDateMap.get(record.session_id)
      if (!date) continue
      const dates = memberAttendance.get(record.member_id) ?? []
      dates.push(date)
      memberAttendance.set(record.member_id, dates)
    }

    // 3. Score each student
    const results: {
      memberId: string
      memberName: string
      beltRank: string
      churnScore: number
      currentFreq: number
      previousFreq: number
      trend: number
      daysSinceLastSession: number
      riskLevel: "critical" | "high" | "medium" | "low"
    }[] = []

    const nowMs = Date.now()

    for (const student of students) {
      const dates = memberAttendance.get(student.id) ?? []

      // Split into periods
      const last30 = dates.filter((d) => d >= d30)
      const days31to60 = dates.filter((d) => d >= d60 && d < d30)
      const _totalSessions90d = dates.length

      // Frequencies (sessions per week)
      const currentFreq = Math.round((last30.length / 4.3) * 10) / 10
      const previousFreq = Math.round((days31to60.length / 4.3) * 10) / 10

      // Trend
      const trend = previousFreq > 0 ? Math.round((currentFreq / previousFreq) * 100) / 100 : currentFreq > 0 ? 2 : 0

      // Days since last session
      let daysSinceLastSession = 90
      if (dates.length > 0) {
        const sortedDates = [...dates].sort((a, b) => b.localeCompare(a))
        const lastDate = new Date(sortedDates[0]! + "T00:00:00")
        daysSinceLastSession = Math.floor((nowMs - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Score (0-100, higher = more likely to churn)
      let churnScore: number
      if (last30.length === 0) {
        churnScore = 90
      } else if (trend < 0.5) {
        churnScore = Math.min(90, 70 + Math.round((1 - trend) * 20))
      } else if (trend < 0.8) {
        churnScore = Math.min(80, 50 + Math.round((1 - trend) * 30))
      } else if (trend <= 1.2) {
        churnScore = 20
      } else {
        churnScore = 10
      }

      // Adjust: +10 if daysSinceLastSession > 14
      if (daysSinceLastSession > 14) {
        churnScore = Math.min(100, churnScore + 10)
      }

      // Risk level
      let riskLevel: "critical" | "high" | "medium" | "low"
      if (churnScore >= 80) riskLevel = "critical"
      else if (churnScore >= 60) riskLevel = "high"
      else if (churnScore >= 40) riskLevel = "medium"
      else riskLevel = "low"

      results.push({
        memberId: student.id,
        memberName: student.full_name,
        beltRank: student.belt_rank,
        churnScore,
        currentFreq,
        previousFreq,
        trend,
        daysSinceLastSession,
        riskLevel,
      })
    }

    // Return top 20 sorted by churn score desc
    return results.sort((a, b) => b.churnScore - a.churnScore).slice(0, 20)
  }),

  /**
   * Monthly cohort retention analysis.
   * Groups students by the month they joined, shows how many are still active.
   */
  retentionCohorts: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const d30 = thirtyDaysAgo()

    // Get all students (active)
    const { data: students } = await supabase
      .from("members")
      .select("id, created_at, status")
      .eq("academy_id", ctx.academyId!)
      .in("role", ["student"])

    if (!students || students.length === 0) return []

    // Get attendance in last 30 days to determine "still active"
    const { data: recentSessions } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", d30)

    const recentSessionIds = (recentSessions ?? []).map((s) => s.id)

    let activeMembers = new Set<string>()

    if (recentSessionIds.length > 0) {
      const { data: recentAttendance } = await supabase
        .from("attendance")
        .select("member_id")
        .eq("academy_id", ctx.academyId!)
        .in("session_id", recentSessionIds)

      activeMembers = new Set((recentAttendance ?? []).map((a) => a.member_id))
    }

    // Group students by join month (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 6)

    const cohortMap = new Map<string, { total: number; active: number }>()

    for (const student of students) {
      const joinDate = new Date(student.created_at)
      if (joinDate < sixMonthsAgo) continue

      const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, "0")}`
      const existing = cohortMap.get(monthKey) ?? { total: 0, active: 0 }
      existing.total += 1
      if (activeMembers.has(student.id)) {
        existing.active += 1
      }
      cohortMap.set(monthKey, existing)
    }

    // Build result sorted by month
    const result: {
      month: string
      totalJoined: number
      stillActive: number
      retentionRate: number
    }[] = []

    const sortedKeys = [...cohortMap.keys()].sort()
    for (const key of sortedKeys) {
      const data = cohortMap.get(key)!
      const retentionRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0

      // Format month label
      const [year, month] = key.split("-")
      const monthDate = new Date(Number(year), Number(month) - 1)
      const label = monthDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

      result.push({
        month: label,
        totalJoined: data.total,
        stillActive: data.active,
        retentionRate,
      })
    }

    return result
  }),
})
