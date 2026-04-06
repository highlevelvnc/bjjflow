import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { CopyLinkButton } from "./CopyLinkButton"

// ─── Lazy admin client (avoids build-time errors) ────────────────────────────

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ClassType = "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids"
type GiType = "gi" | "nogi" | "both"

interface ClassRow {
  id: string
  name: string
  class_type: ClassType
  gi_type: GiType
  day_of_week: number | null
  start_time: string
  end_time: string
  room: string | null
  is_active: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS: readonly string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_SHORT: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDayLabel(i: number): string {
  return DAYS[i] ?? ""
}

function getDayShort(i: number): string {
  return DAY_SHORT[i] ?? ""
}

function getTypeColors(classType: string) {
  return TYPE_COLORS[classType] ?? TYPE_COLORS.regular!
}

const TYPE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  regular:          { border: "border-l-indigo-500",  bg: "bg-indigo-500/8",  text: "text-indigo-400" },
  open_mat:         { border: "border-l-emerald-500", bg: "bg-emerald-500/8", text: "text-emerald-400" },
  competition_prep: { border: "border-l-red-500",     bg: "bg-red-500/8",     text: "text-red-400" },
  private:          { border: "border-l-amber-500",   bg: "bg-amber-500/8",   text: "text-amber-400" },
  seminar:          { border: "border-l-purple-500",   bg: "bg-purple-500/8",  text: "text-purple-400" },
  kids:             { border: "border-l-yellow-500",   bg: "bg-yellow-500/8",  text: "text-yellow-400" },
}

const TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  open_mat: "Open Mat",
  competition_prep: "Comp Prep",
  private: "Private",
  seminar: "Seminar",
  kids: "Kids",
}

