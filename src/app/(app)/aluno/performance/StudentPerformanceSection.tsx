"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { PerformanceControls, type Period, type Metric } from "./PerformanceControls"
import { TechniqueRadarChart } from "./TechniqueRadarChart"
import { PerformanceSummaryCards } from "./PerformanceSummaryCards"

const METRIC_LABELS: Record<Metric, string> = {
  attempts: "Tentativas",
  successes: "Sucesso",
  submissions: "Finalizações",
}

export function StudentPerformanceSection() {
  const [period, setPeriod] = useState<Period>("month")
  const [metric, setMetric] = useState<Metric>("successes")

  const { data, isLoading, isError } = trpc.studentPerformance.byTechnique.useQuery(
    { period },
    { staleTime: 30_000 },
  )

  const chartData = useMemo(() => {
    if (!data) return []
    return data.map((row) => ({
      technique: row.label,
      value: row[metric],
      attempts: row.attempts,
      successes: row.successes,
      submissions: row.submissions,
    }))
  }, [data, metric])

  return (
    <div className="space-y-5">
      <PerformanceControls
        period={period}
        metric={metric}
        onPeriodChange={setPeriod}
        onMetricChange={setMetric}
      />

      <section className="rounded-2xl border border-white/8 bg-gray-900/80 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 sm:text-base">
              Análise por técnica
            </h2>
            <p className="text-xs text-gray-500">
              Métrica: <span className="text-brand-400">{METRIC_LABELS[metric]}</span>
            </p>
          </div>
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

      <PerformanceSummaryCards data={chartData} metricLabel={METRIC_LABELS[metric]} />
    </div>
  )
}
