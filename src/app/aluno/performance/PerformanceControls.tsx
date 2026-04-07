"use client"

export type Period = "month" | "all"
export type Metric = "attempts" | "successes" | "submissions"

interface Props {
  period: Period
  metric: Metric
  onPeriodChange: (p: Period) => void
  onMetricChange: (m: Metric) => void
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Mês" },
  { value: "all", label: "Geral" },
]

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "successes", label: "Sucesso" },
  { value: "attempts", label: "Tentativas" },
  { value: "submissions", label: "Finalizações" },
]

export function PerformanceControls({
  period,
  metric,
  onPeriodChange,
  onMetricChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SegmentedControl
        label="Período"
        value={period}
        options={PERIOD_OPTIONS}
        onChange={onPeriodChange}
      />
      <SegmentedControl
        label="Métrica"
        value={metric}
        options={METRIC_OPTIONS}
        onChange={onMetricChange}
      />
    </div>
  )
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex w-full rounded-xl border border-white/8 bg-gray-900/80 p-1 shadow-inner shadow-black/30 backdrop-blur sm:w-auto"
      >
        {options.map((opt) => {
          const isActive = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:flex-none sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