const GI_BADGES: Record<GiType, { label: string; cls: string }> = {
  gi:   { label: "Gi",    cls: "bg-blue-500/15 text-blue-400" },
  nogi: { label: "No-Gi", cls: "bg-orange-500/15 text-orange-400" },
  both: { label: "Gi/No-Gi", cls: "bg-gray-500/15 text-gray-400" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  // time comes as "HH:MM:SS" or "HH:MM"
  const parts = time.split(":")
  const hour = parseInt(parts[0] ?? "0", 10)
  const minute = parts[1] ?? "00"
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${minute} ${ampm}`
}

function sortByTime(a: ClassRow, b: ClassRow): number {
  return a.start_time.localeCompare(b.start_time)
}

// ─── SEO Metadata ────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ academy?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const slug = params.academy

  if (!slug) {
    return {
      title: "Class Schedule — GrapplingFlow",
      description: "View weekly BJJ class schedules. Find your academy and see class times, types, and more.",
    }
  }

  const admin = getAdmin()
  const { data } = await admin.from("academies").select("name").eq("slug", slug).single()

  return {
    title: `${data?.name ?? "Academy"} — Class Schedule | GrapplingFlow`,
    description: `View the weekly BJJ class schedule for ${data?.name ?? "this academy"}. Brazilian Jiu-Jitsu classes, times, and instructors.`,
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SchedulePage({ searchParams }: Props) {
  const params = await searchParams
  const slug = params.academy

  if (!slug) {
    return <NoAcademyView />
  }

  const admin = getAdmin()

  // Fetch academy
  const { data: academy, error: academyError } = await admin
    .from("academies")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .single()

  if (academyError || !academy) {
    return <NotFoundView />
  }

  // Fetch active recurring classes
  const { data: classes } = await admin
    .from("classes")
    .select("id, name, class_type, gi_type, day_of_week, start_time, end_time, room, is_active")
    .eq("academy_id", academy.id)
    .eq("is_active", true)
    .eq("is_recurring", true)
    .order("start_time", { ascending: true })

  const allClasses = (classes ?? []) as ClassRow[]

  // Group by day — guaranteed all 7 days exist
  const byDay = new Map<number, ClassRow[]>()
  for (let d = 0; d < 7; d++) byDay.set(d, [])
  for (const cls of allClasses) {
    if (cls.day_of_week != null && cls.day_of_week >= 0 && cls.day_of_week <= 6) {
      byDay.get(cls.day_of_week)!.push(cls)
    }
  }
  // Sort each day's classes by start time
  for (const [, arr] of byDay) {
    arr.sort(sortByTime)
  }

  function classesForDay(d: number): ClassRow[] {
    return byDay.get(d) ?? []
  }

  const today = new Date().getDay()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              GF
            </div>
            <span className="text-base font-semibold text-gray-100">GrapplingFlow</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Academy info */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
        <div className="flex items-center gap-4">
          {academy.logo_url ? (
            <Image
              src={academy.logo_url}
              alt={academy.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/15">
              <span className="text-xl font-bold text-brand-400">
                {academy.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{academy.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">Weekly Class Schedule</p>
          </div>
        </div>
      </div>

      {/* Desktop: Weekly grid */}
      <div className="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 lg:block">
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day, i) => (
            <div key={day} className="min-w-0">
              {/* Day header */}
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                  i === today
                    ? "bg-brand-500/15 text-brand-400"
                    : "bg-white/4 text-gray-400"
                }`}
              >
                {day}
                {i === today && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
                )}
              </div>
              {/* Classes */}
              <div className="space-y-2">
                {classesForDay(i).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/8 px-3 py-6 text-center text-xs text-gray-600">
                    No classes
                  </div>
                ) : (
                  classesForDay(i).map((cls) => <ClassCard key={cls.id} cls={cls} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet: Compact grid (3-4 cols) */}
      <div className="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 md:block lg:hidden">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {/* Reorder: today first */}
          {reorderDays(today).map(({ dayIndex }) => (
            <div key={dayIndex} className="min-w-0">
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                  dayIndex === today
                    ? "bg-brand-500/15 text-brand-400"
                    : "bg-white/4 text-gray-400"
                }`}
              >
                {getDayShort(dayIndex)}
                {dayIndex === today && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
                )}
              </div>
              <div className="space-y-2">
                {classesForDay(dayIndex).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/8 px-3 py-4 text-center text-xs text-gray-600">
                    Rest day
                  </div>
                ) : (
                  classesForDay(dayIndex).map((cls) => <ClassCard key={cls.id} cls={cls} compact />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: day-by-day, today first */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:hidden">
        <div className="space-y-6">
          {reorderDays(today).map(({ dayIndex, dayName }) => (
            <div key={dayIndex}>
              <div
                className={`mb-3 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  dayIndex === today
                    ? "bg-brand-500/15 text-brand-400"
                    : "bg-white/4 text-gray-400"
                }`}
              >
                {dayName}
                {dayIndex === today && (
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-medium text-brand-300">
                    Today
                  </span>
                )}
              </div>
              {classesForDay(dayIndex).length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/8 px-4 py-6 text-center text-sm text-gray-600">
                  No classes scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {classesForDay(dayIndex).map((cls) => <ClassCard key={cls.id} cls={cls} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/6 bg-white/2 px-4 py-3">
          <span className="text-xs font-medium text-gray-500">Class types:</span>
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const colors = getTypeColors(key)
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                <span className={`h-2 w-2 rounded-full ${colors.border.replace("border-l-", "bg-")}`} />
                {label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Embed hint footer */}
      <footer className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-gray-600">
            Embed this schedule on your website &mdash; share the link with students
          </p>
          <CopyLinkButton />
        </div>
        <div className="border-t border-white/4">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <p className="text-center text-xs text-gray-700">
              Powered by{" "}
              <Link href="/" className="text-gray-500 transition-colors hover:text-brand-400">
                GrapplingFlow
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Class Card ──────────────────────────────────────────────────────────────

function ClassCard({ cls, compact }: { cls: ClassRow; compact?: boolean }) {
  const colors = getTypeColors(cls.class_type)!
  const gi = GI_BADGES[cls.gi_type] ?? GI_BADGES.both

  return (
    <div
      className={`rounded-lg border-l-[3px] px-3 py-2.5 ${colors.border} ${colors.bg} transition-colors`}
    >
      <p className={`font-medium ${compact ? "text-xs" : "text-sm"} text-gray-100 leading-tight`}>
        {cls.name}
      </p>
      <p className={`mt-1 ${compact ? "text-[10px]" : "text-xs"} font-medium text-gray-400`}>
        {formatTime(cls.start_time)} &ndash; {formatTime(cls.end_time)}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${gi.cls}`}>
          {gi.label}
        </span>
        {!compact && cls.room && (
          <span className="inline-block rounded bg-white/6 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
            {cls.room}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Reorder days starting from today ────────────────────────────────────────

function reorderDays(today: number): { dayIndex: number; dayName: string }[] {
  const ordered: { dayIndex: number; dayName: string }[] = []
  for (let i = 0; i < 7; i++) {
    const idx = (today + i) % 7
    ordered.push({ dayIndex: idx, dayName: getDayLabel(idx) })
  }
  return ordered
}

// ─── No Academy (search) ─────────────────────────────────────────────────────

function NoAcademyView() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              GF
            </div>
            <span className="text-base font-semibold text-gray-100">GrapplingFlow</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15">
            <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Find Your Academy</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your academy&apos;s schedule link to view their weekly class timetable.
          </p>

          <div className="mt-8 rounded-xl border border-white/8 bg-gray-900 p-6 text-left">
            <label htmlFor="schedule-url" className="mb-2 block text-sm font-medium text-gray-300">
              Schedule URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/12 bg-white/6 px-3 py-2.5 text-sm text-gray-500">
                grapplingflow.com/schedule?academy=<span className="text-gray-400">your-slug</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Ask your academy for their GrapplingFlow schedule link.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
            >
              Learn more about GrapplingFlow &rarr;
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/6">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-gray-700">
            Powered by{" "}
            <Link href="/" className="text-gray-500 transition-colors hover:text-brand-400">
              GrapplingFlow
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

// ─── Not Found ───────────────────────────────────────────────────────────────

function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              GF
            </div>
            <span className="text-base font-semibold text-gray-100">GrapplingFlow</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-100">Academy Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t find an academy with that URL. Please check the link and try again.
          </p>
          <Link
            href="/schedule"
            className="mt-6 inline-block text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
          >
            &larr; Back to schedule search
          </Link>
        </div>
      </main>
    </div>
  )
}
