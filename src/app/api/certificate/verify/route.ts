import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/server/supabase/server"
import { BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const certId = url.searchParams.get("id")
  const memberId = url.searchParams.get("member")

  if (!certId || !memberId) {
    return NextResponse.json(
      { valid: false, error: "Missing id or member parameter" },
      { status: 400 },
    )
  }

  const supabase = await createServerSupabase()

  // Fetch member
  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, belt_rank, academy_id")
    .eq("id", memberId)
    .single()

  if (!member) {
    return NextResponse.json({ valid: false, error: "Member not found" }, { status: 404 })
  }

  // Fetch academy
  const { data: academy } = await supabase
    .from("academies")
    .select("name")
    .eq("id", member.academy_id)
    .single()

  // Fetch belt history to find matching promotion
  const { data: beltHistory } = await supabase
    .from("member_belt_history")
    .select("belt_rank, stripes, promoted_at")
    .eq("member_id", memberId)
    .order("promoted_at", { ascending: false })

  // Try to match the certificate ID against any known promotion
  let matchedBelt: string | null = null
  let matchedDate: string | null = null

  if (beltHistory) {
    for (const entry of beltHistory) {
      const hash = crypto
        .createHash("sha256")
        .update(`${memberId}-${entry.belt_rank}-${entry.promoted_at}`)
        .digest("hex")
        .slice(0, 8)
      const candidateId = `GF-${hash.toUpperCase()}`

      if (candidateId === certId) {
        matchedBelt = entry.belt_rank
        matchedDate = entry.promoted_at
        break
      }
    }
  }

  // Also check current belt (might not be in belt_history yet)
  if (!matchedBelt) {
    const today = new Date().toISOString().split("T")[0]!
    const hash = crypto
      .createHash("sha256")
      .update(`${memberId}-${member.belt_rank}-${today}`)
      .digest("hex")
      .slice(0, 8)
    const candidateId = `GF-${hash.toUpperCase()}`
    if (candidateId === certId) {
      matchedBelt = member.belt_rank
      matchedDate = today
    }
  }

  if (!matchedBelt) {
    return NextResponse.json({ valid: false, error: "Certificate not recognized" }, { status: 404 })
  }

  const beltLabel = BELT_LABELS[matchedBelt as Belt] ?? matchedBelt

  return NextResponse.json({
    valid: true,
    member: member.full_name,
    belt: beltLabel,
    academy: academy?.name ?? "Unknown",
    date: matchedDate,
  })
}
