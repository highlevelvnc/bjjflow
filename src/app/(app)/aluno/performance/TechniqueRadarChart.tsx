"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

export interface TechniqueDatum {
  technique: string
  value: number
  attempts: number
  successes: number
  submissions: number
}

interface Props {
  data: TechniqueDatum[]
  metricLabel: string
}

export function TechniqueRadarChart({ data, metricLabel }: Props) {
  // Ensures the radial scale never collapses to 0 (otherwise the polygon
  // disappears for new students). Min domain of 4 keeps the grid visible.
  const maxValue = Math.max(4, ...data.map((d) => d.value))

  return (
    <div className="-mx-1 h-[320px] w-full sm:mx-0 sm:h-[400px] md:h-[460px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="technique"
            tick={<AngleTick />}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: "#4b5563", fontSize: 10 }}
            tickCount={5}
            stroke="rgba(255,255,255,0.06)"
            axisLine={false}
          />
          <Radar
            name={metricLabel}
            dataKey="value"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#radarFill)"
            isAnimationActive
            animationDuration={500}
            dot={{ r: 3, fill: "#a78bfa", stroke: "#0a0a0a", strokeWidth: 2 }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
            content={<ChartTooltip metricLabel={metricLabel} />}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Custom angle tick — wraps long PT-BR labels into 2 lines on mobile ────

function AngleTick(props: {
  x?: number
  y?: number
  textAnchor?: "start" | "end" | "middle" | "inherit"
  payload?: { value: string }
}) {
  const { x = 0, y = 0, textAnchor = "middle", payload } = props
  if (!payload) return null
  const words = payload.value.split(" ")

  // Wrap into max 2 lines (>= 2 words) for readability on small screens
  const lines: string[] =
    words.length <= 1 ? [payload.value] : [words[0]!, words.slice(1).join(" ")]

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="#cbd5e1"
      className="text-[10px] sm:text-xs"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

// ─── Custom tooltip ─────────────────────────────────────────────────────────

interface TooltipPayload {
  payload?: TechniqueDatum
}
function ChartTooltip({
  active,
  payload,
  metricLabel,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  metricLabel?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload
  if (!datum) return null

  return (
    <div className="rounded-lg border border-white/12 bg-gray-950/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="mb-1 text-xs font-semibold text-gray-100">{datum.technique}</p>
      <Line label={metricLabel ?? "Valor"} value={datum.value} highlight />
      <Line label="Tentativas" value={datum.attempts} />
      <Line label="Sucessos" value={datum.successes} />
      <Line label="Finalizações" value={datum.submissions} />
    </div>
  )
}

function Line({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? "font-semibold text-brand-300" : "text-gray-300"}>
        {value}
      </span>
    </div>
  )
}
