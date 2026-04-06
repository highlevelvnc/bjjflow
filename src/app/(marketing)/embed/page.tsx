import { createClient } from "@supabase/supabase-js"

// ─── Lazy admin client ──────────────────────────────────────────────────────

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS: readonly string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_SHORT: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDayLabel(i: number): string {
  return DAYS[i] ?? ""
}

function getDayShort(i: number): string {
  return DAY_SHORT[i] ?? ""
}

const TYPE_COLORS_DARK: Record<string, { border: string; bg: string; text: string }> = {
  regular:          { border: "border-l-indigo-500",  bg: "bg-indigo-500/8",  text: "text-indigo-400" },
  open_mat:         { border: "border-l-emerald-500", bg: "bg-emerald-500/8", text: "text-emerald-400" },
  competition_prep: { border: "border-l-red-500",     bg: "bg-red-500/8",     text: "text-red-400" },
  private:          { border: "border-l-amber-500",   bg: "bg-amber-500/8",   text: "text-amber-400" },
  seminar:          { border: "border-l-purple-500",   bg: "bg-purple-500/8",  text: "text-purple-400" },
  kids:             { border: "border-l-yellow-500",   bg: "bg-yellow-500/8",  text: "text-yellow-400" },
}

const TYPE_COLORS_LIGHT: Record<string, { border: string; bg: string; text: string }> = {
  regular:          { border: "border-l-indigo-500",  bg: "bg-indigo-50",  text: "text-indigo-700" },
  open_mat:         { border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  competition_prep: { border: "border-l-red-500",     bg: "bg-red-50",     text: "text-red-700" },
  private:          { border: "border-l-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
  seminar:          { border: "border-l-purple-500",   bg: "bg-purple-50",  text: "text-purple-700" },
  kids:             { border: "border-l-yellow-500",   bg: "bg-yellow-50",  text: "text-yellow-700" },
}

const GI_BADGES_DARK: Record<GiType, { label: string; cls: string }> = {
  gi:   { label: "Gi",       cls: "bg-blue-500/15 text-blue-400" },
  nogi: { label: "No-Gi",    cls: "bg-orange-500/15 text-orange-400" },
  both: { label: "Gi/No-Gi", cls: "bg-gray-500/15 text-gray-400" },
}

const GI_BADGES_LIGHT: Record<GiType, { label: string; cls: string }> = {
  gi:   { label: "Gi",       cls: "bg-blue-100 text-blue-700" },
  nogi: { label: "No-Gi",    cls: "bg-orange-100 text-orange-700" },
  both: { label: "Gi/No-Gi", cls: "bg-gray-100 text-gray-600" },
}

const TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  open_mat: "Open Mat",
  competition_prep: "Comp Prep",
  private: "Private",
  seminar: "Seminar",
  kids: "Kids",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
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

function reorderDays(today: number): { dayIndex: number; dayName: string }[] {
  const ordered: { dayIndex: number; dayName: string }[] = []
  for (let i = 0; i < 7; i++) {
    const idx = (today + i) % 7
    ordered.push({ dayIndex: idx, dayName: getDayLabel(idx) })
  }
  return ordered
}

// ─── Page ───────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ academy?: string; theme?: string }>
}

export default async function EmbedPage({ searchParams }: Props) {
  const params = await searchParams
  const slug = params.academy
  const isLight = params.theme === "light"

  if (!slug) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 ${isLight ? "bg-white" : "bg-gray-950"}`}>
        <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-500"}`}>
          No academy specified. Add <code className={`rounded px-1 py-0.5 text-xs ${isLight ? "bg-gray-100" : "bg-white/10"}`}>?academy=your-slug</code> to the URL.
        </p>
      </div>
    )
  }

  const admin = getAdmin()

  const { data: academy, error: academyError } = await admin
    .from("academies")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .single()

  if (academyError || !academy) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 ${isLight ? "bg-white" : "bg-gray-950"}`}>
        <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-500"}`}>
          Academy not found.
        </p>
      </div>
    )
  }

  const { data: classes } = await admin
    .from("classes")
    .select("id, name, class_type, gi_type, day_of_week, start_time, end_time, room, is_active")
    .eq("academy_id", academy.id)
    .eq("is_active", true)
    .eq("is_recurring", true)
    .order("start_time", { ascending: true })

  const allClasses = (classes ?? []) as ClassRow[]

  const byDay = new Map<number, ClassRow[]>()
  for (let d = 0; d < 7; d++) byDay.set(d, [])
  for (const cls of allClasses) {
    if (cls.day_of_week != null && cls.day_of_week >= 0 && cls.day_of_week <= 6) {
      byDay.get(cls.day_of_week)!.push(cls)
    }
  }
  for (const [, arr] of byDay) {
    arr.sort(sortByTime)
  }

  function classesForDay(d: number): ClassRow[] {
    return byDay.get(d) ?? []
  }

  const today = new Date().getDay()
  const typeColors = isLight ? TYPE_COLORS_LIGHT : TYPE_COLORS_DARK
  const giBadges = isLight ? GI_BADGES_LIGHT : GI_BADGES_DARK

  // Theme-dependent classes
  const t = {
    bg: isLight ? "bg-white" : "bg-gray-950",
    text: isLight ? "text-gray-900" : "text-white",
    textMuted: isLight ? "text-gray-500" : "text-gray-500",
    textSecondary: isLight ? "text-gray-600" : "text-gray-400",
    textName: isLight ? "text-gray-900" : "text-gray-100",
    dayBg: isLight ? "bg-gray-100" : "bg-white/4",
    dayText: isLight ? "text-gray-600" : "text-gray-400",
    todayBg: isLight ? "bg-indigo-50" : "bg-brand-500/15",
    todayText: isLight ? "text-indigo-600" : "text-brand-400",
    todayDot: isLight ? "bg-indigo-500" : "bg-brand-400",
    todayBadgeBg: isLight ? "bg-indigo-100" : "bg-brand-500/20",
    todayBadgeText: isLight ? "text-indigo-600" : "text-brand-300",
    emptyBorder: isLight ? "border-gray-200" : "border-white/8",
    emptyText: isLight ? "text-gray-400" : "text-gray-600",
    legendBorder: isLight ? "border-gray-200" : "border-white/6",
    legendBg: isLight ? "bg-gray-50" : "bg-white/2",
    legendLabel: isLight ? "text-gray-500" : "text-gray-500",
    footerBorder: isLight ? "border-gray-200" : "border-white/6",
    footerText: isLight ? "text-gray-400" : "text-gray-600",
    footerLink: isLight ? "text-gray-500 hover:text-indigo-500" : "text-gray-500 hover:text-brand-400",
    roomBg: isLight ? "bg-gray-100" : "bg-white/6",
    roomText: isLight ? "text-gray-500" : "text-gray-500",
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} p-3`}>
      {/* Academy name — compact header */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className={`text-sm font-semibold ${t.textName}`}>{academy.name}</h2>
        <span className={`text-xs ${t.textMuted}`}>Schedule</span>
      </div>

      {/* Desktop: 7-col grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, i) => (
            <div key={day} className="min-w-0">
              <div
                className={`mb-2 rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                  i === today ? `${t.todayBg} ${t.todayText}` : `${t.dayBg} ${t.dayText}`
                }`}
              >
                {getDayShort(i)}
                {i === today && (
                  <span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${t.todayDot}`} />
                )}
              </div>
              <div className="space-y-1.5">
                {classesForDay(i).length === 0 ? (
                  <div className={`rounded-md border border-dashed ${t.emptyBorder} px-2 py-4 text-center text-[10px] ${t.emptyText}`}>
                    No classes
                  </div>
                ) : (
                  classesForDay(i).map((cls) => {
                    const colors = typeColors[cls.class_type] ?? typeColors.regular!
                    const gi = giBadges[cls.gi_type] ?? giBadges.both
                    return (
                      <div key={cls.id} className={`rounded-md border-l-[3px] px-2 py-2 ${colors.border} ${colors.bg}`}>
                        <p className={`text-xs font-medium leading-tight ${t.textName}`}>{cls.name}</p>
                        <p className={`mt-0.5 text-[10px] font-medium ${t.textSecondary}`}>
                          {formatTime(cls.start_time)} &ndash; {formatTime(cls.end_time)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-medium ${gi.cls}`}>
                            {gi.label}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet: 3-4 col grid */}
      <div className="hidden md:block lg:hidden">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {reorderDays(today).map(({ dayIndex }) => (
            <div key={dayIndex} className="min-w-0">
              <div
                className={`mb-2 rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                  dayIndex === today ? `${t.todayBg} ${t.todayText}` : `${t.dayBg} ${t.dayText}`
                }`}
              >
                {getDayShort(dayIndex)}
                {dayIndex === today && (
                  <span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${t.todayDot}`} />
                )}
              </div>
              <div className="space-y-1.5">
                {classesForDay(dayIndex).length === 0 ? (
                  <div className={`rounded-md border border-dashed ${t.emptyBorder} px-2 py-3 text-center text-[10px] ${t.emptyText}`}>
                    Rest day
                  </div>
                ) : (
                  classesForDay(dayIndex).map((cls) => {
                    const colors = typeColors[cls.class_type] ?? typeColors.regular!
                    const gi = giBadges[cls.gi_type] ?? giBadges.both
                    return (
                      <div key={cls.id} className={`rounded-md border-l-[3px] px-2 py-2 ${colors.border} ${colors.bg}`}>
                        <p className={`text-[11px] font-medium leading-tight ${t.textName}`}>{cls.name}</p>
                        <p className={`mt-0.5 text-[10px] font-medium ${t.textSecondary}`}>
                          {formatTime(cls.start_time)} &ndash; {formatTime(cls.end_time)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-medium ${gi.cls}`}>
                            {gi.label}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: day-by-day, today first */}
      <div className="md:hidden">
        <div className="space-y-4">
          {reorderDays(today).map(({ dayIndex, dayName }) => (
            <div key={dayIndex}>
              <div
                className={`mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                  dayIndex === today ? `${t.todayBg} ${t.todayText}` : `${t.dayBg} ${t.dayText}`
                }`}
              >
                {dayName}
                {dayIndex === today && (
                  <span className={`rounded-full ${t.todayBadgeBg} px-1.5 py-0.5 text-[10px] font-medium ${t.todayBadgeText}`}>
                    Today
                  </span>
                )}
              </div>
              {classesForDay(dayIndex).length === 0 ? (
                <div className={`rounded-md border border-dashed ${t.emptyBorder} px-3 py-4 text-center text-xs ${t.emptyText}`}>
                  No classes scheduled
                </div>
              ) : (
                <div className="space-y-1.5">
                  {classesForDay(dayIndex).map((cls) => {
                    const colors = typeColors[cls.class_type] ?? typeColors.regular!
                    const gi = giBadges[cls.gi_type] ?? giBadges.both
                    return (
                      <div key={cls.id} className={`rounded-md border-l-[3px] px-3 py-2 ${colors.border} ${colors.bg}`}>
                        <p className={`text-sm font-medium leading-tight ${t.textName}`}>{cls.name}</p>
                        <p className={`mt-0.5 text-xs font-medium ${t.textSecondary}`}>
                          {formatTime(cls.start_time)} &ndash; {formatTime(cls.end_time)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${gi.cls}`}>
                            {gi.label}
                          </span>
                          {cls.room && (
                            <span className={`inline-block rounded ${t.roomBg} px-1.5 py-0.5 text-[10px] font-medium ${t.roomText}`}>
                              {cls.room}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compact legend */}
      <div className="mt-3">
        <div className={`flex flex-wrap items-center gap-2 rounded-lg border ${t.legendBorder} ${t.legendBg} px-3 py-2`}>
          <span className={`text-[10px] font-medium ${t.legendLabel}`}>Types:</span>
          {Object.entries(TYPE_LABELS).map(([key, label]) => {
            const colors = typeColors[key] ?? typeColors.regular!
            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${colors.border.replace("border-l-", "bg-")}`} />
                {label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Tiny powered-by footer */}
      <div className={`mt-3 border-t ${t.footerBorder} pt-2 text-center`}>
        <p className={`text-[10px] ${t.footerText}`}>
          Powered by{" "}
          <a
            href="https://grapplingflow.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors ${t.footerLink}`}
          >
            GrapplingFlow
          </a>
        </p>
      </div>
    </div>
  )
}
