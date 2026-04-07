"use client"

import Link from "next/link"
import { ChevronRight, Crown, Flame, Loader2, Medal, Trophy } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { BeltBadge } from "@/components/aluno/BeltBadge"

const PODIUM_META: Record<
  number,
  { ring: string; iconCls: string; bg: string; label: string }
> = {
  1: {
    ring: "ring-amber-400/50",
    iconCls: "text-amber-300 bg-amber-500/15",
    bg: "from-amber-500/15 via-amber-500/5 to-transparent",
    label: "1º",
  },
  2: {
    ring: "ring-zinc-300/40",
    iconCls: "text-zinc-200 bg-zinc-300/10",
    bg: "from-zinc-300/15 via-zinc-300/5 to-transparent",
    label: "2º",
  },
  3: {
    ring: "ring-orange-400/40",
    iconCls: "text-orange-300 bg-orange-500/15",
    bg: "from-orange-500/15 via-orange-500/5 to-transparent",
    label: "3º",
  },
}

interface LeaderboardCardProps {
  /** Quando true, mostra a lista completa (até 20). Caso contrário só top 5. */
  full?: boolean
  /** Quando true, esconde o link "Ver tudo" e o header (modo página dedicada). */
  embedded?: boolean
}

export function LeaderboardCard({
  full = false,
  embedded = false,
}: LeaderboardCardProps) {
  const leaderboard = trpc.gamification.leaderboard.useQuery()
  const myRank = trpc.gamification.myRank.useQuery()
  const profile = trpc.portal.myProfile.useQuery()

  const rows = (leaderboard.data ?? []).slice(0, full ? 20 : 5)
  const isLoading = leaderboard.isLoading || myRank.isLoading

  const myId = profile.data?.id

  return (
    <section
      className={
        embedded
          ? ""
          : "rounded-2xl border border-white/8 bg-gray-900/60 p-4 shadow-md shadow-black/20 backdrop-blur"
      }
    >
      {!embedded && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-100">
                Ranking da academia
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Últimos 30 dias · presença
              </p>
            </div>
          </div>
          {!full && (
            <Link
              href="/aluno/ranking"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 transition-colors hover:text-amber-200"
            >
              Ver tudo
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* ── Minha posição (sticky banner no topo) ─────────────────────── */}
      {myRank.data && myRank.data.rank != null && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-brand-500/25 bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">
              <span className="text-xs font-bold">#{myRank.data.rank}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-brand-300/90">
                Sua posição
              </p>
              <p className="text-sm font-bold text-gray-50">
                {ordinalPt(myRank.data.rank)} de {myRank.data.total}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-base font-bold text-amber-300">
              <Flame className="h-4 w-4" />
              {myRank.data.sessions}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">
              treinos
            </p>
          </div>
        </div>
      )}

      {/* ── Ranking list ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-6 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-gray-500">
          Ainda não há treinos suficientes para formar um ranking.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((m) => {
            const podium = PODIUM_META[m.rank]
            const isMe = m.id === myId
            return (
              <li
                key={m.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  isMe
                    ? "border-brand-500/40 bg-brand-500/10"
                    : podium
                      ? `border-white/8 bg-gradient-to-r ${podium.bg}`
                      : "border-white/6 bg-white/[0.02]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {/* Position chip */}
                  {podium ? (
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${podium.iconCls} ${podium.ring}`}
                    >
                      {m.rank === 1 ? (
                        <Trophy className="h-4 w-4" />
                      ) : (
                        <Medal className="h-4 w-4" />
                      )}
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-[11px] font-bold text-gray-400">
                      {m.rank}
                    </div>
                  )}

                  {/* Name + belt */}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-100">
                      {m.full_name}
                      {isMe && (
                        <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-200">
                          você
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5">
                      <BeltBadge
                        belt={m.belt_rank}
                        stripes={m.stripes}
                        compact
                      />
                    </div>
                  </div>
                </div>

                {/* Sessions count */}
                <div className="text-right">
                  <p className="text-base font-bold leading-none text-gray-50">
                    {m.sessions}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-gray-500">
                    treinos
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ordinalPt(n: number): string {
  return `${n}º lugar`
}
