"use client"

import { Activity, Flame, Percent, Star } from "lucide-react"

interface Props {
  totalEvents: number
  successRate: number
  streak: number
  topTechnique: { label: string; count: number } | null
  isLoading?: boolean
}

export function OverviewStats({
  totalEvents,
  successRate,
  streak,
  topTechnique,
  isLoading,
}: Props) {
  const cards = [
    {
      label: "Registros totais",
      value: totalEvents.toString(),
      sub: totalEvents === 1 ? "evento registrado" : "eventos registrados",
      icon: Activity,
      tone: "brand" as const,
    },
    {
      label: "Taxa de sucesso",
      value: `${successRate}%`,
      sub: "sucessos + finalizações",
      icon: Percent,
      tone: "emerald" as const,
    },
    {
      label: "Sequência atual",
      value: streak.toString(),
      sub: streak === 1 ? "dia consecutivo" : "dias consecutivos",
      icon: Flame,
      tone: "amber" as const,
    },
    {
      label: "Sua técnica forte",
      value: topTechnique?.label ?? "—",
      sub: topTechnique ? `${topTechnique.count} registros` : "registre para descobrir",
      icon: Star,
      tone: "violet" as const,
      isText: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          label={c.label}
          value={c.value}
          sub={c.sub}
          icon={c.icon}
          tone={c.tone}
          isText={c.isText}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}

const TONE_CLASSES = {
  brand: { icon: "bg-brand-500/15 text-brand-400", value: "text-brand-200" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", value: "text-emerald-200" },
  amber: { icon: "bg-amber-500/15 text-amber-400", value: "text-amber-200" },
  violet: { icon: "bg-violet-500/15 text-violet-400", value: "text-violet-200" },
} as const

function Card({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  isText,
  isLoading,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  tone: keyof typeof TONE_CLASSES
  isText?: boolean
  isLoading?: boolean
}) {
  const t = TONE_CLASSES[tone]
  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-white/12">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-[11px]">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-1.5 h-7 w-16 animate-pulse rounded-md bg-white/5" />
          ) : (
            <p
              className={`mt-1 truncate font-bold tracking-tight ${t.value} ${
                isText ? "text-sm sm:text-base" : "text-xl sm:text-2xl"
              }`}
              title={value}
            >
              {value}
            </p>
          )}
          <p className="mt-0.5 truncate text-[10px] text-gray-500 sm:text-xs">{sub}</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
