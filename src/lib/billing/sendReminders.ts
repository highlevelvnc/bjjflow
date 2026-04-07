import "server-only"

import { createClient } from "@supabase/supabase-js"
import { sendPaymentReminderEmail } from "@/lib/email"
import type { Database } from "@/types/database"

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Sends "payment due in 3 days" reminder emails to members of `academyId`.
 *
 * Looks for pending payments whose due_date is exactly 3 days from now.
 */
export async function sendPaymentRemindersForAcademy(
  academyId: string,
): Promise<number> {
  const admin = getAdmin()

  const target = new Date()
  target.setDate(target.getDate() + 3)
  const targetStr = target.toISOString().slice(0, 10)

  const { data: payments } = await admin
    .from("student_payments")
    .select("id, member_id, plan_id, amount, currency, due_date")
    .eq("academy_id", academyId)
    .eq("status", "pending")
    .eq("due_date", targetStr)

  if (!payments || payments.length === 0) return 0

  const memberIds = [...new Set(payments.map((p) => p.member_id))]
  const planIds = [...new Set(payments.map((p) => p.plan_id))]

  const [membersRes, plansRes, academyRes] = await Promise.all([
    admin.from("members").select("id, full_name, email").in("id", memberIds),
    admin.from("student_plans").select("id, name").in("id", planIds),
    admin.from("academies").select("name").eq("id", academyId).single(),
  ])

  const memberMap = new Map((membersRes.data ?? []).map((m) => [m.id, m]))
  const planMap = new Map((plansRes.data ?? []).map((p) => [p.id, p]))
  const academyName = academyRes.data?.name ?? "Sua Academia"

  let sent = 0
  for (const payment of payments) {
    const member = memberMap.get(payment.member_id)
    if (!member?.email) continue
    const plan = planMap.get(payment.plan_id)

    const ok = await sendPaymentReminderEmail({
      to: member.email,
      memberName: member.full_name,
      planName: plan?.name ?? "Mensalidade",
      amount: Number(payment.amount),
      currency: payment.currency,
      dueDate: payment.due_date,
      academyName,
    }).catch((err) => {
      console.error(`[reminder] email failed for ${member.email}:`, err)
      return false
    })
    if (ok) sent++
  }

  return sent
}
