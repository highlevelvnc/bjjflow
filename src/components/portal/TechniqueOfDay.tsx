"use client"

import { trpc } from "@/lib/trpc/client"
import { BookOpen, Sparkles } from "lucide-react"

const BELT_COLORS: Record<string, string> = {
  white: "bg-white/20 text-white",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-purple-500/15 text-purple-400",
  brown: "bg-amber-700/20 text-amber-500",
  black: "bg-gray-700/30 text-gray-200",
}

export function TechniqueOfDay() {
  const { data, isLoading } = trpc.technique.getToday.useQuery()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-500/20 bg-gray-900 p-5">
        <div className="h-24 animate-pulse rounded-lg bg-white/5" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-500">Técnica do Dia</h3>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Nenhuma técnica do dia. Peça ao seu instrutor para adicionar técnicas!
        </p>
      </div>
    )
  }

  const beltClass = BELT_COLORS[data.belt_level] ?? BELT_COLORS.white

  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-500/20 bg-gray-900 p-5">
      {/* Subtle gradient border effect */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5" />

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
            Técnica do Dia
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-lg font-semibold text-gray-100">{data.name}</h3>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {data.position && (
            <span className="inline-flex items-center rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-gray-300">
              {data.position}
            </span>
          )}
          {data.category && (
            <span className="inline-flex items-center rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-gray-300">
              {data.category}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${beltClass}`}
          >
            {data.belt_level}
          </span>
        </div>

        {/* Description */}
        {data.description && (
          <p className="mb-3 text-sm leading-relaxed text-gray-400">
            {data.description}
          </p>
        )}

        {/* Instructions */}
        {data.instructions && (
          <div className="mb-3">
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Instruções
            </h4>
            <p className="text-sm leading-relaxed text-gray-400">
              {data.instructions}
            </p>
          </div>
        )}

        {/* Key points */}
        {data.key_points && data.key_points.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              Pontos-Chave
            </h4>
            <ul className="space-y-1">
              {data.key_points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-400"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
