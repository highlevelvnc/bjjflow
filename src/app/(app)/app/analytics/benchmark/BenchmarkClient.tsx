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
    label: "Excelente",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
  },
  good: {
    label: "Bom",
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
  },
  average: {
    label: "Médio",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-400",
  },
  below_average: {
    label: "Abaixo da Média",
    color: "bg-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
  },
  needs_improvement: {
    label: "Precisa Melhorar",
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
  },
}

const ADVICE: Record<string, Record<Rating, string>> = {
  "Média de Presença / Aula": {
    excellent: "Presença excepcional! Suas aulas são bem frequentadas e engajantes.",
    good: "Bons números de presença. Considere adicionar mais horários populares.",
    average: "Presença média. Tente variar os horários das aulas ou adicionar aulas temáticas.",
    below_average: "Presença abaixo da média. Pesquise os alunos sobre horários e temas preferidos.",
    needs_improvement: "Presença baixa precisa de atenção. Revise sua grade horária e esforços de divulgação.",
  },
  "Taxa de Retenção": {
    excellent: "Retenção incrível! Sua comunidade é forte e engajada.",
    good: "Boa retenção. Continue focando na experiência do aluno e construção de comunidade.",
    average: "Retenção média. Considere implementar um programa de boas-vindas para novos alunos.",
    below_average: "Retenção precisa melhorar. Entre em contato com alunos inativos e peça feedback.",
    needs_improvement: "Crítico: Foque no onboarding do aluno e na experiência dos primeiros 90 dias.",
  },
  "Aulas / Semana": {
    excellent: "Ótima cobertura de grade! Você oferece muitas oportunidades de treino.",
    good: "Boa frequência de aulas. Considere adicionar open mat ou aulas especiais.",
    average: "Grade média. Adicionar 1-2 aulas semanais pode aumentar o engajamento.",
    below_average: "Considere oferecer mais aulas para atender a demanda dos alunos.",
    needs_improvement: "Poucas aulas oferecidas. Expandir sua grade deve ser prioridade máxima.",
  },
  "Taxa de Crescimento": {
    excellent: "Crescimento excepcional! Sua academia está atraindo novos alunos rapidamente.",
    good: "Taxa de crescimento saudável. Mantenha seus programas de marketing e indicação ativos.",
    average: "Crescimento médio. Tente incentivos de indicação ou eventos comunitários para atrair alunos.",
    below_average: "Crescimento lento. Revise sua estratégia de marketing e ofertas de aula experimental.",
    needs_improvement: "Crescimento precisa de atenção. Considere semanas de aula grátis ou parcerias com negócios locais.",
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
        <span className="text-xs text-gray-500">Seu percentil:</span>
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
      <p className="text-sm font-medium text-gray-400 mb-2">Pontuação Geral da Academia</p>
      <p
        className={`text-6xl font-bold ${
          isGood ? "text-emerald-400" : "text-orange-400"
        }`}
      >
        {avgPercentile}
      </p>
      <p className="mt-1 text-sm text-gray-500">de 100</p>
      <p
        className={`mt-4 text-lg font-semibold ${
          isGood ? "text-emerald-300" : "text-orange-300"
        }`}
      >
        {isGood
          ? `Sua academia está no top ${topPercent}% geral!`
          : `Sua academia está nos ${topPercent}%. Vamos melhorar!`}
      </p>
      <p className="mt-2 text-sm text-gray-400">
        {isGood
          ? "Ótimo trabalho! Continue mantendo esses padrões."
          : "Foque nas áreas marcadas para melhoria acima para elevar sua pontuação."}
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
          Benchmark da Academia &mdash; Como Você se Compara
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Veja como sua academia se compara com benchmarks do mercado para academias de BJJ.
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
