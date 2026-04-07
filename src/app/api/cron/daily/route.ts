import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkOverduePayments } from "@/lib/alerts/overdue"
import { generateMonthlyPaymentsForAcademy } from "@/lib/billing/generateMonthly"
import { sendPaymentRemindersForAcademy } from "@/lib/billing/sendReminders"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Daily cron — runs ALL billing tasks in sequence for every active academy.
 * Consolidated into a single endpoint to fit Vercel Hobby's 2-cron limit.
 *
 * Tasks per academy:
 *   1. Generate next pending payments (idempotent, ~35 days ahead)
 *   2. Send "due in 3 days" reminder emails
 *   3. Mark past-due pending payments as overdue + send notifications
 *
 * Requires `Authorization: Bearer <CRON_SECRET>` header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: academies, error } = await admin
      .from("academies")
      .select("id, name")
      .in("status", ["active", "trialing"])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results: {
      academyId: string
      name: string
      generated: number
      reminders: number
      newlyOverdue: number
    }[] = []

    for (const academy of academies ?? []) {
      const r = { academyId: academy.id, name: academy.name, generated: 0, reminders: 0, newlyOverdue: 0 }
      try {
        r.generated = await generateMonthlyPaymentsForAcademy(academy.id)
      } catch (err) {
        console.error(`[cron/daily] generate failed ${academy.id}:`, err)
      }
      try {
        r.reminders = await sendPaymentRemindersForAcademy(academy.id)
      } catch (err) {
        console.error(`[cron/daily] reminders failed ${academy.id}:`, err)
      }
      try {
        r.newlyOverdue = await checkOverduePayments(academy.id)
      } catch (err) {
        console.error(`[cron/daily] overdue failed ${academy.id}:`, err)
      }
      results.push(r)
    }

    const totals = results.reduce(
      (s, r) => ({
        generated: s.generated + r.generated,
        reminders: s.reminders + r.reminders,
        newlyOverdue: s.newlyOverdue + r.newlyOverdue,
      }),
      { generated: 0, reminders: 0, newlyOverdue: 0 },
    )

    return NextResponse.json({
      message: `Processed ${results.length} academies`,
      totals,
      results,
    })
  } catch (err) {
    console.error("[cron/daily] unexpected:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
