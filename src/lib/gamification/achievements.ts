/**
 * BJJFlow — Achievements catalog
 * ─────────────────────────────────────────────────────────────────────────
 * 24 unlockable badges that students earn from existing data. All achievements
 * are computed live (not stored), so backfills work automatically.
 *
 * Categories (purely cosmetic, used for grouping in the UI):
 *   - presence: streaks & total trainings
 *   - competition: titles & match results
 *   - milestones: belt promotions, anniversaries
 *   - skill: technique exploration & study
 */

export type AchievementCategory =
  | "presence"
  | "competition"
  | "milestones"
  | "skill"

export interface AchievementDef {
  id: string
  title: string
  description: string
  emoji: string
  category: AchievementCategory
  /** XP awarded when this badge is unlocked. Counted on top of base XP. */
  xpReward: number
  /** Tier — affects color/glow */
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
}

export interface AchievementProgress {
  current: number
  target: number
}

export interface UnlockedAchievement extends AchievementDef {
  unlocked: boolean
  progress: AchievementProgress
  /** When the unlock condition was first met (best-effort, may be null) */
  unlockedAt: string | null
}

// ─── Catalog ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Presence ──
  {
    id: "first_training",
    title: "Primeiro round",
    description: "Marque sua primeira presença no tatame.",
    emoji: "🥋",
    category: "presence",
    xpReward: 25,
    tier: "bronze",
  },
  {
    id: "ten_trainings",
    title: "Dez no diário",
    description: "Complete 10 treinos.",
    emoji: "📓",
    category: "presence",
    xpReward: 50,
    tier: "bronze",
  },
  {
    id: "fifty_trainings",
    title: "Cinquentinha",
    description: "Complete 50 treinos.",
    emoji: "💪",
    category: "presence",
    xpReward: 120,
    tier: "silver",
  },
  {
    id: "hundred_trainings",
    title: "Centurião",
    description: "Complete 100 treinos.",
    emoji: "⚔️",
    category: "presence",
    xpReward: 250,
    tier: "gold",
  },
  {
    id: "three_hundred_trainings",
    title: "Tatame é casa",
    description: "Complete 300 treinos.",
    emoji: "🏯",
    category: "presence",
    xpReward: 500,
    tier: "platinum",
  },
  {
    id: "five_hundred_trainings",
    title: "Faixa de aço",
    description: "Complete 500 treinos.",
    emoji: "🛡️",
    category: "presence",
    xpReward: 800,
    tier: "diamond",
  },
  {
    id: "two_week_streak",
    title: "Constância",
    description: "Treine 2 semanas seguidas sem falhar.",
    emoji: "🔁",
    category: "presence",
    xpReward: 60,
    tier: "bronze",
  },
  {
    id: "four_week_streak",
    title: "Mês inteiro",
    description: "4 semanas seguidas no tatame.",
    emoji: "📅",
    category: "presence",
    xpReward: 120,
    tier: "silver",
  },
  {
    id: "twelve_week_streak",
    title: "Sequência inquebrável",
    description: "12 semanas seguidas sem perder.",
    emoji: "🔥",
    category: "presence",
    xpReward: 300,
    tier: "gold",
  },

  // ── Competition ──
  {
    id: "first_title",
    title: "Primeiro pódio",
    description: "Conquiste seu primeiro título.",
    emoji: "🏅",
    category: "competition",
    xpReward: 100,
    tier: "bronze",
  },
  {
    id: "first_gold",
    title: "Topo do pódio",
    description: "Ganhe sua primeira medalha de ouro.",
    emoji: "🥇",
    category: "competition",
    xpReward: 200,
    tier: "gold",
  },
  {
    id: "three_golds",
    title: "Coleção de ouros",
    description: "Conquiste 3 medalhas de ouro.",
    emoji: "🏆",
    category: "competition",
    xpReward: 400,
    tier: "platinum",
  },
  {
    id: "first_submission_win",
    title: "Estrangulou e foi pra casa",
    description: "Vença uma luta por finalização.",
    emoji: "🐍",
    category: "competition",
    xpReward: 80,
    tier: "silver",
  },
  {
    id: "five_match_wins",
    title: "Mão pesada",
    description: "Vença 5 lutas oficiais.",
    emoji: "🥊",
    category: "competition",
    xpReward: 150,
    tier: "silver",
  },
  {
    id: "ten_match_wins",
    title: "Predador",
    description: "Vença 10 lutas oficiais.",
    emoji: "🦈",
    category: "competition",
    xpReward: 300,
    tier: "gold",
  },
  {
    id: "submission_specialist",
    title: "Caçador de finalizações",
    description: "Vença 5 lutas por finalização.",
    emoji: "🎯",
    category: "competition",
    xpReward: 400,
    tier: "platinum",
  },

  // ── Milestones ──
  {
    id: "blue_belt",
    title: "Faixa azul",
    description: "Receba sua faixa azul.",
    emoji: "🟦",
    category: "milestones",
    xpReward: 500,
    tier: "silver",
  },
  {
    id: "purple_belt",
    title: "Faixa roxa",
    description: "Receba sua faixa roxa.",
    emoji: "🟪",
    category: "milestones",
    xpReward: 800,
    tier: "gold",
  },
  {
    id: "brown_belt",
    title: "Faixa marrom",
    description: "Receba sua faixa marrom.",
    emoji: "🟫",
    category: "milestones",
    xpReward: 1200,
    tier: "platinum",
  },
  {
    id: "black_belt",
    title: "Faixa preta",
    description: "Receba sua faixa preta.",
    emoji: "⬛",
    category: "milestones",
    xpReward: 2500,
    tier: "diamond",
  },
  {
    id: "one_year",
    title: "Um ano de tatame",
    description: "Complete 1 ano de academia.",
    emoji: "🎂",
    category: "milestones",
    xpReward: 200,
    tier: "silver",
  },
  {
    id: "three_years",
    title: "Veterano",
    description: "Complete 3 anos de academia.",
    emoji: "🌳",
    category: "milestones",
    xpReward: 500,
    tier: "platinum",
  },

  // ── Skill ──
  {
    id: "technique_explorer",
    title: "Explorador de técnicas",
    description: "Estude 10 técnicas na biblioteca.",
    emoji: "📚",
    category: "skill",
    xpReward: 80,
    tier: "bronze",
  },
  {
    id: "technique_scholar",
    title: "Acadêmico do jiu-jitsu",
    description: "Estude todas as técnicas da biblioteca.",
    emoji: "🧠",
    category: "skill",
    xpReward: 250,
    tier: "gold",
  },
]

