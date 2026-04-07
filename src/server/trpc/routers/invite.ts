import "server-only"
import { z } from "zod"
import { randomUUID } from "crypto"
import { TRPCError } from "@trpc/server"
import { router } from "../init"
import { adminProcedure, instructorProcedure, authenticatedProcedure } from "../procedures"
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
        role: z.enum(["instructor", "student"]),
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
          invite_type:
            input.role === "student" ? "student_activation" : "instructor",
          email: input.email,
          role: input.role,
          token,
          expires_at: expiresAt,
        })
        .select("id, email, role, token, expires_at, created_at")
        .single()

      if (error) {
        if (error.code === "23505") throw new Error("Já existe um convite ativo para esse email")
        throw new Error("Falha ao criar convite")
      }

      return data
    }),

  /**
   * Generates a 30-day portal access link for a specific *managed* student.
   *
   * Used by instructors from a student's profile to give that student access
   * to the /aluno mobile app. The instructor copies the link and shares it
   * via WhatsApp/email.
   *
   * If the student already has portal access, this throws — there's no point
   * in re-inviting someone who can already log in.
   *
   * Instructors (not just admins) can do this so day-to-day staff can onboard
   * new students without bothering the academy owner.
   */
  createForStudent: instructorProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // 1. Find the student row, scoped to this academy
      const { data: member, error: memberErr } = await supabase
        .from("members")
        .select("id, full_name, email, role, has_portal_access")
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.memberId)
        .single()

      if (memberErr || !member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" })
      }
      if (member.role !== "student") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esse cadastro não é de aluno",
        })
      }
      if (!member.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cadastre um email no perfil do aluno antes de gerar o acesso",
        })
      }
      if (member.has_portal_access) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esse aluno já tem acesso ao app",
        })
      }

      // 2. Revoke any previous student invite for the same email so we always
      //    return a fresh link (avoids confusion when the instructor regenerates).
      await supabase
        .from("invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("academy_id", ctx.academyId!)
        .eq("email", member.email)
        .is("accepted_at", null)
        .is("revoked_at", null)

      // 3. Create a fresh 30-day invite tied to this student's email
      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("invites")
        .insert({
          academy_id: ctx.academyId!,
          invited_by: ctx.userId!,
          invite_type: "student_activation",
          email: member.email,
          role: "student",
          token,
          expires_at: expiresAt,
        })
        .select("id, email, role, token, expires_at, created_at")
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar link de acesso",
        })
      }

      return {
        ...data,
        member_name: member.full_name,
      }
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

  /**
   * Accept an invite — links the current authenticated user to the academy.
   *
   * Two paths:
   *   A) An existing **managed** member row was created by the instructor for
   *      this email (has_portal_access: false, user_id: null). In that case
   *      we LINK the existing row to the new auth user, preserving belt rank,
   *      stripes, attendance history etc.
   *   B) No member exists yet — we INSERT a new row.
   */
  accept: authenticatedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const admin = getAdmin()

      // 1. Find the invite by token (use admin to bypass RLS)
      const { data: invite, error: findError } = await admin
        .from("invites")
        .select("id, academy_id, email, role, expires_at, accepted_at, revoked_at")
        .eq("token", input.token)
        .single()

      if (findError || !invite) throw new Error("Convite não encontrado")
      if (invite.accepted_at) throw new Error("Convite já foi aceito")
      if (invite.revoked_at) throw new Error("Convite foi revogado")
      if (new Date(invite.expires_at) < new Date())
        throw new Error("Convite expirado")

      // 2. Get current user
      const supabase = await createServerSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      // 3. Try to find an existing member row to link
      const { data: existing } = await admin
        .from("members")
        .select("id, user_id, has_portal_access, role")
        .eq("academy_id", invite.academy_id)
        .or(`email.eq.${invite.email},user_id.eq.${user.id}`)
        .maybeSingle()

      if (existing) {
        // Existing managed profile → link it
        if (existing.user_id && existing.user_id !== user.id) {
          throw new Error("Esse cadastro já está vinculado a outra conta")
        }

        const { error: updateError } = await admin
          .from("members")
          .update({
            user_id: user.id,
            has_portal_access: true,
            status: "active",
          })
          .eq("id", existing.id)

        if (updateError) {
          throw new Error("Falha ao vincular conta: " + updateError.message)
        }
      } else {
        // No existing member — create one
        const { error: memberError } = await admin
          .from("members")
          .insert({
            academy_id: invite.academy_id,
            user_id: user.id,
            full_name:
              (user.user_metadata?.full_name as string) ||
              user.email ||
              "Aluno",
            email: user.email,
            role: invite.role,
            has_portal_access: true,
            status: "active",
          })

        if (memberError) {
          if (memberError.code === "23505")
            throw new Error("Você já é membro dessa academia")
          throw new Error("Falha ao entrar na academia")
        }
      }

      // 4. Mark invite as accepted
      await admin
        .from("invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id)

      // 5. Update user's app_metadata to point to this academy + role hint.
      //    The role hint lets middleware route students to /aluno without
      //    a database call. The server-side layout always re-validates.
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          academy_id: invite.academy_id,
          member_role: invite.role,
        },
      })

      return { academyId: invite.academy_id, role: invite.role }
    }),
})
