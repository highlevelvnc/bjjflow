import "server-only"
import { z } from "zod"
import { router } from "../init"
import { instructorProcedure, adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const studentPlanRouter = router({
  /**
   * List all student plans with member names. Paginated. Include overdue count.
   */
  list: instructorProcedure
    .input(
      z
        .object({
          status: z.enum(["active", "paused", "cancelled"]).optional(),
          search: z.string().max(100).optional(),
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
        .from("student_plans")
        .select(
          "id, member_id, name, price, currency, billing_cycle, payment_method, status, start_date, end_date, notes, created_at, members!inner(id, full_name, email, belt_rank)",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (input?.status) {
        query = query.eq("status", input.status)
      }
      if (input?.search) {
        const term = input.search.trim()
        query = query.ilike("members.full_name", `%${term}%`)
      }

      const { data, count, error } = await query

      if (error) throw new Error("Failed to fetch student plans")

      // Get overdue count
      const today = new Date().toISOString().split("T")[0]!
      const { count: overdueCount } = await supabase
        .from("student_payments")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", ctx.academyId!)
        .lt("due_date", today)
        .not("status", "in", '("paid","cancelled")')

      return {
        items: data ?? [],
        total: count ?? 0,
        overdueCount: overdueCount ?? 0,
        limit,
        offset,
      }
    }),

  /**
   * Get the active plan for a specific member.
   */
  getByMember: instructorProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("student_plans")
        .select(
          "id, member_id, name, price, currency, billing_cycle, payment_method, status, start_date, end_date, notes, created_at",
        )
        .eq("academy_id", ctx.academyId!)
        .eq("member_id", input.memberId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw new Error("Failed to fetch student plan")

      return data
    }),

  /**
   * Create a student plan. Also auto-generate the first payment.
   */
  create: adminProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        name: z.string().min(1).max(200),
        price: z.number().positive(),
        currency: z.string().min(3).max(3),
        billing_cycle: z.enum(["monthly", "quarterly", "annual", "one_time"]),
        payment_method: z.enum(["cash", "pix", "stripe", "other"]).default("pix"),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      // Create the plan
      const { data: plan, error: planError } = await supabase
        .from("student_plans")
        .insert({
          academy_id: ctx.academyId!,
          member_id: input.memberId,
          name: input.name,
          price: input.price,
          currency: input.currency,
          billing_cycle: input.billing_cycle,
          payment_method: input.payment_method,
          start_date: input.start_date,
          notes: input.notes || null,
          created_by: ctx.member!.id,
          status: "active",
        })
        .select("*")
        .single()

      if (planError) throw new Error("Failed to create student plan")

      // Auto-generate first payment
      const { error: paymentError } = await supabase
        .from("student_payments")
        .insert({
          academy_id: ctx.academyId!,
          plan_id: plan.id,
          member_id: input.memberId,
          amount: input.price,
          currency: input.currency,
          payment_method: input.payment_method,
          status: "pending",
          due_date: input.start_date,
        })

      if (paymentError) {
        // Plan was created but payment failed — log but don't fail
        console.error("Failed to create first payment:", paymentError)
      }

      return plan
    }),

  /**
   * Update plan (price, status, notes, payment_method).
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        price: z.number().positive().optional(),
        status: z.enum(["active", "paused", "cancelled"]).optional(),
        notes: z.string().max(1000).optional(),
        payment_method: z.enum(["cash", "pix", "stripe", "other"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { id, ...fields } = input
      const updateObj: Record<string, unknown> = {}

      if (fields.price !== undefined) updateObj.price = fields.price
      if (fields.status !== undefined) updateObj.status = fields.status
      if (fields.notes !== undefined) updateObj.notes = fields.notes || null
      if (fields.payment_method !== undefined) updateObj.payment_method = fields.payment_method

      if (Object.keys(updateObj).length === 0) {
        throw new Error("No fields to update")
      }

      const { data, error } = await supabase
        .from("student_plans")
        .update(updateObj)
        .eq("academy_id", ctx.academyId!)
        .eq("id", id)
        .select("*")
        .single()

      if (error) throw new Error("Failed to update student plan")

      return data
    }),

  /**
   * Cancel a plan (set status=cancelled, set end_date=now).
   */
  cancel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const today = new Date().toISOString().split("T")[0]!

      const { data, error } = await supabase
        .from("student_plans")
        .update({ status: "cancelled", end_date: today })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.id)
        .select("id, status, end_date")
        .single()

      if (error) throw new Error("Failed to cancel plan")

      // Also cancel pending payments for this plan
      await supabase
        .from("student_payments")
        .update({ status: "cancelled" })
        .eq("academy_id", ctx.academyId!)
        .eq("plan_id", input.id)
        .eq("status", "pending")

      return data
    }),

  /**
   * List payments for a plan or member. Paginated. Ordered by due_date desc.
   */
  listPayments: instructorProcedure
    .input(
      z.object({
        planId: z.string().uuid().optional(),
        memberId: z.string().uuid().optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit
      const offset = input.offset
      const supabase = await createServerSupabase()

      let query = supabase
        .from("student_payments")
        .select(
          "id, plan_id, member_id, amount, currency, payment_method, status, due_date, paid_at, pix_code, pix_qr_data, notes, recorded_by, created_at, members!inner(full_name), student_plans!inner(name)",
          { count: "exact", head: false },
        )
        .eq("academy_id", ctx.academyId!)
        .order("due_date", { ascending: false })
        .range(offset, offset + limit - 1)

      if (input.planId) {
        query = query.eq("plan_id", input.planId)
      }
      if (input.memberId) {
        query = query.eq("member_id", input.memberId)
      }
      if (input.status) {
        query = query.eq("status", input.status)
      }

      const { data, count, error } = await query

      if (error) throw new Error("Failed to fetch payments")

      return { items: data ?? [], total: count ?? 0, limit, offset }
    }),

  /**
   * Mark a payment as paid.
   */
  recordPayment: instructorProcedure
    .input(
      z.object({
        paymentId: z.string().uuid(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from("student_payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          recorded_by: ctx.member!.id,
          notes: input.notes || null,
        })
        .eq("academy_id", ctx.academyId!)
        .eq("id", input.paymentId)
        .select("id, status, paid_at")
        .single()

      if (error) throw new Error("Failed to record payment")

      return data
    }),

  /**
   * For all active plans, generate next month's payment if one doesn't exist yet.
   * Returns count of payments generated.
   */
  generateMonthlyPayments: adminProcedure.mutation(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    // Get all active plans
    const { data: plans, error: plansError } = await supabase
      .from("student_plans")
      .select("id, member_id, price, currency, payment_method, billing_cycle")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "active")

    if (plansError) throw new Error("Failed to fetch active plans")
    if (!plans || plans.length === 0) return { generated: 0 }

    const now = new Date()
    let generated = 0

    for (const plan of plans) {
      // Determine the next due date based on billing cycle
      let nextDueDate: Date
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      if (plan.billing_cycle === "monthly") {
        nextDueDate = nextMonth
      } else if (plan.billing_cycle === "quarterly") {
        // Generate if the next month starts a new quarter
        const nextMonthNum = nextMonth.getMonth()
        if (nextMonthNum % 3 !== 0) continue
        nextDueDate = nextMonth
      } else if (plan.billing_cycle === "annual") {
        // Generate if the next month is January
        if (nextMonth.getMonth() !== 0) continue
        nextDueDate = nextMonth
      } else {
        // one_time — skip
        continue
      }

      const dueDateStr = nextDueDate.toISOString().split("T")[0]!

      // Check if payment already exists for this period
      const { data: existing } = await supabase
        .from("student_payments")
        .select("id")
        .eq("plan_id", plan.id)
        .eq("due_date", dueDateStr)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Create the payment
      const { error: insertError } = await supabase
        .from("student_payments")
        .insert({
          academy_id: ctx.academyId!,
          plan_id: plan.id,
          member_id: plan.member_id,
          amount: plan.price,
          currency: plan.currency,
          payment_method: plan.payment_method,
          status: "pending",
          due_date: dueDateStr,
        })

      if (!insertError) generated++
    }

    return { generated }
  }),

  /**
   * Get all overdue payments. Include member name and plan name.
   */
  getOverdue: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const today = new Date().toISOString().split("T")[0]!

    const { data, error } = await supabase
      .from("student_payments")
      .select(
        "id, plan_id, member_id, amount, currency, payment_method, status, due_date, notes, created_at, members!inner(full_name), student_plans!inner(name)",
      )
      .eq("academy_id", ctx.academyId!)
      .lt("due_date", today)
      .not("status", "in", '("paid","cancelled")')
      .order("due_date", { ascending: true })

    if (error) throw new Error("Failed to fetch overdue payments")

    return data ?? []
  }),

  /**
   * Get billing stats for the overview cards.
   */
  getStats: instructorProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const today = new Date().toISOString().split("T")[0]!
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0]!
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0]!
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]!

    const [activePlans, paidThisMonth, overdue, upcoming] = await Promise.all([
      // Active plans count
      supabase
        .from("student_plans")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", ctx.academyId!)
        .eq("status", "active"),

      // Total revenue this month (paid payments)
      supabase
        .from("student_payments")
        .select("amount")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "paid")
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd + "T23:59:59"),

      // Overdue payments
      supabase
        .from("student_payments")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", ctx.academyId!)
        .lt("due_date", today)
        .not("status", "in", '("paid","cancelled")'),

      // Upcoming due (next 7 days)
      supabase
        .from("student_payments")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", ctx.academyId!)
        .gte("due_date", today)
        .lte("due_date", sevenDaysFromNow)
        .eq("status", "pending"),
    ])

    const totalRevenue = (paidThisMonth.data ?? []).reduce(
      (sum, p) => sum + (p.amount ?? 0),
      0,
    )

    return {
      activePlans: activePlans.count ?? 0,
      totalRevenue,
      overdueCount: overdue.count ?? 0,
      upcomingDue: upcoming.count ?? 0,
    }
  }),
})
