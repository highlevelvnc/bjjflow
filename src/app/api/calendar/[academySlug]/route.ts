import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Lazy admin client — avoids build-time errors from missing env vars
function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** Escapes special characters in iCalendar text fields. */
function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

/** Formats a date + time (HH:MM) into iCalendar DTSTART/DTEND with TZID. */
function icsDateTime(date: string, time: string, timezone: string): string {
  // date = "2026-04-06", time = "18:00"
  const [y, mo, d] = date.split("-")
  const [h, m] = time.split(":")
  const stamp = `${y}${mo}${d}T${h}${m}00`
  return `TZID=${timezone}:${stamp}`
}

/** Builds a gi-type label for the summary. */
function giLabel(giType: string | null): string {
  if (giType === "gi") return " (Gi)"
  if (giType === "nogi") return " (No-Gi)"
  if (giType === "both") return " (Gi/No-Gi)"
  return ""
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ academySlug: string }> },
) {
  const { academySlug } = await params
  const classFilter = request.nextUrl.searchParams.get("class")

  const supabase = getAdmin()

  // 1. Look up academy by slug
  const { data: academy, error: academyError } = await supabase
    .from("academies")
    .select("id, name, slug, timezone")
    .eq("slug", academySlug)
    .single()

  if (academyError || !academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 404 })
  }

  // 2. Fetch upcoming sessions (next 30 days)
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)

  const todayStr = today.toISOString().split("T")[0]!
  const futureStr = thirtyDaysLater.toISOString().split("T")[0]!

  let sessionsQuery = supabase
    .from("class_sessions")
    .select("id, class_id, date, start_time, end_time, instructor_id, status, notes, topic")
    .eq("academy_id", academy.id)
    .in("status", ["scheduled", "in_progress"])
    .gte("date", todayStr)
    .lte("date", futureStr)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (classFilter) {
    sessionsQuery = sessionsQuery.eq("class_id", classFilter)
  }

  const { data: sessions, error: sessionsError } = await sessionsQuery

  if (sessionsError) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }

  // 3. Fetch class details for all sessions
  const classIds = [...new Set((sessions ?? []).map((s) => s.class_id))]
  const instructorIds = [
    ...new Set((sessions ?? []).map((s) => s.instructor_id).filter((id): id is string => id !== null)),
  ]

  const [classesResult, instructorsResult] = await Promise.all([
    classIds.length > 0
      ? supabase
          .from("classes")
          .select("id, name, gi_type, class_type, room")
          .eq("academy_id", academy.id)
          .in("id", classIds)
      : Promise.resolve({ data: [] }),
    instructorIds.length > 0
      ? supabase
          .from("members")
          .select("id, full_name")
          .eq("academy_id", academy.id)
          .in("id", instructorIds)
      : Promise.resolve({ data: [] }),
  ])

  const classMap = new Map((classesResult.data ?? []).map((c) => [c.id, c]))
  const instructorMap = new Map((instructorsResult.data ?? []).map((m) => [m.id, m]))

  const timezone = academy.timezone || "America/Sao_Paulo"

  // 4. Build iCalendar file
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kumo//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(academy.name)} — Class Schedule`,
    `X-WR-TIMEZONE:${timezone}`,
  ]

  for (const session of sessions ?? []) {
    const cls = classMap.get(session.class_id)
    const instructor = session.instructor_id ? instructorMap.get(session.instructor_id) : null

    const summary = cls ? `${cls.name}${giLabel(cls.gi_type)}` : "Class Session"

    const descParts: string[] = []
    if (cls?.class_type) descParts.push(`Type: ${cls.class_type.replace(/_/g, " ")}`)
    if (instructor?.full_name) descParts.push(`Instructor: ${instructor.full_name}`)
    if (session.topic) descParts.push(`Topic: ${session.topic}`)
    const description = descParts.length > 0 ? descParts.join("\\n") : `Class at ${academy.name}`

    lines.push("BEGIN:VEVENT")
    lines.push(`DTSTART;${icsDateTime(session.date, session.start_time, timezone)}`)
    lines.push(`DTEND;${icsDateTime(session.date, session.end_time, timezone)}`)
    lines.push(`SUMMARY:${icsEscape(summary)}`)
    lines.push(`DESCRIPTION:${icsEscape(description)}`)
    if (cls?.room) lines.push(`LOCATION:${icsEscape(cls.room)}`)
    lines.push(`UID:session-${session.id}@kumo.com`)
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`)
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  const icsBody = lines.join("\r\n")

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="schedule.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
