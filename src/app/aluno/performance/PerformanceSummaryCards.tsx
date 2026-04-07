"use client"

import { ArrowUp, Minus, ArrowDown } from "lucide-react"
import type { TechniqueDatum } from "./TechniqueRadarChart"

interface Props {
  data: TechniqueDatum[]
  metricLabel: string
}

export function PerformanceSummaryCards({ data, metricLabel }: Props) {
  if (data.length === 0) return null

  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const sum = values.reduce((s, v) => s + v, 0)
  const avg = sum / values.length

  const top = data.find((d) => d.value === max)
  const bottom = data.find((d) => d.value === min)

  const cards = [
    {
      label: "Maior valor",
      value: max,
      detail: top?.technique,
      icon: <ArrowUp className="h-4 w-4" />,
      tone: "emerald" as const,
    },
    {
      label: "Média",
      value: Math.round(avg * 10) / 10,
      detail: `Por ${data.length} técnicas`,
      icon: <Minus className="h-4 w-4" />,
      tone: "brand" as const,
    },
    {
      label: "Menor valor",
      value: min,
      detail: bottom?.technique,
      icon: <ArrowDown className="h-4 w-4" />,
      tone: "amber" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          label={c.label}
          value={c.value}
          detail={c.detail}
          icon={c.icon}
          tone={c.tone}
          metricLabel={metricLabel}
        />
      ))}
    </div>
  )
}

const TONE_CLASSES = {
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-400",
    value: "text-emerald-300",
  },
  brand: {
    icon: "bg-brand-500/15 text-brand-400",
    value: "text-brand-300",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400",
    value: "text-amber-300",
  },
} as const

function Card({
  label,
  value,
  detail,
  icon,
  tone,
  metricLabel,
}: {
  label: string
  value: number
  detail?: string
  icon: React.ReactNode
  tone: keyof typeof TONE_CLASSES
  metricLabel: string
}) {
  const t = TONE_CLASSES[tone]
  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/12">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${t.value}`}>
            {value}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500" title={detail ?? ""}>
            {detail ?? metricLabel}
          </p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
