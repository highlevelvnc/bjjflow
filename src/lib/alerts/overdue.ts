import "server-only"

import { createClient } from "@supabase/supabase-js"
import { sendOverdueNotificationEmail } from "@/lib/email"
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatch"
import type { Database } from "@/types/database"

/**
 * Lazy-init Supabase admin client (service role) for cron/background tasks.
 * This bypasses RLS so we can query across academies.
 */
function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Check for overdue payments in a specific academy and take action:
 *   1. Find pending payments with past due dates
 *   2. Update their status to "overdue"
 *   3. Send email notifications to members
 *   4. Create in-app notifications
 *   5. Dispatch webhook events
 *
 * Returns the count of newly overdue payments.
 */
export async function checkOverduePayments(academyId: string): Promise<number> {
  const admin = getAdmin()
  const today = new Date().toISOString().slice(0, 10)

  // Find payments that are pending but past their due date
  const { data: pendingOverdue, error } = await admin
    .from("student_payments")
    .select("id, member_id, plan_id, amount, currency, due_date")
    .eq("academy_id", academyId)
    .eq("status", "pending")
    .lt("due_date", today)

  if (error || !pendingOverdue || pendingOverdue.length === 0) {
    return 0
  }

  // Update all matching payments to "overdue"
  const paymentIds = pendingOverdue.map((p) => p.id)
  await admin
    .from("student_payments")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .in("id", paymentIds)

  // Gather member IDs for notifications
  const memberIds = [...new Set(pendingOverdue.map((p) => p.member_id))]

  // Fetch member details (name, email) and plan details in parallel
  const [membersRes, plansRes, academyRes] = await Promise.all([
    admin
      .from("members")
      .select("id, full_name, email")
      .in("id", memberIds),
    admin
      .from("student_plans")
      .select("id, name")
      .in(
        "id",
        pendingOverdue.map((p) => p.plan_id),
      ),
    admin
      .from("academies")
      .select("name")
      .eq("id", academyId)
      .single(),
  ])

  const memberMap = new Map(
    (membersRes.data ?? []).map((m) => [m.id, m]),
  )
  const planMap = new Map(
    (plansRes.data ?? []).map((p) => [p.id, p]),
  )
  const academyName = academyRes.data?.name ?? "Your Academy"

  // Process each newly overdue payment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationPromises: Promise<any>[] = []

  for (const payment of pendingOverdue) {
    const member = memberMap.get(payment.member_id)
    const plan = planMap.get(payment.plan_id)

    if (!member) continue

    const daysOverdue = Math.floor(
      (Date.now() - new Date(payment.due_date).getTime()) / (24 * 60 * 60 * 1000),
    )

    // a. Send email notification
    if (member.email) {
      notificationPromises.push(
        sendOverdueNotificationEmail({
          to: member.email,
          memberName: member.full_name,
          planName: plan?.name ?? "Student Plan",
          amount: payment.amount,
          currency: payment.currency,
          daysOverdue,
          academyName,
        }).catch((err) => {
          console.error(`[overdue] Email failed for ${member.email}:`, err)
        }),
      )
    }

    // b. Create in-app notification
    notificationPromises.push(
      (async () => {
        const { error: notifError } = await admin
          .from("notifications")
          .insert({
            academy_id: academyId,
            member_id: payment.member_id,
            type: "payment_overdue",
            title: "Payment Overdue",
            body: `Your payment of ${payment.currency} ${payment.amount.toFixed(2)} for ${plan?.name ?? "your plan"} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`,
            is_read: false,
            metadata: {
              payment_id: payment.id,
              amount: payment.amount,
              due_date: payment.due_date,
            },
          })
        if (notifError) {
          console.error("[overdue] Notification insert failed:", notifError.message)
        }
      })(),
    )

    // c. Dispatch webhook event
    notificationPromises.push(
      dispatchWebhookEvent(academyId, "payment.overdue", {
        payment_id: payment.id,
        member_id: payment.member_id,
        member_name: member.full_name,
        plan_name: plan?.name ?? null,
        amount: payment.amount,
        currency: payment.currency,
        due_date: payment.due_date,
        days_overdue: daysOverdue,
      }),
    )
  }

  // Fire all notifications in parallel (non-blocking)
  await Promise.allSettled(notificationPromises)

  return pendingOverdue.length
}
