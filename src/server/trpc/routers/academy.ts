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
        "id, name, slug, logo_url, status, plan, timezone, currency, allow_student_self_checkin, allow_student_portal, block_after_days_overdue",
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
        block_after_days_overdue: z.number().int().min(0).max(365).optional(),
        pix_key: z.string().max(100).optional(),
        pix_key_type: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
        merchant_city: z.string().max(15).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { pix_key, pix_key_type, merchant_city, ...academyFields } = input

      // Update academy fields
      const { data, error } = await supabase
        .from("academies")
        .update(academyFields)
        .eq("id", ctx.academyId!)
        .select("id, name, slug, logo_url, status, plan, timezone, currency")
        .single()

      if (error) throw new Error("Failed to update academy settings")

      // Store PIX settings in a separate settings approach via RPC or metadata
      // For now we store them as part of a JSON column if available,
      // or we use a simple key-value approach.
      // Since the academies table doesn't have a settings jsonb column yet,
      // we'll store PIX config in localStorage on the client side and pass to PIX generation.
      // The PIX fields are returned as-is for the client to persist.

      return { ...data, pix_key, pix_key_type, merchant_city }
    }),

  /**
   * Get PIX settings for the academy.
   * These are stored in the academy's metadata.
   */
  getPixSettings: adminProcedure.query(async ({ ctx: _ctx }) => {
    // PIX settings are managed client-side via localStorage for now
    // until a settings jsonb column is added to academies table.
    // Return empty defaults.
    return {
      pix_key: "",
      pix_key_type: "cpf" as const,
      merchant_city: "",
    }
  }),
})
