"use client"

/**
 * DailyMission
 * ──────────────────────────────────────────────────────────────────────────
 * Tiny daily quest card on the student home. Picks one mission per day per
 * student deterministically (so the student sees the same one all day) and
 * marks it as done in localStorage when they tap the CTA.
 *
 * Reward: a confetti burst + bonus XP message (cosmetic — actual XP is
 * derived elsewhere). The point is to nudge the student into the app daily.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, Sparkles } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  todaysMission,
  missionCompletionKey,
} from "@/lib/gamification/missions"
import { fireConfetti } from "@/lib/gamification/confetti"

export function DailyMission() {
  const profile = trpc.portal.myProfile.useQuery()
  const [completed, setCompleted] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const memberId = profile.data?.id ?? ""
  const mission = memberId ? todaysMission(memberId) : null

  useEffect(() => {
    if (!memberId) return
    const key = missionCompletionKey(memberId)
    setCompleted(window.localStorage.getItem(key) === "1")
    setHydrated(true)
  }, [memberId])

  function handleAccept(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!memberId) return
    const key = missionCompletionKey(memberId)
    window.localStorage.setItem(key, "1")
    setCompleted(true)
    fireConfetti({
      origin: e.currentTarget as unknown as HTMLElement,
      count: 22,
    })
  }

  if (!profile.data || !mission) {
    return (
      <div className="h-28 w-full animate-pulse rounded-2xl border border-white/8 bg-white/[0.02]" />
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-gray-900/80 to-gray-950 p-4 shadow-lg shadow-black/30"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"
      />

      <div className="relative flex items-start gap-3">
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 16 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-2xl ring-1 ring-amber-400/30"
        >
          {mission.emoji}
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
              Missão do dia
            </p>
          </div>
          <h3 className="mt-1 text-sm font-bold text-gray-50">
            {mission.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">{mission.description}</p>

          <div className="mt-3">
            <AnimatePresence mode="wait">
              {hydrated && completed ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                >
                  <Check className="h-3.5 w-3.5" />
                  Missão concluída · +25 XP
                </motion.div>
              ) : (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <Link
                    href={mission.href}
                    onClick={handleAccept}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-all hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-amber-500/25"
                  >
                    {mission.ctaLabel}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
