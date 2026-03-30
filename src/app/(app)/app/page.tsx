import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { BeltBadge } from "@/components/ui/BeltBadge"

export const metadata: Metadata = {
  title: "Dashboard",
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

  const [academy, counts, upcoming, atRisk] = await Promise.all([
    trpc.academy.getCurrent(),
    trpc.member.getCounts(),
    trpc.session.listUpcoming({ limit: 5 }),
    trpc.member.getAtRisk().catch(() => [] as Awaited<ReturnType<typeof trpc.member.getAtRisk>>),
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
