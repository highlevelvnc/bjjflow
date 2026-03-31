import "server-only"
import { z } from "zod"
import { router } from "../init"
import { instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { BELT_ORDER } from "@/lib/constants/belts"

const CLASS_TYPES = ["regular", "open_mat", "competition_prep", "private", "seminar", "kids"] as const
const GI_TYPES = ["gi", "nogi", "both"] as const

const UpdateClassInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  class_type: z.enum(CLASS_TYPES).optional(),
  gi_type: z.enum(GI_TYPES).optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  max_students: z.number().int().min(1).max(500).nullable().optional(),
  default_instructor_id: z.string().uuid().nullable().optional(),
  belt_level_min: z.enum(BELT_ORDER).nullable().optional(),
  belt_level_max: z.enum(BELT_ORDER).nullable().optional(),
  room: z.string().max(100).optional(),
})

const CreateClassInput = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  class_type: z.enum(CLASS_TYPES).default("regular"),
  gi_type: z.enum(GI_TYPES).default("gi"),
  day_of_week: z.number().int().min(0).max(6).nullable(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_recurring: z.boolean().default(true),
  max_students: z.number().int().min(1).max(500).nullable().optional(),
  default_instructor_id: z.string().uuid().nullable().optional(),
  belt_level_min: z.enum(BELT_ORDER).nullable().optional(),
  belt_level_max: z.enum(BELT_ORDER).nullable().optional(),
  room: z.string().max(100).optional(),
})

export const classRouter = router({
  /** Lists all classes for the current academy. */
  list: instructorProcedure
    .input(
      z
        .object({
          activeOnly: z.boolean().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0
      const supabase = await createServerSupabase()

      let query = supabase
        .from("classes")
        .select(
          "id, name, description, class_type, gi_type, day_of_week, start_time, end_time, is_recurring, max_students, default_instructor_id, belt_level_min, belt_level_max, room, tags, is_active, created_at",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .order("day_of_week", { ascending: true, nullsFirst: false })
        .order("start_time", { ascending: true })
        .range(offset, offset + limit - 1)

      if (input?.activeOnly !== false) {
        query = query.eq("is_active", true)
      }

      const { data, count, error } = await query

      if (error) throw new Error("Failed to fetch classes")

      return { items: data ?? [], total: count ?? 0, limit, offset }
    }),

  /** Returns a single class by ID. */
  getById: instructorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .single()

      if (error || !data) throw new Error("Class not found")

      return data
    }),

  /** Admin: create a new class template. */
  create: adminProcedure.input(CreateClassInput).mutation(async ({ ctx, input }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("classes")
      .insert({
        academy_id: ctx.academyId!,
        name: input.name,
        description: input.description ?? null,
        class_type: input.class_type,
        gi_type: input.gi_type,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        is_recurring: input.is_recurring,
        max_students: input.max_students ?? null,
        default_instructor_id: input.default_instructor_id ?? null,
        belt_level_min: input.belt_level_min ?? null,
        belt_level_max: input.belt_level_max ?? null,
        room: input.room ?? null,
        tags: [],
        is_active: true,
      })
      .select("id, name, class_type, gi_type, day_of_week, start_time, end_time, is_active")
      .single()

    if (error) throw new Error("Failed to create class")

    return data
  }),

  /** Admin: toggle a class active/inactive (soft delete). */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid(), is_active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("classes")
        .update({ is_active: input.is_active })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .select("id")

      if (error) throw new Error("Failed to update class status")
      if (!data || data.length === 0) throw new Error("Class not found")

      return { success: true }
    }),

  /** Admin: update an existing class template. */
  update: adminProcedure.input(UpdateClassInput).mutation(async ({ ctx, input }) => {
    const supabase = await createServerSupabase()

    const { id, ...fields } = input
    const updateObj: Record<string, unknown> = {}

    if (fields.name !== undefined) updateObj.name = fields.name
    if (fields.description !== undefined) updateObj.description = fields.description || null
    if (fields.class_type !== undefined) updateObj.class_type = fields.class_type
    if (fields.gi_type !== undefined) updateObj.gi_type = fields.gi_type
    if (fields.day_of_week !== undefined) updateObj.day_of_week = fields.day_of_week
    if (fields.start_time !== undefined) updateObj.start_time = fields.start_time
    if (fields.end_time !== undefined) updateObj.end_time = fields.end_time
    if (fields.max_students !== undefined) updateObj.max_students = fields.max_students
    if (fields.default_instructor_id !== undefined) updateObj.default_instructor_id = fields.default_instructor_id
    if (fields.belt_level_min !== undefined) updateObj.belt_level_min = fields.belt_level_min
    if (fields.belt_level_max !== undefined) updateObj.belt_level_max = fields.belt_level_max
    if (fields.room !== undefined) updateObj.room = fields.room || null

    if (Object.keys(updateObj).length === 0) {
      throw new Error("No fields to update")
    }

    const { data, error } = await supabase
      .from("classes")
      .update(updateObj)
      .eq("academy_id", ctx.academyId!)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw new Error("Failed to update class")

    return data
  }),
})
