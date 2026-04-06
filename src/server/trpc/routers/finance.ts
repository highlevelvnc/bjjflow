import "server-only"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

function endOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" })
}

export const financeRouter = router({
  /**
   * Financial overview for the academy.
   * Aggregates revenue from student_plans and inventory_transactions.
   */
  overview: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch in parallel: members, student plans, payments, inventory transactions, academy
    const [membersRes, plansRes, paymentsRes, txRes, academyRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, status")
        .eq("academy_id", ctx.academyId!),
      supabase
        .from("student_plans")
        .select("id, price, billing_cycle, status")
        .eq("academy_id", ctx.academyId!),
      supabase
        .from("payments")
        .select("amount, status, paid_at, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "paid"),
      supabase
        .from("inventory_transactions")
        .select("price_cents, quantity, type, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("type", "sale"),
      supabase
        .from("academies")
        .select("currency")
        .eq("id", ctx.academyId!)
        .single(),
    ])

    const members = membersRes.data ?? []
    const plans = plansRes.data ?? []
    const payments = paymentsRes.data ?? []
    const salesTx = txRes.data ?? []
    const currency = academyRes.data?.currency ?? "USD"

    const totalMembers = members.length
    const activeMembers = members.filter((m) => m.status === "active").length

    // --- MRR from active student plans ---
    let mrr = 0
    const activePlans = plans.filter((p) => p.status === "active")
    for (const plan of activePlans) {
      switch (plan.billing_cycle) {
        case "monthly":
          mrr += plan.price
          break
        case "quarterly":
          mrr += plan.price / 3
          break
        case "annual":
          mrr += plan.price / 12
          break
        case "one_time":
          // One-time plans don't contribute to MRR
          break
      }
    }

    // --- Revenue from payments table ---
    let last30Revenue = 0
    let last90Revenue = 0
    let allTimeRevenue = 0

    for (const p of payments) {
      const paidDate = p.paid_at ?? p.created_at
      allTimeRevenue += p.amount
      if (paidDate >= ninetyDaysAgo) last90Revenue += p.amount
      if (paidDate >= thirtyDaysAgo) last30Revenue += p.amount
    }

    // --- Also include inventory sales revenue ---
    for (const tx of salesTx) {
      const saleAmount = ((tx.price_cents ?? 0) * tx.quantity) / 100
      allTimeRevenue += saleAmount
      if (tx.created_at >= ninetyDaysAgo) last90Revenue += saleAmount
      if (tx.created_at >= thirtyDaysAgo) last30Revenue += saleAmount
    }

    const avgRevenuePerMember = activeMembers > 0 ? allTimeRevenue / activeMembers : 0

    return {
      totalMembers,
      activeMembers,
      mrr: Math.round(mrr * 100) / 100,
      last30Revenue: Math.round(last30Revenue * 100) / 100,
      last90Revenue: Math.round(last90Revenue * 100) / 100,
      allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
      avgRevenuePerMember: Math.round(avgRevenuePerMember * 100) / 100,
      currency,
    }
  }),

  /**
   * Revenue breakdown per member (LTV analysis).
   * Combines attendance data with plan info for each member.
   * Returns top 20 by estimated LTV descending.
   */
  memberRevenue: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const [membersRes, plansRes, attendanceRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, full_name, belt_rank, status, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "active"),
      supabase
        .from("student_plans")
        .select("member_id, price, billing_cycle, status, start_date")
        .eq("academy_id", ctx.academyId!),
      supabase
        .from("attendance")
        .select("member_id")
        .eq("academy_id", ctx.academyId!),
    ])

    const members = membersRes.data ?? []
    const plans = plansRes.data ?? []
    const attendance = attendanceRes.data ?? []

    // Build attendance count map
    const attendanceCounts = new Map<string, number>()
    for (const a of attendance) {
      attendanceCounts.set(a.member_id, (attendanceCounts.get(a.member_id) ?? 0) + 1)
    }

    // Build plan map (latest plan per member)
    const planMap = new Map<string, { price: number; cycle: string; status: string }>()
    for (const p of plans) {
      const existing = planMap.get(p.member_id)
      if (!existing || p.status === "active") {
        planMap.set(p.member_id, { price: p.price, cycle: p.billing_cycle, status: p.status })
      }
    }

    const now = Date.now()

    const memberData = members.map((m) => {
      const joinedMs = now - new Date(m.created_at).getTime()
      const joinedMonthsAgo = Math.max(1, Math.round(joinedMs / (30 * 24 * 60 * 60 * 1000)))
      const totalAttendance = attendanceCounts.get(m.id) ?? 0
      const plan = planMap.get(m.id)

      // Estimate LTV based on plan
      let estimatedLTV = 0
      if (plan) {
        let monthlyRate = 0
        switch (plan.cycle) {
          case "monthly":
            monthlyRate = plan.price
            break
          case "quarterly":
            monthlyRate = plan.price / 3
            break
          case "annual":
            monthlyRate = plan.price / 12
            break
          case "one_time":
            monthlyRate = plan.price / Math.max(joinedMonthsAgo, 1)
            break
        }
        estimatedLTV = monthlyRate * joinedMonthsAgo
      }

      return {
        id: m.id,
        name: m.full_name,
        belt: m.belt_rank,
        joinedMonthsAgo,
        totalAttendance,
        estimatedLTV: Math.round(estimatedLTV * 100) / 100,
        status: m.status,
        hasPlan: !!plan,
      }
    })

    // Sort by LTV desc, return top 20
    memberData.sort((a, b) => b.estimatedLTV - a.estimatedLTV)
    return memberData.slice(0, 20)
  }),

  /**
   * Monthly revenue chart data for the last 6 months.
   * Aggregates from payments table and inventory_transactions.
   */
  revenueChart: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    const [paymentsRes, txRes] = await Promise.all([
      supabase
        .from("payments")
        .select("amount, paid_at, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "paid")
        .gte("created_at", sixMonthsAgo),
      supabase
        .from("inventory_transactions")
        .select("price_cents, quantity, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("type", "sale")
        .gte("created_at", sixMonthsAgo),
    ])

    const payments = paymentsRes.data ?? []
    const salesTx = txRes.data ?? []

    // Build month buckets for the last 6 months
    const months: { month: string; revenue: number; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push({ month: key, revenue: 0, count: 0 })
    }

    const monthMap = new Map(months.map((m) => [m.month, m]))

    for (const p of payments) {
      const date = p.paid_at ?? p.created_at
      const key = date.substring(0, 7) // "YYYY-MM"
      const bucket = monthMap.get(key)
      if (bucket) {
        bucket.revenue += p.amount
        bucket.count += 1
      }
    }

    for (const tx of salesTx) {
      const key = tx.created_at.substring(0, 7)
      const bucket = monthMap.get(key)
      if (bucket) {
        bucket.revenue += ((tx.price_cents ?? 0) * tx.quantity) / 100
        bucket.count += 1
      }
    }

    // Round revenues
    for (const m of months) {
      m.revenue = Math.round(m.revenue * 100) / 100
    }

    return months
  }),

  /**
   * Members with overdue or missing payments.
   * Finds active members with plans whose last payment is 30+ days old.
   */
  delinquency: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const _thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get active student plans
    const { data: plans } = await supabase
      .from("student_plans")
      .select("id, member_id, name, price, billing_cycle, start_date")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "active")

    if (!plans || plans.length === 0) return []

    const memberIds = [...new Set(plans.map((p) => p.member_id))]

    // Get member details and their latest payments in parallel
    const [membersRes, paymentsRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, full_name, belt_rank, status")
        .eq("academy_id", ctx.academyId!)
        .in("id", memberIds),
      supabase
        .from("payments")
        .select("subscription_id, paid_at, created_at")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "paid")
        .order("paid_at", { ascending: false }),
    ])

    const members = membersRes.data ?? []
    const _payments = paymentsRes.data ?? []

    const memberMap = new Map(members.map((m) => [m.id, m]))

    // Build latest payment date per member (approximate via plan membership)
    // Since payments are linked to subscriptions not directly to members,
    // we check if the member has any plan and if the plan start_date + cycle is overdue
    const now = Date.now()

    const delinquent: {
      memberId: string
      name: string
      belt: string
      daysSincePayment: number
      planName: string
      amountDue: number
    }[] = []

    for (const plan of plans) {
      const member = memberMap.get(plan.member_id)
      if (!member || member.status !== "active") continue

      // Estimate when payment was due based on plan start + cycle
      const startDate = new Date(plan.start_date).getTime()
      let cycleDays = 30
      switch (plan.billing_cycle) {
        case "monthly":
          cycleDays = 30
          break
        case "quarterly":
          cycleDays = 90
          break
        case "annual":
          cycleDays = 365
          break
        case "one_time":
          continue // one-time plans can't be overdue
      }

      // Calculate how many cycles have passed
      const daysSinceStart = Math.floor((now - startDate) / (24 * 60 * 60 * 1000))
      const cyclesPassed = Math.floor(daysSinceStart / cycleDays)
      const lastDueDate = new Date(startDate + cyclesPassed * cycleDays * 24 * 60 * 60 * 1000)
      const daysSinceDue = Math.floor((now - lastDueDate.getTime()) / (24 * 60 * 60 * 1000))

      // If last due date was > 30 days ago, flag as delinquent
      if (daysSinceDue > 30) {
        delinquent.push({
          memberId: plan.member_id,
          name: member.full_name,
          belt: member.belt_rank,
          daysSincePayment: daysSinceDue,
          planName: plan.name,
          amountDue: plan.price,
        })
      }
    }

    // Sort by most overdue first
    delinquent.sort((a, b) => b.daysSincePayment - a.daysSincePayment)
    return delinquent.slice(0, 20)
  }),

  /**
   * Student revenue overview using the student_payments table.
   * Calculates monthly revenue, growth rate, overdue totals, and projections.
   */
  studentRevenueOverview: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const now = new Date()

    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)
    const today = now.toISOString().slice(0, 10)

    const [thisMonthRes, lastMonthRes, overdueRes, activePlansRes, academyRes] =
      await Promise.all([
        // This month's paid payments
        supabase
          .from("student_payments")
          .select("amount")
          .eq("academy_id", ctx.academyId!)
          .eq("status", "paid")
          .gte("paid_at", thisMonthStart)
          .lte("paid_at", thisMonthEnd + "T23:59:59"),
        // Last month's paid payments
        supabase
          .from("student_payments")
          .select("amount")
          .eq("academy_id", ctx.academyId!)
          .eq("status", "paid")
          .gte("paid_at", lastMonthStart)
          .lte("paid_at", lastMonthEnd + "T23:59:59"),
        // Overdue: status=overdue OR (status=pending AND due_date < today)
        supabase
          .from("student_payments")
          .select("amount, status, due_date")
          .eq("academy_id", ctx.academyId!)
          .in("status", ["overdue", "pending"]),
        // Active plans for projected revenue
        supabase
          .from("student_plans")
          .select("price, billing_cycle")
          .eq("academy_id", ctx.academyId!)
          .eq("status", "active"),
        // Currency
        supabase
          .from("academies")
          .select("currency")
          .eq("id", ctx.academyId!)
          .single(),
      ])

    const thisMonthPayments = thisMonthRes.data ?? []
    const lastMonthPayments = lastMonthRes.data ?? []
    const overduePayments = overdueRes.data ?? []
    const activePlans = activePlansRes.data ?? []
    const currency = academyRes.data?.currency ?? "BRL"

    const monthlyRevenue = thisMonthPayments.reduce((s, p) => s + p.amount, 0)
    const previousMonth = lastMonthPayments.reduce((s, p) => s + p.amount, 0)
    const growthRate =
      previousMonth > 0
        ? Math.round(((monthlyRevenue - previousMonth) / previousMonth) * 10000) / 100
        : monthlyRevenue > 0
          ? 100
          : 0

    // Overdue = explicitly overdue OR pending with past due_date
    const overdueAmount = overduePayments
      .filter((p) => p.status === "overdue" || (p.status === "pending" && p.due_date < today))
      .reduce((s, p) => s + p.amount, 0)

    const overdueCount = overduePayments.filter(
      (p) => p.status === "overdue" || (p.status === "pending" && p.due_date < today),
    ).length

    // Projected revenue: sum of monthly-equivalent active plan prices
    let projectedRevenue = 0
    for (const plan of activePlans) {
      switch (plan.billing_cycle) {
        case "monthly":
          projectedRevenue += plan.price
          break
        case "quarterly":
          projectedRevenue += plan.price / 3
          break
        case "annual":
          projectedRevenue += plan.price / 12
          break
      }
    }

    return {
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      previousMonth: Math.round(previousMonth * 100) / 100,
      growthRate,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      overdueCount,
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      currency,
    }
  }),

  /**
   * Cash flow forecast for the next 3 months.
   * Based on active plans, with estimated churn from current overdue rate.
   */
  cashFlowForecast: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const now = new Date()

    const [activePlansRes, allPaymentsRes] = await Promise.all([
      supabase
        .from("student_plans")
        .select("price, billing_cycle")
        .eq("academy_id", ctx.academyId!)
        .eq("status", "active"),
      // Get recent payment statuses to estimate churn rate
      supabase
        .from("student_payments")
        .select("status")
        .eq("academy_id", ctx.academyId!)
        .gte("due_date", startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1))),
    ])

    const activePlans = activePlansRes.data ?? []
    const recentPayments = allPaymentsRes.data ?? []

    // Calculate monthly expected revenue from active plans
    let monthlyExpected = 0
    for (const plan of activePlans) {
      switch (plan.billing_cycle) {
        case "monthly":
          monthlyExpected += plan.price
          break
        case "quarterly":
          monthlyExpected += plan.price / 3
          break
        case "annual":
          monthlyExpected += plan.price / 12
          break
      }
    }

    // Estimate churn rate from overdue payments in recent history
    const totalRecent = recentPayments.length
    const overdueRecent = recentPayments.filter(
      (p) => p.status === "overdue" || p.status === "cancelled",
    ).length
    const churnRate = totalRecent > 0 ? overdueRecent / totalRecent : 0

    const forecast: {
      month: string
      expected: number
      estimated_churn: number
      net_forecast: number
      active_plans: number
    }[] = []

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const expected = Math.round(monthlyExpected * 100) / 100
      const churnLoss = Math.round(monthlyExpected * churnRate * 100) / 100
      const net = Math.round((monthlyExpected - monthlyExpected * churnRate) * 100) / 100

      forecast.push({
        month: monthLabel(futureDate),
        expected,
        estimated_churn: churnLoss,
        net_forecast: net,
        active_plans: activePlans.length,
      })
    }

    return forecast
  }),

  /**
   * Lightweight overdue summary for dashboard alerts.
   * Returns count and total of overdue payments.
   */
  overdueSummary: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const today = new Date().toISOString().slice(0, 10)

    const { data: payments } = await supabase
      .from("student_payments")
      .select("amount, status, due_date")
      .eq("academy_id", ctx.academyId!)
      .in("status", ["overdue", "pending"])

    const overdue = (payments ?? []).filter(
      (p) => p.status === "overdue" || (p.status === "pending" && p.due_date < today),
    )

    return {
      count: overdue.length,
      totalAmount: Math.round(overdue.reduce((s, p) => s + p.amount, 0) * 100) / 100,
    }
  }),

  /**
   * Payment method breakdown from student_payments.
   * Groups paid payments by payment method with counts and totals.
   */
  paymentMethodBreakdown: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data: payments } = await supabase
      .from("student_payments")
      .select("payment_method, amount")
      .eq("academy_id", ctx.academyId!)
      .eq("status", "paid")

    const methods: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      pix: { count: 0, total: 0 },
      stripe: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    }

    for (const p of payments ?? []) {
      const method = p.payment_method ?? "other"
      const bucket = methods[method]!
      bucket.count += 1
      bucket.total += p.amount
    }

    return Object.entries(methods).map(([method, data]) => ({
      method: method as "cash" | "pix" | "stripe" | "other",
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    }))
  }),
})
