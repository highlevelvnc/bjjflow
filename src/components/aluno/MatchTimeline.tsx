"use client"

import {
  Crosshair,
  Flag,
  Hand,
  Hourglass,
  Minus,
  Skull,
  Swords,
  Trophy,
} from "lucide-react"
import type { ComponentType, SVGProps } from "react"

// ─── Types ────────────────────────────────────────────────────────────────

export type MatchResult = "win" | "loss" | "draw"
export type MatchMethod =
  | "submission"
  | "points"
  | "advantage"
  | "penalty"
  | "decision"
  | "dq"
  | "wo"

export interface CompetitionMatch {
  id: string
  match_order: number
  result: MatchResult
  method: MatchMethod
  submission_type?: string | null
  points_for?: number | null
  points_against?: number | null
  advantages_for?: number | null
  advantages_against?: number | null
  finish_time?: string | null
  opponent_name?: string | null
  opponent_team?: string | null
  notes?: string | null
}

// ─── Display metadata ─────────────────────────────────────────────────────

const RESULT_META: Record<
  MatchResult,
  { label: string; cls: string; ring: string; dot: string }
> = {
  win: {
    label: "VITÓRIA",
    cls: "from-emerald-500/25 via-emerald-500/10 to-transparent text-emerald-200",
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-400 shadow-emerald-400/50",
  },
  loss: {
    label: "DERROTA",
    cls: "from-red-500/25 via-red-500/10 to-transparent text-red-200",
    ring: "ring-red-400/40",
    dot: "bg-red-400 shadow-red-400/50",
  },
  draw: {
    label: "EMPATE",
    cls: "from-zinc-400/20 via-zinc-400/5 to-transparent text-zinc-200",
    ring: "ring-zinc-300/30",
    dot: "bg-zinc-300 shadow-zinc-300/50",
  },
}

const METHOD_META: Record<
  MatchMethod,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  submission: { label: "Finalização", icon: Skull },
  points: { label: "Pontos", icon: Crosshair },
  advantage: { label: "Vantagem", icon: Flag },
  penalty: { label: "Punição", icon: Minus },
  decision: { label: "Decisão", icon: Hand },
  dq: { label: "Desclassificação", icon: Flag },
  wo: { label: "W.O.", icon: Flag },
}

// ─── Public component ─────────────────────────────────────────────────────

interface MatchTimelineProps {
  matches: CompetitionMatch[]
  /** Quando true, esconde o badge "Luta N" do header (modo compacto). */
  compact?: boolean
}

export function MatchTimeline({ matches, compact = false }: MatchTimelineProps) {
  if (!matches || matches.length === 0) return null

  // Garantia de ordem
  const ordered = [...matches].sort((a, b) => a.match_order - b.match_order)

  // Resumo rápido
  const wins = ordered.filter((m) => m.result === "win").length
  const losses = ordered.filter((m) => m.result === "loss").length

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-cyan-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Súmula da campanha
          </span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-semibold text-gray-300">
          {wins}V · {losses}D
        </span>
      </div>

      <ol className="relative space-y-2 pl-4">
        {/* Vertical timeline rail */}
        <span
          aria-hidden
          className="absolute left-[5px] top-1 bottom-1 w-px bg-gradient-to-b from-cyan-500/40 via-white/10 to-transparent"
        />
        {ordered.map((m) => (
          <MatchCard key={m.id} match={m} compact={compact} />
        ))}
      </ol>
    </div>
  )
}

// ─── Internal: single fight card ──────────────────────────────────────────

function MatchCard({
  match,
  compact,
}: {
  match: CompetitionMatch
  compact: boolean
}) {
  const result = RESULT_META[match.result]
  const method = METHOD_META[match.method]
  const Icon = method.icon

  const scoreLine = formatScoreLine(match)
  const summary = formatHowItHappened(match)

  return (
    <li className="relative">
      {/* Timeline dot */}
      <span
        aria-hidden
        className={`absolute -left-[14px] top-3 h-2.5 w-2.5 rounded-full shadow-[0_0_8px] ${result.dot}`}
      />

      <div
        className={`overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br p-3 shadow-md shadow-black/30 ring-1 ${result.cls} ${result.ring}`}
      >
        {/* Header row: round + result */}
        <div className="flex items-center justify-between gap-2">
          {!compact && (
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-200">
              Luta {match.match_order}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
            {match.result === "win" ? (
              <Trophy className="h-3 w-3" />
            ) : match.result === "loss" ? (
              <Hand className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {result.label}
          </span>
        </div>

        {/* How it happened — the headline */}
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-gray-50">
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="truncate">{summary}</span>
        </p>

        {/* Score / time */}
        {(scoreLine || match.finish_time) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-300">
            {scoreLine && <span className="font-mono">{scoreLine}</span>}
            {match.finish_time && (
              <span className="flex items-center gap-1">
                <Hourglass className="h-3 w-3" />
                {match.finish_time}
              </span>
            )}
          </div>
        )}

        {/* Opponent */}
        {(match.opponent_name || match.opponent_team) && (
          <p className="mt-1.5 text-[11px] text-gray-300/90">
            <span className="text-gray-500">vs </span>
            <span className="font-semibold text-gray-100">
              {match.opponent_name ?? "Adversário"}
            </span>
            {match.opponent_team && (
              <span className="text-gray-500"> · {match.opponent_team}</span>
            )}
          </p>
        )}

        {/* Coach notes */}
        {match.notes && (
          <p className="mt-1.5 text-[11px] italic text-gray-300/70">
            &ldquo;{match.notes}&rdquo;
          </p>
        )}
      </div>
    </li>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatScoreLine(m: CompetitionMatch): string | null {
  const hasPoints = m.points_for != null || m.points_against != null
  const hasAdv = m.advantages_for != null || m.advantages_against != null
  if (!hasPoints && !hasAdv) return null

  const p = `${m.points_for ?? 0} × ${m.points_against ?? 0}`
  if (!hasAdv) return `Pontos ${p}`
  const a = `${m.advantages_for ?? 0} × ${m.advantages_against ?? 0}`
  return `Pontos ${p}  ·  Vant. ${a}`
}

/**
 * Constrói a linha "headline" no estilo Abu Dhabi:
 *   - "Vitória por finalização — Mata-leão"
 *   - "Vitória por pontos 6 × 2"
 *   - "Derrota por vantagem"
 */
function formatHowItHappened(m: CompetitionMatch): string {
  const verb =
    m.result === "win" ? "Venceu" : m.result === "loss" ? "Perdeu" : "Empatou"

  switch (m.method) {
    case "submission": {
      const sub = m.submission_type?.trim()
      return sub ? `${verb} por finalização — ${sub}` : `${verb} por finalização`
    }
    case "points": {
      const pf = m.points_for ?? 0
      const pa = m.points_against ?? 0
      return `${verb} por pontos ${pf} × ${pa}`
    }
    case "advantage": {
      const af = m.advantages_for ?? 0
      const aa = m.advantages_against ?? 0
      return `${verb} por vantagem ${af} × ${aa}`
    }
    case "penalty":
      return `${verb} por punição`
    case "decision":
      return `${verb} por decisão dos árbitros`
    case "dq":
      return `${verb} por desclassificação`
    case "wo":
      return `${verb} por W.O.`
    default:
      return verb
  }
}
