/**
 * Daily missions
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight "missão do dia" — a small, fun objective that resets every
 * day. Computed locally on the client so we don't need a new table:
 *
 *   1. Pick a mission deterministically from (date + memberId)
 *   2. Compare it against today's data the student already has loaded
 *   3. Show progress + a celebration when complete
 *
 * The mission types are intentionally tiny (one training, one technique,
 * one drill review) so they're achievable in a single visit and reinforce
 * habit formation rather than grinding.
 */

export type MissionType =
  | "study_technique"
  | "open_library"
  | "review_streak"
  | "check_ranking"
  | "check_progress"
  | "review_titles"

export interface MissionDef {
  id: MissionType
  title: string
  description: string
  emoji: string
  href: string
  ctaLabel: string
}

export const MISSIONS: MissionDef[] = [
  {
    id: "study_technique",
    title: "Estude a técnica do dia",
    description: "Abra a técnica que o Coach Kumo escolheu pra hoje.",
    emoji: "🥋",
    href: "/aluno/aprender",
    ctaLabel: "Estudar agora",
  },
  {
    id: "open_library",
    title: "Explore uma posição nova",
    description: "Procure uma técnica que você nunca treinou.",
    emoji: "🔎",
    href: "/aluno/aprender",
    ctaLabel: "Abrir biblioteca",
  },
  {
    id: "review_streak",
    title: "Visite seu radar de evolução",
    description: "Veja como anda sua sequência e presença.",
    emoji: "📊",
    href: "/aluno/performance",
    ctaLabel: "Ver radar",
  },
  {
    id: "check_ranking",
    title: "Confira o ranking",
    description: "Veja sua posição no ranking da academia.",
    emoji: "👑",
    href: "/aluno/ranking",
    ctaLabel: "Ver ranking",
  },
  {
    id: "check_progress",
    title: "Confira suas conquistas",
    description: "Quantas badges faltam pro próximo nível?",
    emoji: "🏅",
    href: "/aluno/badges",
    ctaLabel: "Ver coleção",
  },
  {
    id: "review_titles",
    title: "Reviva seus títulos",
    description: "Dê uma olhada nas suas medalhas.",
    emoji: "🏆",
    href: "/aluno/conquistas",
    ctaLabel: "Ver títulos",
  },
]

/**
 * Picks today's mission deterministically from a seed (memberId + date).
 * Same student gets the same mission all day, but a different one tomorrow.
 */
export function todaysMission(seed: string): MissionDef {
  const today = new Date()
  const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const combined = seed + dayKey

  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % MISSIONS.length
  return MISSIONS[idx]!
}

/**
 * localStorage key for "I completed today's mission" toggle.
 * Includes the date so it auto-resets at midnight.
 */
export function missionCompletionKey(memberId: string): string {
  const today = new Date()
  const day = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  return `bjj_mission_done_${memberId}_${day}`
}
