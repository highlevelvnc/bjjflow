import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { SessionActionsMenu } from "@/components/sessions/SessionActionsMenu"
import { GenerateSessionsButton } from "@/components/sessions/GenerateSessionsButton"

export const metadata: Metadata = {
  title: "Sessions",
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-yellow-500/15 text-yellow-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-white/6 text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

export default async function SessionsPage() {
  const trpc = await createServerCaller()

  const [sessions, classes] = await Promise.all([
    trpc.session.list(),
    trpc.class.list(),
  ])

  const today = new Date().toISOString().split("T")[0]!
  const upcoming = sessions.filter((s) => s.date >= today && s.status !== "cancelled")
  const past = sessions.filter((s) => s.date < today || s.status === "cancelled")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Sessions</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-4">
          <h2 className="mb-3 text-sm font-medium text-gray-300">Generate upcoming sessions</h2>
          <div className="space-y-2">
            {classes.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-100">{cls.name}</span>
                  {cls.day_of_week !== null && (
                    <span className="ml-2 text-xs text-gray-600">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][cls.day_of_week]}s · {formatTime(cls.start_time)}
                    </span>
                  )}
                </div>
                {cls.day_of_week !== null ? (
                  <GenerateSessionsButton classId={cls.id} />
                ) : (
                  <span className="text-xs text-gray-600">No day set</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description={
            classes.length === 0
              ? "Create a class first, then generate sessions."
              : "Use the panel above to generate upcoming sessions for your classes."
          }
          action={
            classes.length === 0 ? (
              <Link
                href="/app/classes/new"
                className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
              >
                Create a Class
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && <SessionTable title="Upcoming" sessions={upcoming} />}
          {past.length > 0 && <SessionTable title="Past" sessions={past} muted />}
        </div>
      )}
    </div>
  )
}

type SessionWithMeta = Awaited<
  ReturnType<Awaited<ReturnType<typeof createServerCaller>>["session"]["list"]>
>[number]

function SessionTable({ title, sessions, muted }: { title: string; sessions: SessionWithMeta[]; muted?: boolean }) {
  return (
    <div>
      <h2 className={`mb-2 text-xs font-medium uppercase tracking-wide ${muted ? "text-gray-600" : "text-gray-500"}`}>
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
        <table className="min-w-full divide-y divide-white/8">
          <thead>
            <tr className="bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Instructor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Attendance</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {sessions.map((session) => (
              <tr key={session.id} className={muted ? "opacity-50" : ""}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-100">{formatDate(session.date)}</p>
                  <p className="text-xs text-gray-600">{formatTime(session.start_time)}–{formatTime(session.end_time)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-100">{session.class?.name ?? "—"}</p>
                  {session.class?.gi_type && <p className="text-xs text-gray-600 capitalize">{session.class.gi_type}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {session.instructor?.full_name ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[session.status] ?? ""}`}>
                    {STATUS_LABELS[session.status] ?? session.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {session.status === "cancelled" ? (
                    <span className="text-gray-700">—</span>
                  ) : (
                    <Link href={`/app/sessions/${session.id}/attendance`} className="text-gray-400 hover:underline">
                      {session.attendance_count} present
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <SessionActionsMenu sessionId={session.id} status={session.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
