import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { BELT_ORDER } from "@/lib/constants/belts"

const CreateManagedMemberInput = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["student", "instructor"]),
  belt_rank: z.enum(BELT_ORDER),
  stripes: z.number().int().min(0).max(4),
  phone: z.string().max(30).optional().or(z.literal("")),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
})

export const memberRouter = router({
  /** Returns the current user's member row (populated by context). */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.member
  }),

  /** Returns aggregate member counts for the dashboard. */
  getCounts: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("members")
      .select("role, status")
      .eq("academy_id", ctx.academyId!)

    if (error) throw new Error("Failed to fetch member counts")

    const rows = data ?? []
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      students: rows.filter((r) => r.role === "student" && r.status === "active").length,
      instructors: rows.filter((r) => r.role === "instructor" && r.status === "active").length,
      admins: rows.filter((r) => r.role === "admin" && r.status === "active").length,
    }
  }),

  /** Lists all members in the current academy with optional filters. */
  list: instructorProcedure
    .input(
      z
        .object({
          role: z.enum(["admin", "instructor", "student"]).optional(),
          status: z.enum(["active", "inactive", "suspended"]).optional(),
          search: z.string().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      let query = supabase
        .from("members")
        .select(
          "id, full_name, email, role, status, belt_rank, stripes, has_portal_access, avatar_url, phone, last_check_in, total_classes, created_at",
        )
        .eq("academy_id", ctx.academyId!)
        .order("full_name", { ascending: true })

      if (input?.role) {
        query = query.eq("role", input.role)
      }
      if (input?.status) {
        query = query.eq("status", input.status)
      }
      if (input?.search) {
        const term = input.search.trim()
        query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      }

      const { data, error } = await query

      if (error) throw new Error("Failed to fetch members")

      return data ?? []
    }),

  /** Returns a single member by ID. */
  getById: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .single()

      if (error || !data) throw new Error("Member not found")

      return data
    }),

  /**
   * Returns students at risk of churning.
   *
   * Criteria (all must hold):
   *   1. Active student enrolled at least 14 days ago (not a brand-new member)
   *   2. Academy has had at least 4 completed sessions in the last 30 days
   *      (otherwise there's no meaningful baseline to compare against)
   *   3. Student's attendance rate in those sessions < 40%
   *
   * NOTE: We intentionally do NOT rely on members.total_classes because that
   * column is not maintained by any DB trigger — it would always read 0.
   * Instead we derive "established" status from created_at.
   */
  getAtRisk: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!
    // Only consider members who joined at least 14 days ago
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Completed sessions in the last 30 days
    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "completed")
      .gte("date", thirtyDaysAgo)

    if (!sessions || sessions.length < 4) return []

    const sessionIds = sessions.map((s) => s.id)
    const totalSessions = sessionIds.length

    // 2. Fetch established active students + their attendance in parallel
    const [attendanceResult, membersResult] = await Promise.all([
      supabase
        .from("attendance")
        .select("member_id")
        .eq("academy_id", ctx.academyId!)
        .in("session_id", sessionIds),
      supabase
        .from("members")
        .select("id, full_name, belt_rank, stripes")
        .eq("academy_id", ctx.academyId!)
        .eq("role", "student")
        .eq("status", "active")
        .lte("created_at", fourteenDaysAgo), // joined at least 14 days ago
    ])

    const attendanceCounts = new Map<string, number>()
    for (const record of attendanceResult.data ?? []) {
      attendanceCounts.set(record.member_id, (attendanceCounts.get(record.member_id) ?? 0) + 1)
    }

    return (membersResult.data ?? [])
      .filter((m) => {
        const count = attendanceCounts.get(m.id) ?? 0
        return count / totalSessions < 0.4 // < 40% attendance rate
      })
      .slice(0, 5)
      .map((m) => {
        const recentSessions = attendanceCounts.get(m.id) ?? 0
        const rate = Math.round((recentSessions / totalSessions) * 100)
        const reason =
          recentSessions === 0
            ? "No sessions in 30 days"
            : `Only ${recentSessions} of ${totalSessions} sessions`
        return { ...m, recentSessions, totalSessions, rate, reason }
      })
  }),

  /**
   * Creates a managed profile — a member without a portal account.
   * has_portal_access = false, user_id = null.
   * Only admins can create members.
   */
  createManaged: adminProcedure
    .input(CreateManagedMemberInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("members")
        .insert({
          academy_id: ctx.academyId!,
          created_by: ctx.userId!,
          full_name: input.full_name,
          email: input.email || null,
          role: input.role,
          belt_rank: input.belt_rank,
          stripes: input.stripes,
          phone: input.phone || null,
          birth_date: input.birth_date || null,
          notes: input.notes || null,
          has_portal_access: false,
          status: "active",
        })
        .select("id, full_name, role, belt_rank, stripes, has_portal_access")
        .single()

      if (error) {
        if (error.code === "23505") throw new Error("A member with this email already exists")
        throw new Error("Failed to create member")
      }

      return data
    }),
})
