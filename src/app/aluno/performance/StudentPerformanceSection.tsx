"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, Sparkles, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { PerformanceControls, type Period, type Metric } from "./PerformanceControls"
import { TechniqueRadarChart } from "./TechniqueRadarChart"
import { PerformanceSummaryCards } from "./PerformanceSummaryCards"
import { OverviewStats } from "./OverviewStats"
import { RecentActivity } from "./RecentActivity"
import { QuickLogModal } from "./QuickLogModal"

const METRIC_LABELS: Record<Metric, string> = {
  attempts: "Tentativas",
  successes: "Sucessos",
  submissions: "Finalizações",
}

export function StudentPerformanceSection() {
  const [period, setPeriod] = useState<Period>("month")
  const [metric, setMetric] = useState<Metric>("successes")
  const [logOpen, setLogOpen] = useState(false)

  const { data, isLoading, isError } = trpc.studentPerformance.byTechnique.useQuery(
    { period },
    { staleTime: 30_000 },
  )
  const { data: summary, isLoading: summaryLoading } =
    trpc.studentPerformance.summary.useQuery(undefined, { staleTime: 30_000 })

  const chartData = useMemo(() => {
    if (!data) return []
    return data.items.map((row) => ({
      technique: row.label,
      value: row[metric],
      attempts: row.attempts,
      successes: row.successes,
      submissions: row.submissions,
    }))
  }, [data, metric])

  // Delta vs período anterior (apenas quando period === "month")
  const delta = useMemo(() => {
    if (!data || period !== "month") return null
    const current = data.totals[metric]
    const prev = data.prevTotals[metric]
    if (prev === 0 && current === 0) return null
    if (prev === 0) return { current, prev, pct: 100, dir: "up" as const }
    const pct = Math.round(((current - prev) / prev) * 100)
    const dir: "up" | "down" | "flat" = pct > 0 ? "up" : pct < 0 ? "down" : "flat"
    return { current, prev, pct: Math.abs(pct), dir }
  }, [data, metric, period])

  const isEmptyOverall = !summaryLoading && summary && summary.totalEvents === 0

  return (
    <div className="space-y-5">
      {/* ── Action bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <PerformanceControls
          period={period}
          metric={metric}
          onPeriodChange={setPeriod}
          onMetricChange={setMetric}
        />
        <button
          onClick={() => setLogOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-400 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Registrar treino</span>
          <span className="sm:hidden">Registrar</span>
        </button>
      </div>

      {/* ── Overview cards ────────────────────────────────────────────── */}
      <OverviewStats
        totalEvents={summary?.totalEvents ?? 0}
        successRate={summary?.successRate ?? 0}
        streak={summary?.streak ?? 0}
        topTechnique={summary?.topTechnique ?? null}
        isLoading={summaryLoading}
      />

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {isEmptyOverall && (
        <EmptyHero onLog={() => setLogOpen(true)} />
      )}

      {/* ── Radar chart ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-gray-900/80 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 sm:text-base">
              Análise por técnica
            </h2>
            <p className="text-xs text-gray-500">
              Métrica: <span className="text-brand-400">{METRIC_LABELS[metric]}</span>
              {period === "month" && (
                <span className="text-gray-600"> · últimos 30 dias</span>
              )}
            </p>
          </div>
          {delta && <DeltaPill {...delta} />}
        </div>

        {isLoading ? (
          <div className="flex h-[320px] items-center justify-center text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-red-400">
            Falha ao carregar dados.
          </div>
        ) : (
          <TechniqueRadarChart data={chartData} metricLabel={METRIC_LABELS[metric]} />
        )}
      </section>

      {/* ── Min/máx/média ─────────────────────────────────────────────── */}
      <PerformanceSummaryCards data={chartData} metricLabel={METRIC_LABELS[metric]} />

      {/* ── Histórico recente ─────────────────────────────────────────── */}
      <RecentActivity />

      {/* ── Quick log modal ───────────────────────────────────────────── */}
      <QuickLogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={() => setLogOpen(false)}
      />
    </div>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function DeltaPill({
  current,
  prev,
  pct,
  dir,
}: {
  current: number
  prev: number
  pct: number
  dir: "up" | "down" | "flat"
}) {
  const tone =
    dir === "up"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : dir === "down"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
        : "border-white/10 bg-white/5 text-gray-300"
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      <span>
        {dir === "flat" ? "Estável" : `${pct}%`} vs anterior
      </span>
      <span className="text-[10px] text-gray-500">
        ({prev} → {current})
      </span>
    </div>
  )
}

function EmptyHero({ onLog }: { onLog: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-gray-900/80 to-gray-950 p-6 shadow-xl shadow-brand-500/5 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl"
      />
      <div className="relative">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-gray-100 sm:text-lg">
          Comece a montar seu radar
        </h3>
        <p className="mt-1 max-w-md text-sm text-gray-400">
          Cada vez que você tentar, acertar ou finalizar uma técnica no rolamento,
          registre aqui. Em poucos dias seu mapa de evolução estará vivo.
        </p>
        <button
          onClick={onLog}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          Registrar primeiro treino
        </button>
      </div>
    </div>
  )
}
