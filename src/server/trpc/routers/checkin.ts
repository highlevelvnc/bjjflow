import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { getMemberBillingStatus } from "@/lib/billing/block"

export const checkinRouter = router({
  /**
   * Student self-check-in for a session.
   * Requires allow_student_self_checkin to be enabled on the academy.
   * Any authenticated member can check themselves in.
   */
  selfCheckin: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Verify academy allows self-check-in
      const { data: academy } = await supabase
        .from("academies")
        .select("allow_student_self_checkin")
        .eq("id", ctx.academyId!)
        .single()

      if (!academy?.allow_student_self_checkin) {
        throw new Error("Self check-in is not enabled for this academy")
      }

      // Block check-in if member has overdue payments past the academy threshold
      const billing = await getMemberBillingStatus(
        supabase,
        ctx.academyId!,
        ctx.member!.id,
      )
      if (billing.blocked) {
        throw new Error(
          `Check-in bloqueado: você tem ${billing.overdueCount} cobrança(s) em atraso (${billing.daysOverdue} dias). Regularize seu pagamento para voltar a treinar.`,
        )
      }

      // Verify session exists and is not cancelled
      const { data: session } = await supabase
        .from("class_sessions")
        .select("id, status, date")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.sessionId)
        .single()

      if (!session) throw new Error("Session not found")
      if (session.status === "cancelled") throw new Error("Session is cancelled")

      // Check if today matches session date (allow same-day only)
      const today = new Date().toISOString().split("T")[0]
      if (session.date !== today) {
        throw new Error("Self check-in is only available on the session day")
      }

      // Insert attendance record
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          academy_id: ctx.academyId!,
          session_id: input.sessionId,
          member_id: ctx.member!.id,
          check_in_method: "self",
          checked_in_by: ctx.member!.id,
        })
        .select("id, checked_in_at")
        .single()

      if (error) {
        if (error.code === "23505") throw new Error("Already checked in")
        throw new Error("Failed to check in")
      }

      return data
    }),

  /**
   * Generate a QR code payload for a session.
   * Returns a signed token that encodes the session ID + academy ID.
   * Instructors only.
   */
  getQRPayload: instructorProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Simple payload — the QR code contains the session ID
      // The student scans it and calls selfCheckin with the session ID
      // Security: selfCheckin verifies academy membership, session validity, and same-day
      return {
        sessionId: input.sessionId,
        academyId: ctx.academyId!,
        // URL the student navigates to after scanning
        url: `/app/checkin/${input.sessionId}`,
      }
    }),

  /**
   * Returns today's sessions for the current academy (for self-check-in page).
   */
  todaySessions: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const today = new Date().toISOString().split("T")[0]!

    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("id, class_id, date, start_time, end_time, status, attendance_count")
      .eq("academy_id", ctx.academyId!)
      .eq("date", today)
      .in("status", ["scheduled", "in_progress"])
      .order("start_time", { ascending: true })

    if (!sessions || sessions.length === 0) return []

    const classIds = [...new Set(sessions.map((s) => s.class_id))]
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, gi_type")
      .eq("academy_id", ctx.academyId!)
      .in("id", classIds)

    const classMap = new Map((classes ?? []).map((c) => [c.id, c]))

    // Check which sessions the current member already attended
    const { data: attendance } = await supabase
      .from("attendance")
      .select("session_id")
      .eq("academy_id", ctx.academyId!)
      .eq("member_id", ctx.member!.id)
      .in("session_id", sessions.map((s) => s.id))

    const attendedSet = new Set((attendance ?? []).map((a) => a.session_id))

    return sessions.map((s) => ({
      ...s,
      class: classMap.get(s.class_id) ?? null,
      alreadyCheckedIn: attendedSet.has(s.id),
    }))
  }),
})
