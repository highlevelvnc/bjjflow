import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * For every active plan in `academyId`, generates the next pending payment
 * if it doesn't already exist. The next due date is computed from the plan's
 * billing cycle and start_date.
 *
 * Returns the count of payments generated.
 */
export async function generateMonthlyPaymentsForAcademy(
  academyId: string,
): Promise<number> {
  const admin = getAdmin()

  const { data: plans } = await admin
    .from("student_plans")
    .select("id, member_id, price, currency, payment_method, billing_cycle, start_date")
    .eq("academy_id", academyId)
    .eq("status", "active")

  if (!plans || plans.length === 0) return 0

  let generated = 0

  for (const plan of plans) {
    // Find the latest payment for this plan
    const { data: latest } = await admin
      .from("student_payments")
      .select("id, due_date")
      .eq("plan_id", plan.id)
      .neq("status", "cancelled")
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    const reference = latest?.due_date ?? plan.start_date
    if (!reference) continue

    const refDate = new Date(reference + "T00:00:00")
    const next = new Date(refDate)

    switch (plan.billing_cycle) {
      case "monthly":
        next.setMonth(next.getMonth() + 1)
        break
      case "quarterly":
        next.setMonth(next.getMonth() + 3)
        break
      case "annual":
        next.setFullYear(next.getFullYear() + 1)
        break
      default:
        // one_time — never auto-generates
        continue
    }

    // Only create the next payment if its due date is within 35 days
    // (so we don't pre-create the entire year of bills).
    const daysUntil = (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntil > 35) continue

    const dueDateStr = next.toISOString().slice(0, 10)

    // Idempotency: skip if a payment already exists with this exact due date
    const { data: existing } = await admin
      .from("student_payments")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("due_date", dueDateStr)
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: insertError } = await admin.from("student_payments").insert({
      academy_id: academyId,
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

  return generated
}
