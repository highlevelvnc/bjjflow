import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerCaller } from "@/lib/trpc/server"
import {
  AttendanceTracker,
  type AttendanceMember,
  type AttendanceRecord,
} from "@/components/attendance/AttendanceTracker"

export const metadata: Metadata = {
  title: "Frequência",
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-white/6 text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
}

const GI_LABELS: Record<string, string> = {
  gi: "Gi",
  nogi: "No-Gi",
  both: "Gi + No-Gi",
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function AttendancePage({ params }: Props) {
  const { id } = await params
  const trpc = await createServerCaller()

  let data: Awaited<ReturnType<typeof trpc.attendance.forSession>>
  try {
    data = await trpc.attendance.forSession({ sessionId: id })
  } catch {
    notFound()
  }

  const { session, members, attendance } = data

  const trackerMembers: AttendanceMember[] = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    belt_rank: m.belt_rank,
    stripes: m.stripes,
    role: m.role,
    avatar_url: m.avatar_url,
  }))

  const trackerAttendance: AttendanceRecord[] = attendance.map((a) => ({
    id: a.id,
    member_id: a.member_id,
    checked_in_at: a.checked_in_at,
    check_in_method: a.check_in_method,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/app/sessions" className="text-sm text-gray-500 hover:text-gray-300">
          ← Aulas
        </Link>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-100">
              {session.class?.name ?? "Aula"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {formatDate(session.date)} · {formatTime(session.start_time)}–{formatTime(session.end_time)}
              {session.class?.gi_type && (
                <> · {GI_LABELS[session.class.gi_type] ?? session.class.gi_type}</>
              )}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[session.status] ?? "bg-white/6 text-gray-500"}`}>
            {STATUS_LABELS[session.status] ?? session.status}
          </span>
        </div>
      </div>

      <AttendanceTracker
        sessionId={id}
        sessionStatus={session.status}
        members={trackerMembers}
        initialAttendance={trackerAttendance}
      />
    </div>
  )
}
