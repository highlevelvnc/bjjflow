import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkOverduePayments } from "@/lib/alerts/overdue"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/overdue-check
 *
 * Checks all active academies for overdue payments, updates statuses,
 * and sends notifications. Designed to be triggered by Vercel Cron or
 * an external scheduler (daily at midnight recommended).
 *
 * Requires `Authorization: Bearer <CRON_SECRET>` header.
 */
export async function POST(request: Request) {
  // Verify authorization
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

    // Fetch all active academies
    const { data: academies, error } = await admin
      .from("academies")
      .select("id, name")
      .in("status", ["active", "trialing"])

    if (error) {
      console.error("[cron/overdue] Failed to fetch academies:", error.message)
      return NextResponse.json(
        { error: "Failed to fetch academies" },
        { status: 500 },
      )
    }

    if (!academies || academies.length === 0) {
      return NextResponse.json({ message: "No active academies", results: [] })
    }

    // Process each academy
    const results: { academyId: string; name: string; newlyOverdue: number }[] = []

    for (const academy of academies) {
      try {
        const count = await checkOverduePayments(academy.id)
        results.push({
          academyId: academy.id,
          name: academy.name,
          newlyOverdue: count,
        })
      } catch (err) {
        console.error(`[cron/overdue] Error for academy ${academy.id}:`, err)
        results.push({
          academyId: academy.id,
          name: academy.name,
          newlyOverdue: -1, // indicates error
        })
      }
    }

    const totalOverdue = results.reduce(
      (s, r) => s + Math.max(r.newlyOverdue, 0),
      0,
    )

    return NextResponse.json({
      message: `Processed ${academies.length} academies. ${totalOverdue} newly overdue payments.`,
      results,
    })
  } catch (err) {
    console.error("[cron/overdue] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(request: Request) {
  return POST(request)
}
