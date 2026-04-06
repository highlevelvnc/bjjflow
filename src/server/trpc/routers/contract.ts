import "server-only"
import { z } from "zod"
import { router } from "../init"
import { protectedProcedure, instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import { TRPCError } from "@trpc/server"

export const contractRouter = router({
  /**
   * List all contracts for the academy. Instructor+ access.
   * Optional memberId filter. Includes member name.
   */
  list: instructorProcedure
    .input(
      z
        .object({
          memberId: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      let query = supabase
        .from("contracts")
        .select(
          "id, member_id, title, status, signed_at, expires_at, created_at, updated_at",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (input?.memberId) {
        query = query.eq("member_id", input.memberId)
      }

      const { data, count, error } = await query

      if (error) throw error

      // Fetch member names for display
      const contracts = data ?? []
      const memberIds = [...new Set(contracts.map((c) => c.member_id))]
      let memberMap: Record<string, string> = {}
      if (memberIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("id, full_name")
          .in("id", memberIds)
        if (members) {
          memberMap = Object.fromEntries(members.map((m) => [m.id, m.full_name]))
        }
      }

      const items = contracts.map((c) => ({
        ...c,
        member_name: memberMap[c.member_id] ?? "Unknown",
      }))

      return { items, total: count ?? 0 }
    }),

  /**
   * Get a single contract by ID. Members can view their own contracts.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." })
      }

      // Students can only see their own contracts
      if (
        ctx.member!.role === "student" &&
        data.member_id !== ctx.member!.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own contracts." })
      }

      // Fetch member name
      const { data: member } = await supabase
        .from("members")
        .select("full_name")
        .eq("id", data.member_id)
        .single()

      return {
        ...data,
        member_name: member?.full_name ?? "Unknown",
      }
    }),

  /**
   * Create a new contract for a member. Admin access required.
   */
  create: adminProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(50000),
        expiresAt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("contracts")
        .insert({
          academy_id: ctx.academyId!,
          member_id: input.memberId,
          title: input.title,
          content: input.content,
          status: "draft",
          expires_at: input.expiresAt ?? null,
          created_by: ctx.member!.id,
        })
        .select("id, title")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Mark a contract as "sent". Admin access required.
   */
  send: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("contracts")
        .update({ status: "sent" })
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .eq("status", "draft")
        .select("id, status")
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Contract not found or not in draft status.",
        })
      }

      return data
    }),

  /**
   * Sign a contract. Only the contract's member can sign.
   */
  sign: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        signatureData: z.string().min(1),
        signerIp: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Verify the contract belongs to this member and is in "sent" status
      const { data: contract } = await supabase
        .from("contracts")
        .select("id, member_id, status")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." })
      }

      if (contract.member_id !== ctx.member!.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only sign your own contracts." })
      }

      if (contract.status !== "sent") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Contract is not available for signing.",
        })
      }

      const { data, error } = await supabase
        .from("contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: input.signatureData,
          signer_ip: input.signerIp ?? null,
        })
        .eq("id", input.id)
        .select("id, status, signed_at")
        .single()

      if (error) throw error
      return data
    }),

  /**
   * Cancel a contract. Admin access required.
   */
  cancel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("contracts")
        .update({ status: "cancelled" })
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .select("id, status")
        .single()

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." })
      }

      return data
    }),
})
