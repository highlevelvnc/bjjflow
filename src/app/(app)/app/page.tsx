import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { AttendanceChart } from "@/components/dashboard/AttendanceChart"

export const metadata: Metadata = {
  title: "Dashboard",
}

function timeAgoShort(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

export default async function DashboardPage() {
  const trpc = await createServerCaller()

  const [academy, counts, upcoming, atRisk, attendanceTrend, recentAnnouncements, overdueSummary] = await Promise.all([
    trpc.academy.getCurrent(),
    trpc.member.getCounts(),
    trpc.session.listUpcoming({ limit: 5 }),
    trpc.member.getAtRisk().catch(() => [] as Awaited<ReturnType<typeof trpc.member.getAtRisk>>),
    trpc.member.getAttendanceTrend().catch(() => [] as { label: string; count: number }[]),
    trpc.announcement.list({ limit: 3, offset: 0 }).catch(() => ({ items: [] as { id: string; title: string; content: string; priority: string; published_at: string | null }[], total: 0 })),
    trpc.finance.overdueSummary().catch(() => ({ count: 0, totalAmount: 0 })),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">{academy.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500 capitalize">
          {academy.plan} plan · {academy.timezone}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Members" value={counts.total} href="/app/members" />
        <StatCard label="Active Students" value={counts.students} href="/app/members" />
        <StatCard label="Instructors" value={counts.instructors} href="/app/members" />
        <StatCard label="Admins" value={counts.admins} href="/app/members" />
      </div>

      {/* Overdue payments alert (admin only) */}
      {overdueSummary.count > 0 && (
        <Link
          href="/app/analytics/finance"
          className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 px-5 py-4 transition-colors hover:border-red-500/30 hover:bg-red-950/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-400">
              {overdueSummary.count} payment{overdueSummary.count !== 1 ? "s" : ""} overdue
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Totaling R${overdueSummary.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="shrink-0 text-xs text-gray-500">View details →</span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming sessions */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Upcoming Sessions</h2>
            <Link href="/app/sessions" className="text-xs text-gray-500 hover:text-gray-300">
              View all →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500">No upcoming sessions.</p>
              <Link
                href="/app/sessions"
                className="mt-2 inline-block text-sm text-gray-100 underline hover:no-underline"
              >
                Generate sessions
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {upcoming.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/app/sessions/${session.id}/attendance`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/4"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white/8 text-center">
                      <span className="text-[10px] font-medium uppercase leading-none text-gray-500">
                        {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                      <span className="mt-0.5 text-lg font-semibold leading-none text-gray-100">
                        {new Date(session.date + "T00:00:00").getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">
                        {session.class?.name ?? "Class"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatTime(session.start_time)}–{formatTime(session.end_time)}
                        {session.class?.gi_type && (
                          <span className="ml-1 capitalize text-gray-600">
                            · {session.class.gi_type}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-100">
                        {session.attendance_count}
                      </span>
                      <p className="text-xs text-gray-600">present</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* At-risk students */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">At-Risk Students</h2>
            <Link href="/app/members" className="text-xs text-gray-500 hover:text-gray-300">
              View all →
            </Link>
          </div>

          {atRisk.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500">No at-risk students detected.</p>
              <p className="mt-1 text-xs text-gray-600">
                Requires ≥ 4 completed sessions in the last 30 days.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {atRisk.map((student) => (
                <li key={student.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs font-bold text-red-400"
                    title={`${student.rate}% attendance`}
                  >
                    {student.rate}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">
                      {student.full_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <BeltBadge belt={student.belt_rank} stripes={student.stripes} />
                      <span className="text-xs text-gray-600">{student.reason}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Attendance trend */}
      {attendanceTrend.length > 0 && (
        <section className="rounded-xl border border-white/8 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-100">Attendance Trend (Last 4 Weeks)</h2>
          <AttendanceChart weeks={attendanceTrend} />
        </section>
      )}

      {/* Recent Announcements */}
      {recentAnnouncements.items.length > 0 && (
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Recent Announcements</h2>
            <Link href="/app/announcements" className="text-xs text-gray-500 hover:text-gray-300">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-white/6">
            {recentAnnouncements.items.map((a) => {
              const dotColor =
                a.priority === "urgent"
                  ? "bg-red-500"
                  : a.priority === "important"
                    ? "bg-amber-500"
                    : "bg-gray-500"
              return (
                <li key={a.id}>
                  <Link
                    href="/app/announcements"
                    className="flex items-start gap-3 px-5 py-3 hover:bg-white/4"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">{a.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{a.content}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-600">
                      {a.published_at ? timeAgoShort(a.published_at) : ""}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <h2 className="text-sm font-medium text-gray-100">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/app/members/new"
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
          >
            Add Member
          </Link>
          <Link
            href="/app/classes/new"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            New Class
          </Link>
          <Link
            href="/app/sessions"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            Sessions
          </Link>
          <Link
            href="/app/members/invite"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            Invite Instructor
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-white/8 bg-gray-900 px-5 py-4 hover:border-white/15 hover:bg-gray-800"
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </Link>
  )
}
