"use client"

/**
 * XpHero
 * ──────────────────────────────────────────────────────────────────────────
 * The crown jewel of the student home: an animated level + XP bar that
 * shows the student where they are on their journey. The whole thing is
 * derived from existing data via `trpc.portal.myProgress`, so it works for
 * every student retroactively the moment we ship it.
 *
 * Visual cues:
 *   - Animated XP bar that fills on mount
 *   - Tier-based color glow + emoji
 *   - "Conquistas" counter linking to /aluno/badges
 *   - Level-up confetti when the local cached level changes
 */

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { ChevronRight, Sparkles, Trophy } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { fireConfetti } from "@/lib/gamification/confetti"

const STORAGE_KEY_LEVEL = "bjj_last_level"

export function XpHero() {
  const progress = trpc.portal.myProgress.useQuery(undefined, {
    staleTime: 30_000,
  })

  const [animatedXp, setAnimatedXp] = useState(0)
  const xpMv = useMotionValue(0)
  const xpRounded = useTransform(xpMv, (v) => Math.round(v))
  const containerRef = useRef<HTMLDivElement>(null)

  // Animate the XP counter on mount / when totalXp changes
  useEffect(() => {
    if (!progress.data) return
    const target = progress.data.totalXp
    const controls = animate(xpMv, target, {
      duration: 1.4,
      ease: "easeOut",
    })
    return () => controls.stop()
  }, [progress.data, xpMv])

  // Mirror the motion value to React state for the visible counter
  useEffect(() => {
    return xpRounded.on("change", (v) => setAnimatedXp(v))
  }, [xpRounded])

  // Detect level-up: compare against last seen level in localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !progress.data) return
    const last = window.localStorage.getItem(STORAGE_KEY_LEVEL)
    const lastLevel = last ? parseInt(last, 10) : null
    const currentLevel = progress.data.level

    if (lastLevel !== null && currentLevel > lastLevel) {
      // Level up! Fire celebration
      fireConfetti({ origin: containerRef.current })
    }
    window.localStorage.setItem(STORAGE_KEY_LEVEL, String(currentLevel))
  }, [progress.data])

  if (progress.isLoading || !progress.data) {
    return (
      <div className="h-44 w-full animate-pulse rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-white/[0.04]" />
    )
  }

  const {
    level,
    currentXp,
    nextLevelXp,
    progress: pct,
    tier,
    achievementsUnlocked,
    achievementsTotal,
  } = progress.data

  const xpToNext = Math.max(0, nextLevelXp - currentXp)
  const fillPct = Math.round(pct * 100)

  return (
    <motion.section
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-gray-900 via-gray-950 to-black p-5 shadow-2xl shadow-black/40 ring-1 ${tier.ring}`}
    >
      {/* Ambient glow ring matching the tier */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${tierGlow(
          tier.color,
        )}`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-cyan-brand/15 blur-3xl"
      />

      <div className="relative">
        {/* ── Top row: tier + level ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Sua jornada
            </p>
            <div className="mt-1 flex items-center gap-2">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  delay: 0.1,
                }}
                className="text-2xl"
                aria-hidden
              >
                {tier.emoji}
              </motion.span>
              <h2 className={`text-2xl font-bold tracking-tight ${tier.color}`}>
                {tier.title}
              </h2>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] ring-1 ${tier.ring}`}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
              Nível
            </span>
            <span className={`-mt-0.5 text-xl font-extrabold ${tier.color}`}>
              {level}
            </span>
          </motion.div>
        </div>

        {/* ── XP counter ─────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tabular-nums text-gray-50">
            {animatedXp.toLocaleString("pt-BR")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            XP total
          </span>
        </div>

        {/* ── XP bar ─────────────────────────────────────────────────────── */}
        <div className="mt-3">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-white/8 bg-white/[0.03]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
              className={`h-full rounded-full ${tierBarGradient(tier.color)} shadow-[0_0_18px_rgba(34,211,238,0.35)]`}
            />
            {/* Shimmer */}
            <motion.div
              aria-hidden
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
            <span className="text-gray-500">
              {currentXp.toLocaleString("pt-BR")} /{" "}
              {nextLevelXp.toLocaleString("pt-BR")} XP
            </span>
            <span className={`${tier.color}`}>
              Nível {level + 1} em {xpToNext.toLocaleString("pt-BR")} XP
            </span>
          </div>
        </div>

        {/* ── Footer: badges count CTA ──────────────────────────────────── */}
        <Link
          href="/aluno/badges"
          className="group mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-amber-500/[0.06]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-100">
                {achievementsUnlocked} / {achievementsTotal} conquistas
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Ver toda a coleção
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
        </Link>

        {/* Sparkle accent (desktop only) */}
        <Sparkles
          aria-hidden
          className={`pointer-events-none absolute right-3 top-3 hidden h-3.5 w-3.5 sm:block ${tier.color}`}
        />
      </div>
    </motion.section>
  )
}

// ─── Tier color helpers ──────────────────────────────────────────────────

function tierGlow(textColor: string): string {
  if (textColor.includes("emerald")) return "bg-emerald-400/20"
  if (textColor.includes("cyan")) return "bg-cyan-400/20"
  if (textColor.includes("blue")) return "bg-blue-400/20"
  if (textColor.includes("amber")) return "bg-amber-400/20"
  if (textColor.includes("orange")) return "bg-orange-400/20"
  if (textColor.includes("purple")) return "bg-purple-400/25"
  if (textColor.includes("fuchsia")) return "bg-fuchsia-400/25"
  if (textColor.includes("rose")) return "bg-rose-400/25"
  return "bg-brand-500/20"
}

function tierBarGradient(textColor: string): string {
  if (textColor.includes("emerald"))
    return "bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400"
  if (textColor.includes("cyan"))
    return "bg-gradient-to-r from-cyan-500 via-cyan-400 to-sky-300"
  if (textColor.includes("blue"))
    return "bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300"
  if (textColor.includes("amber"))
    return "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300"
  if (textColor.includes("orange"))
    return "bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300"
  if (textColor.includes("purple"))
    return "bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-300"
  if (textColor.includes("fuchsia"))
    return "bg-gradient-to-r from-fuchsia-500 via-fuchsia-400 to-pink-300"
  if (textColor.includes("rose"))
    return "bg-gradient-to-r from-rose-500 via-rose-400 to-orange-300"
  return "bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400"
}
