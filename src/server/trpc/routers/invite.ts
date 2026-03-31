import "server-only"
import { z } from "zod"
import { randomUUID } from "crypto"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const inviteRouter = router({
  /**
   * Creates an instructor invite.
   * Generates a secure token and sets expiry to 7 days.
   * No email is sent — the token is returned for manual sharing (for now).
   */
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["instructor"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("invites")
        .insert({
          academy_id: ctx.academyId!,
          invited_by: ctx.userId!,
          invite_type: "instructor",
          email: input.email,
          role: input.role,
          token,
          expires_at: expiresAt,
        })
        .select("id, email, role, token, expires_at, created_at")
        .single()

      if (error) {
        if (error.code === "23505") throw new Error("An active invite for this email already exists")
        throw new Error("Failed to create invite")
      }

      return data
    }),

  /** Lists all invites for the current academy, newest first. */
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0
      const supabase = await createServerSupabase()

      const { data, count, error } = await supabase
        .from("invites")
        .select("id, email, role, invite_type, token, expires_at, accepted_at, revoked_at, created_at", {
          count: "exact",
          head: false,
        })
        .eq("academy_id", ctx.academyId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new Error("Failed to fetch invites")

      return { items: data ?? [], total: count ?? 0, limit, offset }
    }),

  /** Revokes a pending invite. */
  revoke: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .select("id")

      if (error) throw new Error("Failed to revoke invite")
      if (!data || data.length === 0)
        throw new Error("Invite cannot be revoked — it may already be accepted or revoked")

      return { success: true }
    }),
})
