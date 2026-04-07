"use client"

import { Loader2, Medal, Trophy } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  MatchTimeline,
  type CompetitionMatch,
  type MatchMethod,
  type MatchResult,
} from "@/components/aluno/MatchTimeline"

const PLACEMENT_META: Record<
  string,
  { label: string; cls: string; ring: string }
> = {
  gold: {
    label: "Ouro",
    cls: "from-amber-400/30 via-amber-500/15 to-transparent text-amber-200",
    ring: "ring-amber-400/40",
  },
  silver: {
    label: "Prata",
    cls: "from-zinc-300/30 via-zinc-300/10 to-transparent text-zinc-100",
    ring: "ring-zinc-300/40",
  },
  bronze: {
    label: "Bronze",
    cls: "from-orange-500/30 via-orange-500/10 to-transparent text-orange-200",
    ring: "ring-orange-500/40",
  },
  other: {
    label: "Participação",
    cls: "from-white/10 via-white/5 to-transparent text-gray-200",
    ring: "ring-white/15",
  },
}

export function TitlesList() {
  const { data, isLoading, isError } = trpc.portal.myTitles.useQuery()
  const matchesByTitle = trpc.portal.myTitleMatches.useQuery()

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Falha ao carregar conquistas.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] px-4 py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
          <Trophy className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-gray-100">
          Sua estante está esperando
        </p>
        <p className="mt-1 max-w-xs text-xs text-gray-500">
          Quando você competir e seu instrutor registrar um título, ele aparece
          aqui — com medalha e tudo.
        </p>
      </div>
    )
  }

  // Group by year
  const byYear = new Map<string, typeof data>()
  for (const t of data) {
    const year = t.date ? t.date.slice(0, 4) : "—"
    const list = byYear.get(year) ?? []
    list.push(t)
    byYear.set(year, list)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a))

  // Stats by placement
  const podium = { gold: 0, silver: 0, bronze: 0 }
  for (const t of data) {
    if (t.placement === "gold") podium.gold++
    else if (t.placement === "silver") podium.silver++
    else if (t.placement === "bronze") podium.bronze++
  }

  return (
    <div className="space-y-5">
      {/* ── Hall stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <PodiumStat
          icon={Medal}
          tone="gold"
          value={podium.gold}
          label="Ouro"
        />
        <PodiumStat
          icon={Medal}
          tone="silver"
          value={podium.silver}
          label="Prata"
        />
        <PodiumStat
          icon={Medal}
          tone="bronze"
          value={podium.bronze}
          label="Bronze"
        />
      </div>

      {/* ── Timeline by year ────────────────────────────────────────────── */}
      {years.map((year) => {
        const items = byYear.get(year)!
        return (
          <section key={year}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Temporada {year}
            </p>
            <ul className="space-y-2">
              {items.map((t) => {
                const meta =
                  PLACEMENT_META[t.placement ?? "other"] ??
                  PLACEMENT_META.other!
                return (
                  <li
                    key={t.id}
                    className={`relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br p-4 shadow-md shadow-black/20 backdrop-blur ${meta.cls}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/20 ring-1 ${meta.ring}`}
                      >
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-gray-50">
                          {t.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-gray-300">
                          {t.competition ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="rounded-full bg-black/30 px-2 py-0.5 font-semibold uppercase tracking-wider">
                            {meta.label}
                          </span>
                          {t.category && (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
                              {t.category}
                            </span>
                          )}
                          {t.weight_class && (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-gray-200">
                              {t.weight_class}
                            </span>
                          )}
                          {t.date && (
                            <span className="text-gray-400">
                              {formatDate(t.date)}
                            </span>
                          )}
                        </div>
                        {t.notes && (
                          <p className="mt-2 text-xs italic text-gray-300/80">
                            “{t.notes}”
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Súmula de lutas (estilo Abu Dhabi/IBJJF) ── */}
                    <MatchTimeline
                      matches={normalizeMatches(
                        matchesByTitle.data?.[t.id] ?? [],
                      )}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function PodiumStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType
  value: number
  label: string
  tone: "gold" | "silver" | "bronze"
}) {
  const toneCls = {
    gold: "text-amber-300 bg-amber-500/15 ring-amber-400/30",
    silver: "text-zinc-200 bg-zinc-300/10 ring-zinc-300/30",
    bronze: "text-orange-300 bg-orange-500/15 ring-orange-400/30",
  }[tone]

  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-3 text-center backdrop-blur">
      <div
        className={`mx-auto inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${toneCls}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

/**
 * Adapta as linhas cruas do supabase para o tipo `CompetitionMatch`
 * consumido pelo `<MatchTimeline />`. Necessário porque o tRPC retorna
 * `result` e `method` como `string`, e precisamos estreitar para o union.
 */
type RawMatch = {
  id: string
  match_order: number
  result: string
  method: string
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

function normalizeMatches(rows: RawMatch[]): CompetitionMatch[] {
  return rows.map((r) => ({
    id: r.id,
    match_order: r.match_order,
    result: r.result as MatchResult,
    method: r.method as MatchMethod,
    submission_type: r.submission_type,
    points_for: r.points_for,
    points_against: r.points_against,
    advantages_for: r.advantages_for,
    advantages_against: r.advantages_against,
    finish_time: r.finish_time,
    opponent_name: r.opponent_name,
    opponent_team: r.opponent_team,
    notes: r.notes,
  }))
}
