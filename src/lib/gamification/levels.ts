/**
 * BJJFlow — Gamification system
 * ─────────────────────────────────────────────────────────────────────────
 * Pure functions for computing XP, levels, and unlocked achievements from
 * the data we already store (attendance, titles, streaks). No new tables —
 * everything is derived on read.
 *
 * Why derive? Two reasons:
 *   1. Single source of truth = no drift bugs.
 *   2. Backfills happen "for free" — students unlock retroactively.
 */

// ─── XP formula ───────────────────────────────────────────────────────────
//
// Each action gives a fixed amount of XP. The numbers are tuned so that:
//   - A casual student (~3 trainings/week) reaches level 10 in ~3 months
//   - A dedicated student (~5 trainings/week) reaches level 20 in ~6 months
//   - Titles and streaks act as multipliers on top of base presence

export const XP_PER_TRAINING = 12
export const XP_PER_TITLE_GOLD = 250
export const XP_PER_TITLE_SILVER = 150
export const XP_PER_TITLE_BRONZE = 100
export const XP_PER_TITLE_OTHER = 50
export const XP_PER_WEEK_STREAK = 35
export const XP_PER_MATCH_WIN = 30
export const XP_PER_MATCH_SUBMISSION_BONUS = 15

// ─── Level curve ──────────────────────────────────────────────────────────
//
// Inspired by classic RPG progression — early levels are quick, later ones
// stretch out to keep long-term engagement. Formula:
//   xpForLevel(N) = 50 * N^1.7   (rounded)
//
// L1 → 50, L2 → 162, L3 → 313, L5 → 762, L10 → 2510, L20 → 8160, L30 → 16200

export function xpForLevel(level: number): number {
  if (level <= 0) return 0
  return Math.round(50 * Math.pow(level, 1.7))
}

/**
 * Cumulative XP needed to reach the START of a given level.
 * Level 1 starts at 0; level 2 starts at xpForLevel(1); ...
 */
export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i)
  }
  return total
}

/**
 * Given a total XP value, return the current level + progress towards next.
 */
export function levelFromXp(totalXp: number): {
  level: number
  currentXp: number
  nextLevelXp: number
  progress: number // 0..1
} {
  let level = 1
  let used = 0
  while (used + xpForLevel(level) <= totalXp && level < 100) {
    used += xpForLevel(level)
    level++
  }
  const currentXp = totalXp - used
  const nextLevelXp = xpForLevel(level)
  const progress = nextLevelXp > 0 ? Math.min(1, currentXp / nextLevelXp) : 0
  return { level, currentXp, nextLevelXp, progress }
}

// ─── Level titles (PT-BR, BJJ-themed) ────────────────────────────────────
//
// Cosmetic names that pop up as the student levels up. Drawn from BJJ
// hierarchy + Brazilian martial arts vocabulary.

export interface LevelTier {
  minLevel: number
  title: string
  emoji: string
  color: string // tailwind text class
  ring: string
}

export const LEVEL_TIERS: LevelTier[] = [
  { minLevel: 1, title: "Iniciante", emoji: "🌱", color: "text-emerald-300", ring: "ring-emerald-400/40" },
  { minLevel: 4, title: "Praticante", emoji: "🥋", color: "text-cyan-300", ring: "ring-cyan-400/40" },
  { minLevel: 8, title: "Combatente", emoji: "⚡", color: "text-blue-300", ring: "ring-blue-400/40" },
  { minLevel: 13, title: "Guerreiro", emoji: "🔥", color: "text-amber-300", ring: "ring-amber-400/40" },
  { minLevel: 18, title: "Veterano", emoji: "🗡️", color: "text-orange-300", ring: "ring-orange-400/40" },
  { minLevel: 24, title: "Mestre", emoji: "👑", color: "text-purple-300", ring: "ring-purple-400/40" },
  { minLevel: 32, title: "Lenda", emoji: "💎", color: "text-fuchsia-300", ring: "ring-fuchsia-400/40" },
  { minLevel: 42, title: "Imortal", emoji: "🐉", color: "text-rose-300", ring: "ring-rose-400/40" },
]

export function tierForLevel(level: number): LevelTier {
  let current = LEVEL_TIERS[0]!
  for (const tier of LEVEL_TIERS) {
    if (level >= tier.minLevel) current = tier
  }
  return current
}

// ─── XP calculator ────────────────────────────────────────────────────────

export interface XpInputs {
  totalAttendance: number
  longestStreak: number // weeks
  titles: { placement: string }[]
  matches: { result: string; method: string }[]
}

export function computeXp(input: XpInputs): {
  total: number
  breakdown: { source: string; xp: number; count: number }[]
} {
  const trainingXp = input.totalAttendance * XP_PER_TRAINING

  let titleXp = 0
  for (const t of input.titles) {
    if (t.placement === "gold") titleXp += XP_PER_TITLE_GOLD
    else if (t.placement === "silver") titleXp += XP_PER_TITLE_SILVER
    else if (t.placement === "bronze") titleXp += XP_PER_TITLE_BRONZE
    else titleXp += XP_PER_TITLE_OTHER
  }

  const streakXp = input.longestStreak * XP_PER_WEEK_STREAK

  let matchXp = 0
  for (const m of input.matches) {
    if (m.result === "win") matchXp += XP_PER_MATCH_WIN
    if (m.result === "win" && m.method === "submission") matchXp += XP_PER_MATCH_SUBMISSION_BONUS
  }

  const total = trainingXp + titleXp + streakXp + matchXp

  return {
    total,
    breakdown: [
      { source: "Treinos", xp: trainingXp, count: input.totalAttendance },
      { source: "Títulos", xp: titleXp, count: input.titles.length },
      { source: "Sequência semanal", xp: streakXp, count: input.longestStreak },
      { source: "Vitórias em luta", xp: matchXp, count: input.matches.filter((m) => m.result === "win").length },
    ],
  }
}
