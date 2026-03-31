import "server-only"
import { z } from "zod"
import { router } from "../init"
import { instructorProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

/** Returns the next N dates (ISO strings) for a given day of week. */
function upcomingDates(dayOfWeek: number, weeksAhead: number): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayDay = today.getDay()
  let daysUntilFirst = (dayOfWeek - todayDay + 7) % 7
  // If today matches, schedule starting next week
  if (daysUntilFirst === 0) daysUntilFirst = 7

  for (let week = 0; week < weeksAhead; week++) {
    const d = new Date(today)
    d.setDate(today.getDate() + daysUntilFirst + week * 7)
    // Use local date parts — toISOString() would emit UTC and give yesterday on UTC−N servers
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    )
  }
  return dates
}

const UpdateSessionInput = z.object({
  id: z.string().uuid(),
  instructor_id: z.string().uuid().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().max(1000).optional(),
  topic: z.string().max(200).optional(),
})

export const sessionRouter = router({
  /**
   * Lists sessions within a date range.
   * Defaults to last 7 days + next 14 days.
   */
  list: instructorProcedure
    .input(
      z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          classId: z.string().uuid().optional(),
          status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0
      const supabase = await createServerSupabase()

      const today = new Date()
      const defaultFrom = new Date(today)
      defaultFrom.setDate(today.getDate() - 7)
      const defaultTo = new Date(today)
      defaultTo.setDate(today.getDate() + 14)

      const fromDate = input?.from ?? defaultFrom.toISOString().split("T")[0]!
      const toDate = input?.to ?? defaultTo.toISOString().split("T")[0]!

      let query = supabase
        .from("class_sessions")
        .select(
          "id, academy_id, class_id, date, start_time, end_time, instructor_id, status, attendance_count, notes, topic, cancelled_by, cancel_reason, created_at",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .gte("date", fromDate)
        .lte("date", toDate)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .range(offset, offset + limit - 1)

      if (input?.classId) query = query.eq("class_id", input.classId)
      if (input?.status) query = query.eq("status", input.status)

      const { data: sessions, count, error } = await query

      if (error) throw new Error("Failed to fetch sessions")

      if (!sessions || sessions.length === 0) return { items: [], total: count ?? 0, limit, offset }

      // Resolve class names and instructor names in parallel
      const classIds = [...new Set(sessions.map((s) => s.class_id))]
      const instructorIds = [
        ...new Set(sessions.map((s) => s.instructor_id).filter((id): id is string => id !== null)),
      ]

      const [classesResult, instructorsResult] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, gi_type, class_type")
          .eq("academy_id", ctx.academyId!)
          .in("id", classIds),
        instructorIds.length > 0
          ? supabase
              .from("members")
              .select("id, full_name")
              .eq("academy_id", ctx.academyId!)
              .in("id", instructorIds)
          : Promise.resolve({ data: [] }),
      ])

      const classMap = new Map((classesResult.data ?? []).map((c) => [c.id, c]))
      const instructorMap = new Map((instructorsResult.data ?? []).map((m) => [m.id, m]))

      const items = sessions.map((s) => ({
        ...s,
        class: classMap.get(s.class_id) ?? null,
        instructor: s.instructor_id ? (instructorMap.get(s.instructor_id) ?? null) : null,
      }))

      return { items, total: count ?? 0, limit, offset }
    }),

  /** Lists the next N upcoming sessions (for dashboard). */
  listUpcoming: instructorProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const today = new Date().toISOString().split("T")[0]!

      const { data: sessions, error } = await supabase
        .from("class_sessions")
        .select(
          "id, class_id, date, start_time, end_time, instructor_id, status, attendance_count",
        )
        .eq("academy_id", ctx.academyId!)
        .in("status", ["scheduled", "in_progress"])
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(input?.limit ?? 5)

      if (error) throw new Error("Failed to fetch upcoming sessions")
      if (!sessions || sessions.length === 0) return []

      const classIds = [...new Set(sessions.map((s) => s.class_id))]
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, gi_type")
        .eq("academy_id", ctx.academyId!)
        .in("id", classIds)

      const classMap = new Map((classes ?? []).map((c) => [c.id, c]))

      return sessions.map((s) => ({
        ...s,
        class: classMap.get(s.class_id) ?? null,
      }))
    }),

  /** Returns a single session with full class + instructor info. */
  getById: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data: session, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .single()

      if (error || !session) throw new Error("Session not found")

      const [classResult, instructorResult] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, gi_type, class_type, max_students")
          .eq("academy_id", ctx.academyId!)
          .eq("id", session.class_id)
          .single(),
        session.instructor_id
          ? supabase
              .from("members")
              .select("id, full_name, belt_rank")
              .eq("academy_id", ctx.academyId!)
              .eq("id", session.instructor_id)
              .single()
          : Promise.resolve({ data: null }),
      ])

      return {
        ...session,
        class: classResult.data ?? null,
        instructor: instructorResult.data ?? null,
      }
    }),

  /**
   * Generates upcoming sessions for a recurring class.
   * Respects the UNIQUE (class_id, date) constraint — skips existing dates.
   */
  generateUpcoming: instructorProcedure
    .input(
      z.object({
        classId: z.string().uuid(),
        weeksAhead: z.number().int().min(1).max(12).default(4),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data: template, error: templateError } = await supabase
        .from("classes")
        .select("id, day_of_week, start_time, end_time, default_instructor_id, is_active")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.classId)
        .single()

      if (templateError || !template) throw new Error("Class not found")
      if (!template.is_active) throw new Error("Cannot generate sessions for an inactive class")
      if (template.day_of_week === null)
        throw new Error("Class has no scheduled day — set a day of week first")

      const dates = upcomingDates(template.day_of_week, input.weeksAhead)

      const rows = dates.map((date) => ({
        academy_id: ctx.academyId!,
        class_id: template.id,
        date,
        start_time: template.start_time,
        end_time: template.end_time,
        instructor_id: template.default_instructor_id ?? null,
        status: "scheduled" as const,
      }))

      // onConflict: skip existing (class_id, date) pairs
      const { data, error } = await supabase
        .from("class_sessions")
        .upsert(rows, { onConflict: "class_id,date", ignoreDuplicates: true })
        .select("id, date")

      if (error) throw new Error("Failed to generate sessions")

      return { created: data?.length ?? 0, dates }
    }),

  /** Cancels a scheduled session. */
  cancel: instructorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        cancel_reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("class_sessions")
        .update({
          status: "cancelled",
          cancelled_by: ctx.member!.id,
          cancel_reason: input.cancel_reason ?? null,
        })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .eq("status", "scheduled")   // only cancellable from "scheduled"
        .select("id")

      if (error) throw new Error("Failed to cancel session")
      // If no rows matched the status filter, the session was already cancelled/completed
      if (!data || data.length === 0) throw new Error("Session cannot be cancelled — it may already be cancelled or completed")

      return { success: true }
    }),

  /** Marks a session as completed. */
  complete: instructorProcedure
    .input(z.object({ id: z.string().uuid(), notes: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("class_sessions")
        .update({
          status: "completed",
          notes: input.notes ?? null,
        })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .in("status", ["scheduled", "in_progress"])
        .select("id")

      if (error) throw new Error("Failed to complete session")
      if (!data || data.length === 0) throw new Error("Session cannot be completed — it may already be completed or cancelled")

      return { success: true }
    }),

  /** Instructor: update a scheduled or in-progress session. */
  update: instructorProcedure
    .input(UpdateSessionInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { id, ...fields } = input
      const updateObj: Record<string, unknown> = {}

      if (fields.instructor_id !== undefined) updateObj.instructor_id = fields.instructor_id
      if (fields.start_time !== undefined) updateObj.start_time = fields.start_time
      if (fields.end_time !== undefined) updateObj.end_time = fields.end_time
      if (fields.notes !== undefined) updateObj.notes = fields.notes || null
      if (fields.topic !== undefined) updateObj.topic = fields.topic || null

      if (Object.keys(updateObj).length === 0) {
        throw new Error("No fields to update")
      }

      const { data, error } = await supabase
        .from("class_sessions")
        .update(updateObj)
        .eq("academy_id", ctx.academyId!)
        .eq("id", id)
        .in("status", ["scheduled", "in_progress"])
        .select("*")
        .single()

      if (error) throw new Error("Failed to update session")
      if (!data) throw new Error("Session not found or cannot be updated — it may be completed or cancelled")

      return data
    }),
})
