"use client"

import { AnalyticsNav } from "@/components/analytics/AnalyticsNav"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Rating = "excellent" | "good" | "average" | "below_average" | "needs_improvement"

interface BenchmarkMetric {
  name: string
  value: number
  format: string
  percentile: number
  rating: Rating
  p25: number
  p50: number
  p75: number
  p90: number
}

interface BenchmarkData {
  metrics: BenchmarkMetric[]
}

interface BenchmarkClientProps {
  benchmarkData: BenchmarkData
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const RATING_CONFIG: Record<Rating, { label: string; color: string; bgColor: string; textColor: string }> = {
  excellent: {
    label: "Excellent",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
  },
  good: {
    label: "Good",
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
  },
  average: {
    label: "Average",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-400",
  },
  below_average: {
    label: "Below Average",
    color: "bg-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
  },
  needs_improvement: {
    label: "Needs Improvement",
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
  },
}

const ADVICE: Record<string, Record<Rating, string>> = {
  "Avg Attendance / Session": {
    excellent: "Outstanding attendance! Your sessions are well-attended and engaging.",
    good: "Good attendance numbers. Consider adding more popular time slots.",
    average: "Average attendance. Try varying class times or adding themed sessions.",
    below_average: "Attendance is below average. Survey members on preferred times and topics.",
    needs_improvement: "Low attendance needs attention. Review your schedule and marketing efforts.",
  },
  "Retention Rate": {
    excellent: "Amazing retention! Your community is strong and engaged.",
    good: "Good retention. Keep focusing on member experience and community building.",
    average: "Average retention. Consider implementing a welcome program for new members.",
    below_average: "Retention needs work. Reach out to inactive members and ask for feedback.",
    needs_improvement: "Critical: Focus on member onboarding and the first 90-day experience.",
  },
  "Sessions / Week": {
    excellent: "Great schedule coverage! You offer plenty of training opportunities.",
    good: "Good session frequency. Consider adding open mat or special classes.",
    average: "Average schedule. Adding 1-2 more weekly sessions could boost engagement.",
    below_average: "Consider offering more sessions to meet member demand.",
    needs_improvement: "Very few sessions offered. Expanding your schedule should be a top priority.",
  },
  "Growth Rate": {
    excellent: "Exceptional growth! Your academy is attracting new members rapidly.",
    good: "Healthy growth rate. Keep your marketing and referral programs active.",
    average: "Average growth. Try referral incentives or community events to attract members.",
    below_average: "Growth is slow. Review your marketing strategy and trial class offerings.",
    needs_improvement: "Growth needs attention. Consider free trial weeks or partner with local businesses.",
  },
}

function formatValue(value: number, format: string): string {
  if (format === "percent") return `${Math.round(value * 100)}%`
  return String(value)
}

function formatBenchmarkValue(value: number, format: string): string {
  if (format === "percent") return `${Math.round(value * 100)}%`
  return String(value)
}

// ─────────────────────────────────────────────────────────────────────────────
// PercentileGauge
// ─────────────────────────────────────────────────────────────────────────────

function PercentileGauge({
  metric,
}: {
  metric: BenchmarkMetric
}) {
  const { name, value, format, percentile, rating, p25, p50, p75, p90 } = metric
  const config = RATING_CONFIG[rating]
  const advice = ADVICE[name]?.[rating] ?? ""

  // Calculate position of the diamond on the gauge (0-100%)
  // Map percentile to visual position
  const diamondPosition = Math.min(Math.max(percentile, 2), 98)

  // Percentile marker positions
  const markers = [
    { value: p25, label: "P25", position: 25 },
    { value: p50, label: "P50", position: 50 },
    { value: p75, label: "P75", position: 75 },
    { value: p90, label: "P90", position: 90 },
  ]

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400">{name}</h3>
          <p className="mt-1 text-3xl font-bold text-white">{formatValue(value, format)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor}`}
        >
          {config.label}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative mt-2 mb-6">
        {/* Background bar with gradient sections */}
        <div className="relative h-3 w-full rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-red-500/40" style={{ width: "25%" }} />
            <div className="h-full bg-orange-500/40" style={{ width: "25%" }} />
            <div className="h-full bg-blue-500/40" style={{ width: "25%" }} />
            <div className="h-full bg-emerald-500/40" style={{ width: "25%" }} />
          </div>
          {/* Active fill */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${config.color} opacity-80`}
            style={{ width: `${diamondPosition}%` }}
          />
        </div>

        {/* Diamond marker */}
        <div
          className="absolute -top-1"
          style={{ left: `${diamondPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-5 w-5 rotate-45 rounded-sm border-2 border-white bg-gray-900 shadow-lg shadow-black/50" />
        </div>

        {/* Percentile markers below the bar */}
        <div className="relative mt-4 h-6">
          {markers.map((m) => (
            <div
              key={m.label}
              className="absolute flex flex-col items-center"
              style={{ left: `${m.position}%`, transform: "translateX(-50%)" }}
            >
              <div className="h-2 w-px bg-gray-600" />
              <span className="mt-0.5 text-[10px] text-gray-500">
                {m.label}: {formatBenchmarkValue(m.value, format)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Advice text */}
      {advice && (
        <p className="text-sm text-gray-400 mt-2">{advice}</p>
      )}

      {/* Percentile badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">Your percentile:</span>
        <span className={`text-xs font-semibold ${config.textColor}`}>
          Top {100 - percentile}%
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall Score
// ─────────────────────────────────────────────────────────────────────────────

function OverallScore({ metrics }: { metrics: BenchmarkMetric[] }) {
  if (metrics.length === 0) return null

  const avgPercentile = Math.round(
    metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length,
  )
  const topPercent = 100 - avgPercentile
  const isGood = avgPercentile >= 50

  return (
    <div
      className={`rounded-xl border p-8 text-center ${
        isGood
          ? "border-emerald-500/20 bg-emerald-950/20"
          : "border-orange-500/20 bg-orange-950/20"
      }`}
    >
      <p className="text-sm font-medium text-gray-400 mb-2">Overall Academy Score</p>
      <p
        className={`text-6xl font-bold ${
          isGood ? "text-emerald-400" : "text-orange-400"
        }`}
      >
        {avgPercentile}
      </p>
      <p className="mt-1 text-sm text-gray-500">out of 100</p>
      <p
        className={`mt-4 text-lg font-semibold ${
          isGood ? "text-emerald-300" : "text-orange-300"
        }`}
      >
        {isGood
          ? `Your academy scores in the top ${topPercent}% overall!`
          : `Your academy is in the ${topPercent > 50 ? "bottom" : "top"} ${topPercent}%. Let's improve!`}
      </p>
      <p className="mt-2 text-sm text-gray-400">
        {isGood
          ? "Great work! Keep maintaining these standards."
          : "Focus on the areas marked for improvement above to raise your score."}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function BenchmarkClient({ benchmarkData }: BenchmarkClientProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AnalyticsNav />

      <div>
        <h1 className="text-xl font-semibold text-gray-100">
          Academy Benchmark &mdash; How You Compare
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          See how your academy stacks up against industry benchmarks for BJJ academies.
        </p>
      </div>

      {/* Metric gauges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {benchmarkData.metrics.map((metric) => (
          <PercentileGauge key={metric.name} metric={metric} />
        ))}
      </div>

      {/* Overall score */}
      <OverallScore metrics={benchmarkData.metrics} />
    </div>
  )
}
