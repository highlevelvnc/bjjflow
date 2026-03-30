import "server-only"
import { z } from "zod"
import { router } from "../init"
import { instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const attendanceRouter = router({
  /**
   * Returns session info + all eligible members + existing attendance records.
   * Used to render the attendance-taking page.
   */
  forSession: instructorProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const [sessionResult, membersResult, attendanceResult] = await Promise.all([
        supabase
          .from("class_sessions")
          .select("id, class_id, date, start_time, end_time, status, attendance_count")
          .eq("academy_id", ctx.academyId!)
          .eq("id", input.sessionId)
          .single(),
        supabase
          .from("members")
          .select("id, full_name, belt_rank, stripes, role, avatar_url")
          .eq("academy_id", ctx.academyId!)
          .eq("status", "active")
          .order("full_name", { ascending: true }),
        supabase
          .from("attendance")
          .select("id, member_id, checked_in_at, check_in_method")
          .eq("academy_id", ctx.academyId!)   // explicit tenant filter; RLS is the last line of defence
          .eq("session_id", input.sessionId),
      ])

      if (sessionResult.error || !sessionResult.data) throw new Error("Session not found")

      const classResult = await supabase
        .from("classes")
        .select("id, name, gi_type, class_type")
        .eq("academy_id", ctx.academyId!)     // never fetch a class from a foreign tenant
        .eq("id", sessionResult.data.class_id)
        .single()

      return {
        session: {
          ...sessionResult.data,
          class: classResult.data ?? null,
        },
        members: membersResult.data ?? [],
        attendance: attendanceResult.data ?? [],
      }
    }),

  /** Marks a member as present (inserts attendance record). */
  mark: instructorProcedure
    .input(z.object({ sessionId: z.string().uuid(), memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Guard: only allow marking on non-cancelled sessions
      const { data: session } = await supabase
        .from("class_sessions")
        .select("status")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.sessionId)
        .single()

      if (!session) throw new Error("Session not found")
      if (session.status === "cancelled")
        throw new Error("Cannot mark attendance for a cancelled session")

      const { data, error } = await supabase
        .from("attendance")
        .insert({
          academy_id: ctx.academyId!,
          session_id: input.sessionId,
          member_id: input.memberId,
          check_in_method: "manual",
          checked_in_by: ctx.member!.id,
        })
        .select("id, member_id, checked_in_at")
        .single()

      if (error) {
        if (error.code === "23505") throw new Error("Member already marked present")
        throw new Error("Failed to mark attendance")
      }

      return data
    }),

  /** Removes an attendance record (unmarks a member). */
  unmark: instructorProcedure
    .input(z.object({ sessionId: z.string().uuid(), memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Guard: only allow unmarking on non-cancelled sessions
      const { data: session } = await supabase
        .from("class_sessions")
        .select("status")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.sessionId)
        .single()

      if (!session) throw new Error("Session not found")
      if (session.status === "cancelled")
        throw new Error("Cannot modify attendance for a cancelled session")

      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("academy_id", ctx.academyId!)
        .eq("session_id", input.sessionId)
        .eq("member_id", input.memberId)

      if (error) throw new Error("Failed to unmark attendance")

      return { success: true }
    }),
})
