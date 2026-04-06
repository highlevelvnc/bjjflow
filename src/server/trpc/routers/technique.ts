import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const techniqueRouter = router({
  /**
   * Returns today's technique for the academy.
   * Uses day-of-year as a seed to rotate through available techniques.
   */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data: techniques } = await supabase
      .from("techniques")
      .select(
        "id, name, description, position, category, belt_level, instructions, key_points",
      )
      .eq("academy_id", ctx.academyId!)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (!techniques || techniques.length === 0) return null

    // Use day-of-year as seed
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const index = dayOfYear % techniques.length

    return techniques[index]!
  }),

  /**
   * Lists all techniques for the academy with pagination.
   * Instructor+ access required.
   */
  list: instructorProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      const { data, count } = await supabase
        .from("techniques")
        .select(
          "id, name, description, position, category, belt_level, difficulty, instructions, key_points, tags, is_published, sort_order, created_at",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1)

      return { items: data ?? [], total: count ?? 0 }
    }),

  /**
   * Creates a new technique. Admin access required.
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        position: z.string().min(1).max(100),
        category: z.string().min(1).max(100),
        belt_level: z.string().max(50).default("white"),
        instructions: z.string().max(5000).optional(),
        key_points: z.array(z.string().max(500)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("techniques")
        .insert({
          academy_id: ctx.academyId!,
          name: input.name,
          description: input.description ?? null,
          position: input.position,
          category: input.category,
          belt_level: input.belt_level,
          instructions: input.instructions ?? null,
          key_points: input.key_points ?? null,
          created_by: ctx.member!.id,
        })
        .select("id, name")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Manually set today's technique by linking it to today's sessions.
   * Instructor+ access required.
   */
  setTodayTechnique: instructorProcedure
    .input(
      z.object({
        techniqueId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const today = new Date().toISOString().split("T")[0]!

      // Get today's sessions
      const { data: sessions } = await supabase
        .from("class_sessions")
        .select("id")
        .eq("academy_id", ctx.academyId!)
        .eq("date", today)

      if (!sessions || sessions.length === 0) {
        return { linked: 0 }
      }

      // Link technique to each of today's sessions (ignore duplicates)
      let linked = 0
      for (const session of sessions) {
        const { error } = await supabase.from("session_techniques").upsert(
          {
            academy_id: ctx.academyId!,
            session_id: session.id,
            technique_id: input.techniqueId,
          },
          { onConflict: "session_id,technique_id" },
        )
        if (!error) linked++
      }

      return { linked }
    }),
})
