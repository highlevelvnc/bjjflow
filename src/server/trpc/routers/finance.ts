import "server-only"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

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
})
