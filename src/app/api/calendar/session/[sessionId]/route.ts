import { NextResponse } from "next/server"
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
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params

  const supabase = getAdmin()

  // 1. Fetch session
  const { data: session, error: sessionError } = await supabase
    .from("class_sessions")
    .select("id, academy_id, class_id, date, start_time, end_time, instructor_id, status, topic")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // 2. Fetch class, academy, and instructor in parallel
  const [classResult, academyResult, instructorResult] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, gi_type, class_type, room")
      .eq("id", session.class_id)
      .single(),
    supabase
      .from("academies")
      .select("id, name, timezone")
      .eq("id", session.academy_id)
      .single(),
    session.instructor_id
      ? supabase
          .from("members")
          .select("id, full_name")
          .eq("id", session.instructor_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const cls = classResult.data
  const academy = academyResult.data
  const instructor = instructorResult.data

  if (!academy) {
    return NextResponse.json({ error: "Academy not found" }, { status: 404 })
  }

  const timezone = academy.timezone || "America/Sao_Paulo"
  const summary = cls ? `${cls.name}${giLabel(cls.gi_type)}` : "Class Session"

  const descParts: string[] = []
  descParts.push(`Academy: ${academy.name}`)
  if (cls?.class_type) descParts.push(`Type: ${cls.class_type.replace(/_/g, " ")}`)
  if (instructor?.full_name) descParts.push(`Instructor: ${instructor.full_name}`)
  if (session.topic) descParts.push(`Topic: ${session.topic}`)
  const description = descParts.join("\\n")

  // 3. Build single-event .ics
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GrapplingFlow//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(summary)}`,
    `X-WR-TIMEZONE:${timezone}`,
    "BEGIN:VEVENT",
    `DTSTART;${icsDateTime(session.date, session.start_time, timezone)}`,
    `DTEND;${icsDateTime(session.date, session.end_time, timezone)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
  ]

  if (cls?.room) lines.push(`LOCATION:${icsEscape(cls.room)}`)

  lines.push(`UID:session-${session.id}@grapplingflow.com`)
  lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`)
  lines.push("END:VEVENT")
  lines.push("END:VCALENDAR")

  const icsBody = lines.join("\r\n")

  // Use a descriptive filename with date
  const filename = `session-${session.date}.ics`

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
