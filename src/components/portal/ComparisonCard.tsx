"use client"

import { trpc } from "@/lib/trpc/client"
import { BarChart3 } from "lucide-react"

function getPercentileMessage(percentile: number): { emoji: string; text: string } {
  if (percentile >= 90) return { emoji: "🏆", text: "Você está arrasando! Top 10% da academia." }
  if (percentile >= 70) return { emoji: "💪", text: "Acima da média! Continue firme." }
  if (percentile >= 50) return { emoji: "👊", text: "Bom esforço! Você está na metade superior." }
  return { emoji: "📈", text: "Você está ganhando ritmo. Mais um treino esta semana?" }
}

function getPercentileBadge(percentile: number): { label: string; className: string } {
  if (percentile >= 90) return { label: "Top 10%", className: "bg-yellow-500/15 text-yellow-400" }
  if (percentile >= 70) return { label: `Top ${100 - percentile}%`, className: "bg-brand-500/15 text-brand-400" }
  if (percentile >= 50) return { label: "Acima da Média", className: "bg-emerald-500/15 text-emerald-400" }
  return { label: "Abaixo da Média", className: "bg-white/8 text-gray-400" }
}

export function ComparisonCard() {
  const { data, isLoading } = trpc.portal.myComparison.useQuery()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="h-28 animate-pulse rounded-lg bg-white/5" />
      </div>
    )
  }

  if (!data) return null

  const { myCount, avgCount, percentile, totalStudents } = data
  const maxBar = Math.max(myCount, avgCount, 1)
  const myWidth = (myCount / maxBar) * 100
  const avgWidth = (avgCount / maxBar) * 100
  const message = getPercentileMessage(percentile)
  const badge = getPercentileBadge(percentile)

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-300">Comparação com a Academia</h3>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* My sessions */}
      <div className="mb-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-gray-400">Você</span>
          <span className="text-lg font-bold text-brand-400">{myCount}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${myWidth}%` }}
          />
        </div>
      </div>

      {/* Average */}
      <div className="mb-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-gray-400">Média da Academia</span>
          <span className="text-sm font-semibold text-gray-400">{avgCount}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gray-600 transition-all duration-500"
            style={{ width: `${avgWidth}%` }}
          />
        </div>
      </div>

      {/* Motivational message */}
      <p className="text-sm text-gray-500">
        <span className="mr-1">{message.emoji}</span>
        {message.text}
      </p>

      {/* Context */}
      <p className="mt-2 text-xs text-gray-600">
        Últimos 30 dias · {totalStudents} alunos ativos
      </p>
    </div>
  )
}
