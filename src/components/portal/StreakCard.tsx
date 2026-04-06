"use client"

import { trpc } from "@/lib/trpc/client"
import { Flame, Trophy } from "lucide-react"

const MILESTONES = [4, 8, 12, 26, 52] as const
const MILESTONE_LABELS: Record<number, string> = {
  4: "1 Month",
  8: "2 Months",
  12: "3 Months",
  26: "6 Months",
  52: "1 Year",
}

function formatLastTraining(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const d = new Date(dateStr + "T00:00:00")
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function StreakCard() {
  const { data, isLoading } = trpc.portal.myStreak.useQuery()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-32 animate-pulse rounded-lg bg-white/5" />
      </div>
    )
  }

  if (!data) return null

  const { currentStreak, longestStreak, totalDays, lastTraining } = data
  const earnedMilestones = MILESTONES.filter((m) => longestStreak >= m)

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-gray-900 p-5">
      {/* Background glow when streak active */}
      {currentStreak > 0 && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/8 blur-3xl" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Flame
            className={`h-5 w-5 ${
              currentStreak > 0
                ? "animate-pulse text-orange-400"
                : "text-gray-600"
            }`}
          />
          <h3 className="text-sm font-medium text-gray-300">Training Streak</h3>
        </div>

        {/* Big number */}
        <div className="mb-4 flex items-baseline gap-2">
          <span
            className={`text-5xl font-extrabold tracking-tight ${
              currentStreak > 0 ? "text-brand-400" : "text-gray-600"
            }`}
          >
            {currentStreak}
          </span>
          <span className="text-sm text-gray-500">
            {currentStreak === 1 ? "week" : "weeks"}
          </span>
          {currentStreak > 0 && (
            <span className="ml-1 text-lg">🔥</span>
          )}
        </div>

        {/* Week progress dots (last 8 weeks) */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-gray-600">Last 8 weeks</p>
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const weekIndex = 7 - i // 7 = oldest, 0 = this week
              const active = weekIndex < currentStreak
              return (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-full transition-colors ${
                    active ? "bg-brand-500" : "bg-white/8"
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>
            Longest: <span className="text-gray-300">{longestStreak} weeks</span>
          </span>
          <span>
            Total days: <span className="text-gray-300">{totalDays}</span>
          </span>
          <span>
            Last: <span className="text-gray-300">{formatLastTraining(lastTraining)}</span>
          </span>
        </div>

        {/* Milestone badges */}
        {earnedMilestones.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {earnedMilestones.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-brand-500/12 px-2 py-0.5 text-xs font-medium text-brand-300"
              >
                <Trophy className="h-3 w-3" />
                {MILESTONE_LABELS[m]}
              </span>
            ))}
          </div>
        )}

        {/* Motivational message when no streak */}
        {currentStreak === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Start your streak! Train this week.
          </p>
        )}
      </div>
    </div>
  )
}
