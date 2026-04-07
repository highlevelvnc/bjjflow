import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export interface BillingBlockStatus {
  blocked: boolean
  thresholdDays: number     // 0 = blocking disabled
  daysOverdue: number       // worst (largest) days overdue across all unpaid payments
  overdueAmount: number     // sum of unpaid (overdue+pending past due) amounts
  overdueCount: number
  oldestDueDate: string | null
}

/**
 * Checks whether a member should be blocked from training/portal because of
 * an unpaid bill. Uses the academy's `block_after_days_overdue` setting.
 *
 * Returns blocked=false when:
 *  - the academy has blocking disabled (threshold = 0)
 *  - the member has no overdue/pending-past-due payments
 *  - the worst days-overdue is below the threshold
 */
export async function getMemberBillingStatus(
  supabase: SupabaseClient<Database>,
  academyId: string,
  memberId: string,
): Promise<BillingBlockStatus> {
  const today = new Date().toISOString().slice(0, 10)

  const [academyRes, paymentsRes] = await Promise.all([
    supabase
      .from("academies")
      .select("block_after_days_overdue")
      .eq("id", academyId)
      .single(),
    supabase
      .from("student_payments")
      .select("amount, due_date, status")
      .eq("academy_id", academyId)
      .eq("member_id", memberId)
      .in("status", ["pending", "overdue"])
      .lt("due_date", today)
      .order("due_date", { ascending: true }),
  ])

  const thresholdDays = academyRes.data?.block_after_days_overdue ?? 0
  const payments = paymentsRes.data ?? []

  if (payments.length === 0) {
    return {
      blocked: false,
      thresholdDays,
      daysOverdue: 0,
      overdueAmount: 0,
      overdueCount: 0,
      oldestDueDate: null,
    }
  }

  const oldest = payments[0]!
  const oldestDueDate = oldest.due_date
  const daysOverdue = Math.floor(
    (Date.now() - new Date(oldestDueDate + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24),
  )
  const overdueAmount = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)

  const blocked = thresholdDays > 0 && daysOverdue >= thresholdDays

  return {
    blocked,
    thresholdDays,
    daysOverdue,
    overdueAmount,
    overdueCount: payments.length,
    oldestDueDate,
  }
}
