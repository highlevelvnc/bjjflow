"use client"

import Link from "next/link"
import { AnalyticsNav } from "@/components/analytics/AnalyticsNav"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ClassHeatmapItem {
  classId: string
  className: string
  dayOfWeek: number
  avgAttendance: number
  maxAttendance: number
  totalSessions: number
  fillRate: number
}

interface HourlyItem {
  hour: number
  avgAttendance: number
  totalSessions: number
}

interface WeeklyHeatmapData {
  grid: { day: number; hour: number; value: number }[]
  maxValue: number
}

interface ChurnItem {
  memberId: string
  memberName: string
  beltRank: string
  churnScore: number
  currentFreq: number
  previousFreq: number
  trend: number
  daysSinceLastSession: number
  riskLevel: "critical" | "high" | "medium" | "low"
}

interface CohortItem {
  month: string
  totalJoined: number
  stillActive: number
  retentionRate: number
}

interface AnalyticsClientProps {
  classHeatmap: ClassHeatmapItem[]
  hourlyDistribution: HourlyItem[]
  weeklyHeatmap: WeeklyHeatmapData
  churnPrediction: ChurnItem[]
  retentionCohorts: CohortItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function formatHour(h: number): string {
  return `${h}h`
}

function getHeatColor(value: number, max: number): string {
  if (value === 0 || max === 0) return "bg-white/[0.03]"
  const ratio = value / max
  if (ratio < 0.25) return "bg-emerald-500/20"
  if (ratio < 0.5) return "bg-emerald-500/40"
  if (ratio < 0.75) return "bg-emerald-500/60"
  return "bg-emerald-500/80"
}

function getFillColor(rate: number): string {
  if (rate >= 75) return "bg-emerald-500"
  if (rate >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function getRiskBadge(level: "critical" | "high" | "medium" | "low") {
  const styles = {
    critical: "bg-red-500/15 text-red-400",
    high: "bg-orange-500/15 text-orange-400",
    medium: "bg-amber-500/15 text-amber-400",
    low: "bg-emerald-500/15 text-emerald-400",
  }
  return styles[level]
}

function getRetentionColor(rate: number): string {
  if (rate >= 80) return "text-emerald-400"
  if (rate >= 60) return "text-amber-400"
  return "text-red-400"
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AnalyticsClient({
  classHeatmap,
  hourlyDistribution,
  weeklyHeatmap,
  churnPrediction,
  retentionCohorts,
}: AnalyticsClientProps) {
  // Deduplicate class fill rates: take the best fill rate per class
  const classRatesMap = new Map<string, ClassHeatmapItem>()
  for (const item of classHeatmap) {
    const existing = classRatesMap.get(item.classId)
    if (!existing || item.fillRate > existing.fillRate) {
      classRatesMap.set(item.classId, item)
    }
  }
  const classFillRates = [...classRatesMap.values()].sort((a, b) => b.fillRate - a.fillRate)

  // Peak hour
  const peakHour = hourlyDistribution.reduce(
    (best, h) => (h.avgAttendance > best.avgAttendance ? h : best),
    { hour: 0, avgAttendance: 0, totalSessions: 0 },
  )
  const maxHourlyAttendance = Math.max(...hourlyDistribution.map((h) => h.avgAttendance), 1)

  // Heatmap hours range: 6AM to 22 (10PM)
  const heatmapHours = Array.from({ length: 17 }, (_, i) => i + 6)
  // Build lookup for heatmap grid
  const heatmapLookup = new Map<string, number>()
  for (const cell of weeklyHeatmap.grid) {
    heatmapLookup.set(`${cell.day}::${cell.hour}`, cell.value)
  }

  return (
    <div className="space-y-6">
      <AnalyticsNav />

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Análises</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Padrões de frequência, previsão de evasão e insights de retenção
        </p>
      </div>

      {/* ── Section 1: Weekly Heatmap ── */}
      <section className="rounded-xl border border-white/8 bg-gray-900">
        <div className="border-b border-white/8 px-5 py-3">
          <h2 className="text-sm font-medium text-gray-100">
            Mapa de Calor — Últimos 90 Dias
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Média de presença por dia da semana e horário
          </p>
        </div>
        <div className="overflow-x-auto p-5">
          {weeklyHeatmap.grid.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhuma aula concluída nos últimos 90 dias.
            </p>
          ) : (
            <div className="min-w-[640px]">
              {/* Header row - hours */}
              <div className="mb-1 flex">
                <div className="w-12 shrink-0" />
                {heatmapHours.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] font-medium text-gray-500"
                  >
                    {h % 2 === 0 ? formatHour(h) : ""}
                  </div>
                ))}
              </div>
              {/* Grid rows - days (Mon-Sun, reorder so Mon=1 first) */}
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <div key={day} className="mb-0.5 flex items-center">
                  <div className="w-12 shrink-0 text-right pr-2 text-[11px] font-medium text-gray-500">
                    {DAY_LABELS[day]}
                  </div>
                  {heatmapHours.map((hour) => {
                    const value = heatmapLookup.get(`${day}::${hour}`) ?? 0
                    return (
                      <div
                        key={hour}
                        className={`group relative mx-px flex-1 rounded-sm ${getHeatColor(value, weeklyHeatmap.maxValue)}`}
                        style={{ height: 28 }}
                      >
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[10px] text-gray-200 shadow-lg group-hover:block">
                          {DAY_LABELS[day]} {formatHour(hour)}
                          <br />
                          Média: {value} alunos
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                <span>Menos</span>
                <div className="h-3 w-5 rounded-sm bg-white/[0.03]" />
                <div className="h-3 w-5 rounded-sm bg-emerald-500/20" />
                <div className="h-3 w-5 rounded-sm bg-emerald-500/40" />
                <div className="h-3 w-5 rounded-sm bg-emerald-500/60" />
                <div className="h-3 w-5 rounded-sm bg-emerald-500/80" />
                <span>Mais</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Two-column layout for fill rates and peak hours */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Section 2: Class Fill Rates ── */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Taxa de Ocupação das Turmas</h2>
            <p className="mt-0.5 text-xs text-gray-500">Utilização média de capacidade por turma</p>
          </div>
          <div className="p-5">
            {classFillRates.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Sem dados disponíveis.</p>
            ) : (
              <div className="space-y-3">
                {classFillRates.map((cls) => (
                  <div key={cls.classId}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">{cls.className}</span>
                      <span className="text-xs text-gray-400">
                        {cls.fillRate}%
                        <span className="ml-1.5 text-gray-600">
                          ({cls.avgAttendance} avg / {cls.totalSessions} aulas)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all ${getFillColor(cls.fillRate)}`}
                        style={{ width: `${Math.min(cls.fillRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Peak Hours ── */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Horários de Pico</h2>
            <p className="mt-0.5 text-xs text-gray-500">Média de presença por horário</p>
          </div>
          <div className="p-5">
            {hourlyDistribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Sem dados disponíveis.</p>
            ) : (
              <>
                {/* Peak indicator */}
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-white">
                    {formatHour(peakHour.hour)}
                  </span>
                  <span className="text-sm text-gray-500">
                    horário de pico ({peakHour.avgAttendance} média de presença)
                  </span>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-1.5" style={{ height: 160 }}>
                  {hourlyDistribution.map((h) => {
                    const heightPercent = (h.avgAttendance / maxHourlyAttendance) * 100
                    const barHeight = Math.max(heightPercent, 4)
                    const isPeak = h.hour === peakHour.hour

                    return (
                      <div
                        key={h.hour}
                        className="group relative flex flex-1 flex-col items-center"
                      >
                        {/* Bar container */}
                        <div className="relative flex w-full justify-center" style={{ height: 120 }}>
                          <div
                            className={`w-full max-w-[32px] rounded-t-md transition-all ${
                              isPeak
                                ? "bg-emerald-500/90 hover:bg-emerald-500"
                                : "bg-brand-500/50 hover:bg-brand-500/70"
                            }`}
                            style={{
                              height: `${barHeight}%`,
                              position: "absolute",
                              bottom: 0,
                            }}
                          />
                          {/* Tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[10px] text-gray-200 shadow-lg group-hover:block">
                            {formatHour(h.hour)}
                            <br />
                            Média: {h.avgAttendance}
                            <br />
                            {h.totalSessions} aulas
                          </div>
                        </div>
                        {/* Label */}
                        <span className="mt-1.5 text-[9px] font-medium text-gray-600">
                          {h.hour % 2 === 0 ? formatHour(h.hour) : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Section 4: Churn Risk Table ── */}
      <section className="rounded-xl border border-white/8 bg-gray-900">
        <div className="border-b border-white/8 px-5 py-3">
          <h2 className="text-sm font-medium text-gray-100">Risco de Evasão</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Alunos com maior probabilidade de abandonar, baseado em padrões de frequência
          </p>
        </div>
        <div className="overflow-x-auto">
          {churnPrediction.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              Nenhum aluno ativo para analisar.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/6 text-xs text-gray-500">
                  <th className="px-5 py-2.5 font-medium">Aluno</th>
                  <th className="px-3 py-2.5 font-medium">Faixa</th>
                  <th className="px-3 py-2.5 font-medium">Pontuação</th>
                  <th className="px-3 py-2.5 font-medium">Risco</th>
                  <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Tendência</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Última Aula</th>
                  <th className="px-3 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {churnPrediction.map((student) => (
                  <tr key={student.memberId} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-gray-200">{student.memberName}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded-md bg-white/8 px-2 py-0.5 text-xs font-medium capitalize text-gray-300">
                        {student.beltRank}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${student.churnScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{student.churnScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize ${getRiskBadge(student.riskLevel)}`}
                      >
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <span
                        className={`text-xs font-medium ${
                          student.trend >= 1
                            ? "text-emerald-400"
                            : student.trend >= 0.8
                              ? "text-gray-400"
                              : "text-red-400"
                        }`}
                      >
                        {student.currentFreq}/wk
                        <span className="ml-1 text-gray-600">
                          {student.trend > 1 ? "+" : ""}
                          {student.trend > 0 ? `${Math.round((student.trend - 1) * 100)}%` : "N/A"}
                        </span>
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-gray-400 md:table-cell">
                      {student.daysSinceLastSession === 0
                        ? "Hoje"
                        : student.daysSinceLastSession === 1
                          ? "Ontem"
                          : `há ${student.daysSinceLastSession}d`}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/app/members/${student.memberId}/edit`}
                        className="text-xs font-medium text-brand-400 hover:text-brand-300"
                      >
                        Contatar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Section 5: Retention Cohorts ── */}
      <section className="rounded-xl border border-white/8 bg-gray-900">
        <div className="border-b border-white/8 px-5 py-3">
          <h2 className="text-sm font-medium text-gray-100">Coortes de Retenção</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Retenção mensal — quantos alunos que entraram em cada mês ainda estão ativos
          </p>
        </div>
        <div className="overflow-x-auto">
          {retentionCohorts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              Nenhum dado de coorte disponível ainda.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/6 text-xs text-gray-500">
                  <th className="px-5 py-2.5 font-medium">Mês de Entrada</th>
                  <th className="px-3 py-2.5 font-medium">Entrou</th>
                  <th className="px-3 py-2.5 font-medium">Ainda Ativo</th>
                  <th className="px-3 py-2.5 font-medium">Retenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {retentionCohorts.map((cohort) => (
                  <tr key={cohort.month} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-gray-200">{cohort.month}</td>
                    <td className="px-3 py-3 text-gray-300">{cohort.totalJoined}</td>
                    <td className="px-3 py-3 text-gray-300">{cohort.stillActive}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full ${
                              cohort.retentionRate >= 80
                                ? "bg-emerald-500"
                                : cohort.retentionRate >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${cohort.retentionRate}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${getRetentionColor(cohort.retentionRate)}`}
                        >
                          {cohort.retentionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
