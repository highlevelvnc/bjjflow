import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const academyRouter = router({
  /**
   * Returns the active academy for the current user.
   * Used by dashboard layout to hydrate AcademyContext.
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("academies")
      .select(
        "id, name, slug, logo_url, status, plan, timezone, currency, allow_student_self_checkin, allow_student_portal",
      )
      // enforceAcademyMember guarantees ctx.academyId is non-null
      .eq("id", ctx.academyId!)
      .single()

    if (error || !data) {
      throw new Error("Academy not found")
    }

    return data
  }),

  /**
   * Returns all academies the current user belongs to (for academy switcher).
   * Fetches the member rows first, then resolves academy public info.
   */
  listMemberships: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // members_own_memberships RLS policy (Tier 3) returns rows for auth.uid()
    // across all academies where has_portal_access = true.
    const { data: members, error } = await supabase
      .from("members")
      .select("academy_id, role, status, academies(id, name, slug, logo_url, status)")
      // enforceAuthenticated guarantees ctx.userId is non-null
      .eq("user_id", ctx.userId!)
      .eq("has_portal_access", true)
      .eq("status", "active")

    if (error) throw new Error("Failed to load memberships")

    return members ?? []
  }),

  /**
   * Admin: update academy settings.
   * Sensitive fields (Stripe IDs, slug) are intentionally excluded.
   */
  updateSettings: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        timezone: z.string().optional(),
        logo_url: z.string().url().nullable().optional(),
        allow_student_self_checkin: z.boolean().optional(),
        allow_student_portal: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("academies")
        .update(input)
        // enforceAdmin guarantees ctx.academyId is non-null
        .eq("id", ctx.academyId!)
        .select("id, name, slug, logo_url, status, plan, timezone, currency")
        .single()

      if (error) throw new Error("Failed to update academy settings")

      return data
    }),
})
