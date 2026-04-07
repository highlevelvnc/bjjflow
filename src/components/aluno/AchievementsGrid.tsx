"use client"

/**
 * AchievementsGrid
 * ──────────────────────────────────────────────────────────────────────────
 * Renders the full 24-badge achievement collection for the current student.
 * Locked badges are dimmed + show progress; unlocked ones get a tier glow
 * and a date stamp.
 *
 * Filtered by category tabs. Tap a badge to see its full details.
 */

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Sparkles, X } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import type { AchievementCategory } from "@/lib/gamification/achievements"

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  presence: "Presença",
  competition: "Campeonato",
  milestones: "Marcos",
  skill: "Técnica",
}

const CATEGORY_ORDER: AchievementCategory[] = [
  "presence",
  "competition",
  "milestones",
  "skill",
]

const TIER_RING: Record<string, string> = {
  bronze: "ring-orange-400/40 from-orange-500/20 to-amber-600/10",
  silver: "ring-zinc-300/40 from-zinc-300/20 to-gray-500/10",
  gold: "ring-amber-400/50 from-amber-400/25 to-yellow-600/10",
  platinum: "ring-cyan-300/50 from-cyan-300/25 to-blue-500/10",
  diamond: "ring-fuchsia-300/50 from-fuchsia-400/25 to-purple-600/10",
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
  diamond: "Diamante",
}

export function AchievementsGrid() {
  const achievements = trpc.portal.myAchievements.useQuery()
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | "all"
  >("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!achievements.data) return []
    if (activeCategory === "all") return achievements.data
    return achievements.data.filter((a) => a.category === activeCategory)
  }, [achievements.data, activeCategory])

  const counts = useMemo(() => {
    const out: Record<string, { unlocked: number; total: number }> = {
      all: { unlocked: 0, total: 0 },
    }
    for (const cat of CATEGORY_ORDER) out[cat] = { unlocked: 0, total: 0 }
    for (const a of achievements.data ?? []) {
      out.all!.total++
      out[a.category]!.total++
      if (a.unlocked) {
        out.all!.unlocked++
        out[a.category]!.unlocked++
      }
    }
    return out
  }, [achievements.data])

  const openAchievement =
    openId && achievements.data
      ? achievements.data.find((a) => a.id === openId) ?? null
      : null

  if (achievements.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryTab
          active={activeCategory === "all"}
          label="Tudo"
          unlocked={counts.all?.unlocked ?? 0}
          total={counts.all?.total ?? 0}
          onClick={() => setActiveCategory("all")}
        />
        {CATEGORY_ORDER.map((cat) => (
          <CategoryTab
            key={cat}
            active={activeCategory === cat}
            label={CATEGORY_LABEL[cat]}
            unlocked={counts[cat]?.unlocked ?? 0}
            total={counts[cat]?.total ?? 0}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((a) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.22 }}
            >
              <button
                type="button"
                onClick={() => setOpenId(a.id)}
                className={`group relative h-full w-full overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br p-3 text-left shadow-md shadow-black/20 ring-1 transition-all hover:-translate-y-0.5 ${
                  a.unlocked
                    ? TIER_RING[a.tier]
                    : "ring-white/5 from-white/[0.02] to-white/[0.01] grayscale"
                }`}
              >
                {a.unlocked && (
                  <Sparkles
                    aria-hidden
                    className="absolute right-1.5 top-1.5 h-3 w-3 text-white/60"
                  />
                )}
                {!a.unlocked && (
                  <Lock
                    aria-hidden
                    className="absolute right-1.5 top-1.5 h-3 w-3 text-gray-600"
                  />
                )}
                <div
                  className={`text-3xl ${a.unlocked ? "" : "opacity-50"}`}
                  aria-hidden
                >
                  {a.emoji}
                </div>
                <p className="mt-2 truncate text-xs font-bold text-gray-100">
                  {a.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-gray-500">
                  {a.description}
                </p>
                <div className="mt-2">
                  <ProgressBar
                    current={a.progress.current}
                    target={a.progress.target}
                    unlocked={a.unlocked}
                  />
                </div>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* ── Detail drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {openAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
            onClick={() => setOpenId(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className="relative w-full max-w-sm rounded-t-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl ring-2 ${
                    openAchievement.unlocked
                      ? TIER_RING[openAchievement.tier]
                      : "from-white/[0.02] to-white/[0.01] ring-white/5 grayscale"
                  }`}
                  aria-hidden
                >
                  {openAchievement.emoji}
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-50">
                  {openAchievement.title}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {openAchievement.description}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                    {TIER_LABEL[openAchievement.tier]}
                  </span>
                  <span className="rounded-full border border-brand-400/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                    +{openAchievement.xpReward} XP
                  </span>
                </div>

                <div className="mt-5">
                  <ProgressBar
                    current={openAchievement.progress.current}
                    target={openAchievement.progress.target}
                    unlocked={openAchievement.unlocked}
                    large
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {openAchievement.progress.current} /{" "}
                    {openAchievement.progress.target}
                  </p>
                </div>

                {openAchievement.unlocked && openAchievement.unlockedAt && (
                  <p className="mt-3 text-[11px] uppercase tracking-wider text-emerald-300/80">
                    Conquistado em {formatDate(openAchievement.unlockedAt)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function CategoryTab({
  active,
  label,
  unlocked,
  total,
  onClick,
}: {
  active: boolean
  label: string
  unlocked: number
  total: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-brand-400/40 bg-brand-500/15 text-brand-200 shadow-md shadow-brand-500/10"
          : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-gray-100"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-px text-[9px] font-bold ${
          active ? "bg-brand-500/30 text-brand-100" : "bg-white/5 text-gray-500"
        }`}
      >
        {unlocked}/{total}
      </span>
    </button>
  )
}

function ProgressBar({
  current,
  target,
  unlocked,
  large,
}: {
  current: number
  target: number
  unlocked: boolean
  large?: boolean
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full border border-white/8 bg-white/[0.03] ${
        large ? "h-2" : "h-1"
      }`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${
          unlocked
            ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-brand-400"
            : "bg-gradient-to-r from-gray-500 to-gray-400"
        }`}
      />
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}