// ─── Stats input ──────────────────────────────────────────────────────────

export interface AchievementStats {
  totalAttendance: number
  longestStreak: number
  currentBelt: string
  beltHistory: { belt_rank: string; promoted_at: string }[]
  titles: { placement: string; date: string | null; created_at: string }[]
  matches: { result: string; method: string }[]
  memberSince: string
  techniquesStudied: number
  techniquesLibrarySize: number
}

const BELT_ORDER: Record<string, number> = {
  white: 0,
  blue: 1,
  purple: 2,
  brown: 3,
  black: 4,
}

function hasReachedBelt(stats: AchievementStats, belt: string): boolean {
  const target = BELT_ORDER[belt] ?? 0
  const current = BELT_ORDER[stats.currentBelt] ?? 0
  if (current >= target) return true
  return stats.beltHistory.some((b) => (BELT_ORDER[b.belt_rank] ?? 0) >= target)
}

function beltUnlockDate(stats: AchievementStats, belt: string): string | null {
  const match = stats.beltHistory.find((b) => b.belt_rank === belt)
  return match?.promoted_at ?? null
}

// ─── Computation ──────────────────────────────────────────────────────────

export function computeAchievements(
  stats: AchievementStats,
): UnlockedAchievement[] {
  const goldTitles = stats.titles.filter((t) => t.placement === "gold")
  const winMatches = stats.matches.filter((m) => m.result === "win")
  const subWins = winMatches.filter((m) => m.method === "submission")

  const yearsAtAcademy =
    (Date.now() - new Date(stats.memberSince).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)

  function progress(current: number, target: number): AchievementProgress {
    return { current: Math.min(current, target), target }
  }

  const earliestTitleDate = (placement?: string): string | null => {
    const list = placement
      ? stats.titles.filter((t) => t.placement === placement)
      : stats.titles
    if (list.length === 0) return null
    const sorted = [...list].sort(
      (a, b) =>
        new Date(a.date ?? a.created_at).getTime() -
        new Date(b.date ?? b.created_at).getTime(),
    )
    return sorted[0]!.date ?? sorted[0]!.created_at
  }

  return ACHIEVEMENTS.map((def): UnlockedAchievement => {
    let unlocked = false
    let prog: AchievementProgress = { current: 0, target: 1 }
    let unlockedAt: string | null = null

    switch (def.id) {
      case "first_training":
        prog = progress(stats.totalAttendance, 1)
        unlocked = stats.totalAttendance >= 1
        break
      case "ten_trainings":
        prog = progress(stats.totalAttendance, 10)
        unlocked = stats.totalAttendance >= 10
        break
      case "fifty_trainings":
        prog = progress(stats.totalAttendance, 50)
        unlocked = stats.totalAttendance >= 50
        break
      case "hundred_trainings":
        prog = progress(stats.totalAttendance, 100)
        unlocked = stats.totalAttendance >= 100
        break
      case "three_hundred_trainings":
        prog = progress(stats.totalAttendance, 300)
        unlocked = stats.totalAttendance >= 300
        break
      case "five_hundred_trainings":
        prog = progress(stats.totalAttendance, 500)
        unlocked = stats.totalAttendance >= 500
        break
      case "two_week_streak":
        prog = progress(stats.longestStreak, 2)
        unlocked = stats.longestStreak >= 2
        break
      case "four_week_streak":
        prog = progress(stats.longestStreak, 4)
        unlocked = stats.longestStreak >= 4
        break
      case "twelve_week_streak":
        prog = progress(stats.longestStreak, 12)
        unlocked = stats.longestStreak >= 12
        break
      case "first_title":
        prog = progress(stats.titles.length, 1)
        unlocked = stats.titles.length >= 1
        unlockedAt = earliestTitleDate()
        break
      case "first_gold":
        prog = progress(goldTitles.length, 1)
        unlocked = goldTitles.length >= 1
        unlockedAt = earliestTitleDate("gold")
        break
      case "three_golds":
        prog = progress(goldTitles.length, 3)
        unlocked = goldTitles.length >= 3
        break
      case "first_submission_win":
        prog = progress(subWins.length, 1)
        unlocked = subWins.length >= 1
        break
      case "five_match_wins":
        prog = progress(winMatches.length, 5)
        unlocked = winMatches.length >= 5
        break
      case "ten_match_wins":
        prog = progress(winMatches.length, 10)
        unlocked = winMatches.length >= 10
        break
      case "submission_specialist":
        prog = progress(subWins.length, 5)
        unlocked = subWins.length >= 5
        break
      case "blue_belt":
        unlocked = hasReachedBelt(stats, "blue")
        prog = progress(unlocked ? 1 : 0, 1)
        unlockedAt = beltUnlockDate(stats, "blue")
        break
      case "purple_belt":
        unlocked = hasReachedBelt(stats, "purple")
        prog = progress(unlocked ? 1 : 0, 1)
        unlockedAt = beltUnlockDate(stats, "purple")
        break
      case "brown_belt":
        unlocked = hasReachedBelt(stats, "brown")
        prog = progress(unlocked ? 1 : 0, 1)
        unlockedAt = beltUnlockDate(stats, "brown")
        break
      case "black_belt":
        unlocked = hasReachedBelt(stats, "black")
        prog = progress(unlocked ? 1 : 0, 1)
        unlockedAt = beltUnlockDate(stats, "black")
        break
      case "one_year":
        prog = progress(Math.floor(yearsAtAcademy), 1)
        unlocked = yearsAtAcademy >= 1
        if (unlocked) {
          const d = new Date(stats.memberSince)
          d.setFullYear(d.getFullYear() + 1)
          unlockedAt = d.toISOString()
        }
        break
      case "three_years":
        prog = progress(Math.floor(yearsAtAcademy), 3)
        unlocked = yearsAtAcademy >= 3
        if (unlocked) {
          const d = new Date(stats.memberSince)
          d.setFullYear(d.getFullYear() + 3)
          unlockedAt = d.toISOString()
        }
        break
      case "technique_explorer":
        prog = progress(stats.techniquesStudied, 10)
        unlocked = stats.techniquesStudied >= 10
        break
      case "technique_scholar":
        prog = progress(stats.techniquesStudied, stats.techniquesLibrarySize)
        unlocked =
          stats.techniquesLibrarySize > 0 &&
          stats.techniquesStudied >= stats.techniquesLibrarySize
        break
    }

    return { ...def, unlocked, progress: prog, unlockedAt }
  })
}

/** Total bonus XP earned from unlocked achievements. */
export function bonusXpFromAchievements(
  unlocked: UnlockedAchievement[],
): number {
  return unlocked.filter((a) => a.unlocked).reduce((s, a) => s + a.xpReward, 0)
}
