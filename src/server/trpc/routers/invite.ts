import "server-only"
import { z } from "zod"
import { randomUUID } from "crypto"
import { router } from "../init"
import { adminProcedure, authenticatedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

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

  /** Accept an invite — creates a member in the invite's academy. */
  accept: authenticatedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      // 1. Find the invite by token (use admin to bypass RLS)
      const { data: invite, error: findError } = await getAdmin()
        .from("invites")
        .select("id, academy_id, email, role, expires_at, accepted_at, revoked_at")
        .eq("token", input.token)
        .single()

      if (findError || !invite) throw new Error("Invite not found")
      if (invite.accepted_at) throw new Error("Invite already accepted")
      if (invite.revoked_at) throw new Error("Invite has been revoked")
      if (new Date(invite.expires_at) < new Date()) throw new Error("Invite has expired")

      // 2. Get current user's email
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 3. Create member in the invite's academy (service role — cross-tenant)
      const { error: memberError } = await getAdmin()
        .from("members")
        .insert({
          academy_id: invite.academy_id,
          user_id: user.id,
          full_name: (user.user_metadata?.full_name as string) || user.email || "Member",
          email: user.email,
          role: invite.role,
          has_portal_access: true,
          status: "active",
        })

      if (memberError) {
        if (memberError.code === "23505") throw new Error("You are already a member of this academy")
        throw new Error("Failed to join academy")
      }

      // 4. Mark invite as accepted
      await getAdmin()
        .from("invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id)

      // 5. Update user's app_metadata to point to this academy
      await getAdmin().auth.admin.updateUserById(user.id, {
        app_metadata: { academy_id: invite.academy_id },
      })

      return { academyId: invite.academy_id }
    }),
})
