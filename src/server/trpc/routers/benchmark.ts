import "server-only"
import { router } from "../init"
import { instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

/** Industry benchmarks for BJJ academies (based on industry data). */
const BENCHMARKS = {
  avgAttendancePerSession: { p25: 8, p50: 14, p75: 22, p90: 30 },
  retentionRate: { p25: 0.45, p50: 0.62, p75: 0.78, p90: 0.88 },
  sessionsPerWeek: { p25: 8, p50: 15, p75: 22, p90: 30 },
  growthRate: { p25: 0.02, p50: 0.05, p75: 0.10, p90: 0.15 },
} as const

type Percentiles = { p25: number; p50: number; p75: number; p90: number }

/**
 * Estimate the academy's percentile given a value and benchmark percentiles.
 * Returns an estimated percentile (0-100).
 */
function estimatePercentile(value: number, bench: Percentiles): number {
  if (value <= 0) return 0
  if (value < bench.p25) {
    // Linear interpolation 0 -> 25
    return Math.round((value / bench.p25) * 25)
  }
  if (value < bench.p50) {
    // 25 -> 50
    return Math.round(25 + ((value - bench.p25) / (bench.p50 - bench.p25)) * 25)
  }
  if (value < bench.p75) {
    // 50 -> 75
    return Math.round(50 + ((value - bench.p50) / (bench.p75 - bench.p50)) * 25)
  }
  if (value < bench.p90) {
    // 75 -> 90
    return Math.round(75 + ((value - bench.p75) / (bench.p90 - bench.p75)) * 15)
  }
  // Above p90: 90 -> 99
  const excess = value - bench.p90
  const margin = bench.p90 * 0.5 // allow 50% above p90 to reach ~99
  return Math.min(99, Math.round(90 + (excess / margin) * 9))
}

function ratingFromPercentile(
  pct: number,
): "excellent" | "good" | "average" | "below_average" | "needs_improvement" {
  if (pct >= 75) return "excellent"
  if (pct >= 50) return "good"
  if (pct >= 35) return "average"
  if (pct >= 20) return "below_average"
  return "needs_improvement"
}

export const benchmarkRouter = router({
  /**
   * Calculate key metrics for the current academy.
   */
  myAcademyStats: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgoDate = thirtyDaysAgo.split("T")[0]!
    const ninetyDaysAgoDate = ninetyDaysAgo.split("T")[0]!

    const [membersRes, sessionsRes, attendanceRes, newMembersRes] = await Promise.all([
      // All members
      supabase
        .from("members")
        .select("id, status, created_at")
        .eq("academy_id", ctx.academyId!),
      // Completed sessions in last 90 days
      supabase
        .from("class_sessions")
        .select("id, date")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "completed")
        .gte("date", ninetyDaysAgoDate),
      // Attendance in last 30 days
      supabase
        .from("attendance")
        .select("member_id, session_id")
        .eq("academy_id", ctx.academyId!)
        .gte("checked_in_at", thirtyDaysAgo),
      // New members in last 30 days
      supabase
        .from("members")
        .select("id")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "active")
        .gte("created_at", thirtyDaysAgo),
    ])

    const members = membersRes.data ?? []
    const sessions = sessionsRes.data ?? []
    const attendanceRecords = attendanceRes.data ?? []
    const newMembers = newMembersRes.data ?? []

    const activeMembers = members.filter((m) => m.status === "active").length

    // Average attendance per session (last 30 days)
    // Count sessions in last 30 days
    const recentSessions = sessions.filter((s) => s.date >= thirtyDaysAgoDate!)
    const recentSessionIds = new Set(recentSessions.map((s) => s.id))
    const recentAttendance = attendanceRecords.filter((a) => recentSessionIds.has(a.session_id))
    const avgAttendancePerSession =
      recentSessions.length > 0
        ? Math.round((recentAttendance.length / recentSessions.length) * 10) / 10
        : 0

    // Retention rate: members active in last 30 days / members who joined 90+ days ago
    const activeInLast30 = new Set(attendanceRecords.map((a) => a.member_id)).size
    const established = members.filter(
      (m) => m.created_at <= ninetyDaysAgo && m.status === "active",
    ).length
    const retentionRate = established > 0 ? Math.round((activeInLast30 / established) * 100) / 100 : 0

    // Sessions per week (last 90 days)
    const weeksIn90Days = 90 / 7
    const sessionsPerWeek =
      sessions.length > 0 ? Math.round((sessions.length / weeksIn90Days) * 10) / 10 : 0

    // Growth rate: new members last 30 days / total active
    const totalActive = members.filter((m) => m.status === "active").length
    const growthRate =
      totalActive > 0 ? Math.round((newMembers.length / totalActive) * 100) / 100 : 0

    return {
      activeMembers,
      avgAttendancePerSession,
      retentionRate: Math.min(retentionRate, 1), // cap at 100%
      sessionsPerWeek,
      growthRate,
    }
  }),

  /**
   * Compare the academy's stats against industry benchmarks.
   * Returns a percentile ranking for each metric.
   */
  industryBenchmark: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // Re-use the same logic as myAcademyStats to get current metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgoDate = thirtyDaysAgo.split("T")[0]!
    const ninetyDaysAgoDate = ninetyDaysAgo.split("T")[0]!

    const [membersRes, sessionsRes, attendanceRes, newMembersRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, status, created_at")
        .eq("academy_id", ctx.academyId!),
      supabase
        .from("class_sessions")
        .select("id, date")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "completed")
        .gte("date", ninetyDaysAgoDate),
      supabase
        .from("attendance")
        .select("member_id, session_id")
        .eq("academy_id", ctx.academyId!)
        .gte("checked_in_at", thirtyDaysAgo),
      supabase
        .from("members")
        .select("id")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "active")
        .gte("created_at", thirtyDaysAgo),
    ])

    const members = membersRes.data ?? []
    const sessions = sessionsRes.data ?? []
    const attendanceRecords = attendanceRes.data ?? []
    const newMembers = newMembersRes.data ?? []

    // Calculate metrics
    const recentSessions = sessions.filter((s) => s.date >= thirtyDaysAgoDate!)
    const recentSessionIds = new Set(recentSessions.map((s) => s.id))
    const recentAttendance = attendanceRecords.filter((a) => recentSessionIds.has(a.session_id))
    const avgAttendancePerSession =
      recentSessions.length > 0 ? recentAttendance.length / recentSessions.length : 0

    const activeInLast30 = new Set(attendanceRecords.map((a) => a.member_id)).size
    const established = members.filter(
      (m) => m.created_at <= ninetyDaysAgo && m.status === "active",
    ).length
    const retentionRate = established > 0 ? Math.min(activeInLast30 / established, 1) : 0

    const weeksIn90Days = 90 / 7
    const sessionsPerWeek = sessions.length > 0 ? sessions.length / weeksIn90Days : 0

    const totalActive = members.filter((m) => m.status === "active").length
    const growthRate = totalActive > 0 ? newMembers.length / totalActive : 0

    // Compare against benchmarks
    const metrics = [
      {
        name: "Avg Attendance / Session",
        key: "avgAttendancePerSession" as const,
        value: Math.round(avgAttendancePerSession * 10) / 10,
        format: "number" as const,
      },
      {
        name: "Retention Rate",
        key: "retentionRate" as const,
        value: Math.round(retentionRate * 100) / 100,
        format: "percent" as const,
      },
      {
        name: "Sessions / Week",
        key: "sessionsPerWeek" as const,
        value: Math.round(sessionsPerWeek * 10) / 10,
        format: "number" as const,
      },
      {
        name: "Growth Rate",
        key: "growthRate" as const,
        value: Math.round(growthRate * 100) / 100,
        format: "percent" as const,
      },
    ]

    return {
      metrics: metrics.map((m) => {
        const bench = BENCHMARKS[m.key]
        const percentile = estimatePercentile(m.value, bench)
        return {
          name: m.name,
          value: m.value,
          format: m.format,
          percentile,
          rating: ratingFromPercentile(percentile),
          p25: bench.p25,
          p50: bench.p50,
          p75: bench.p75,
          p90: bench.p90,
        }
      }),
    }
  }),
})
