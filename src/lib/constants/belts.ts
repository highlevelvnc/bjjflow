/**
 * IBJJF belt progressions — single source of truth.
 *
 * Two parallel tracks:
 *   • Adult: white → blue → purple → brown → black → coral → red/black → red/white → red
 *   • Kids:  white → gray-white → gray → gray-black → yellow-white → yellow →
 *             yellow-black → orange-white → orange → orange-black →
 *             green-white → green → green-black
 *
 * "white" is the only belt shared between both tracks (everyone starts there).
 *
 * Stripes: 0–4 per belt, then promotion to the next belt.
 *
 * IMPORTANT: any new belt slug added here MUST also be added to the
 * `members_belt_rank_check` constraint in supabase/migrations — Postgres
 * rejects values not in the enum even if Zod validation passes.
 */

// ─── Track-specific orderings ────────────────────────────────────────────────

/** IBJJF adult progression (9 belts). */
export const ADULT_BELT_ORDER = [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
  "coral",
  "red_black",
  "red_white",
  "red",
] as const

/** IBJJF kids progression (13 belts). White is shared with the adult track. */
export const KIDS_BELT_ORDER = [
  "white",
  "gray_white",
  "gray",
  "gray_black",
  "yellow_white",
  "yellow",
  "yellow_black",
  "orange_white",
  "orange",
  "orange_black",
  "green_white",
  "green",
  "green_black",
] as const

/**
 * The 5 adult promotion belts (white → black) used as the default range
 * filter on regular adult classes. Replaces the old `BELT_ORDER.slice(0, 5)`
 * magic number that was duplicated across CreateClassForm and EditClassForm.
 */
export const ADULT_PROMOTION_BELTS = [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
] as const

/**
 * Union of every belt slug used anywhere in the system. Drives `Belt`
 * type, `z.enum(BELT_ORDER)` in tRPC validators, and the dropdown lists.
 *
 * Order: adult progression first, then the kids-only belts. White appears
 * exactly once (it's part of `ADULT_BELT_ORDER`).
 */
export const BELT_ORDER = [
  ...ADULT_BELT_ORDER,
  // kids belts that are NOT already in the adult list
  "gray_white",
  "gray",
  "gray_black",
  "yellow_white",
  "yellow",
  "yellow_black",
  "orange_white",
  "orange",
  "orange_black",
  "green_white",
  "green",
  "green_black",
] as const

export type Belt = (typeof BELT_ORDER)[number]
export type BeltTrack = "adult" | "kids"

// ─── Labels (PT-BR) ──────────────────────────────────────────────────────────

export const BELT_LABELS: Record<Belt, string> = {
  // adult
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
  coral: "Coral",
  red_black: "Vermelha e Preta",
  red_white: "Vermelha e Branca",
  red: "Vermelha",
  // kids
  gray_white: "Cinza e Branca",
  gray: "Cinza",
  gray_black: "Cinza e Preta",
  yellow_white: "Amarela e Branca",
  yellow: "Amarela",
  yellow_black: "Amarela e Preta",
  orange_white: "Laranja e Branca",
  orange: "Laranja",
  orange_black: "Laranja e Preta",
  green_white: "Verde e Branca",
  green: "Verde",
  green_black: "Verde e Preta",
}

// ─── Track classification ────────────────────────────────────────────────────

/**
 * Which track a belt belongs to. White is `"both"` because everyone starts
 * there regardless of age. Kids/adult-only belts are mutually exclusive.
 *
 * Used to (a) gate the Adulto/Infantil toggle in the member form and
 * (b) keep adult-only achievements from firing on a kids-belt promotion.
 */
export const BELT_TRACK: Record<Belt, BeltTrack | "both"> = {
  white: "both",
  blue: "adult",
  purple: "adult",
  brown: "adult",
  black: "adult",
  coral: "adult",
  red_black: "adult",
  red_white: "adult",
  red: "adult",
  gray_white: "kids",
  gray: "kids",
  gray_black: "kids",
  yellow_white: "kids",
  yellow: "kids",
  yellow_black: "kids",
  orange_white: "kids",
  orange: "kids",
  orange_black: "kids",
  green_white: "kids",
  green: "kids",
  green_black: "kids",
}

/** Returns the belts available in the given track (white is in both). */
export function beltsForTrack(track: BeltTrack): readonly Belt[] {
  return track === "kids" ? KIDS_BELT_ORDER : ADULT_BELT_ORDER
}

/**
 * Infers which track a single belt slug belongs to. White (`"both"`) is
 * resolved to `"adult"` because the form's default is the adult track.
 */
export function inferBeltTrack(belt: Belt | string): BeltTrack {
  const t = BELT_TRACK[belt as Belt]
  if (t === "kids") return "kids"
  return "adult"
}

// ─── Single-color tailwind classes (admin-side BeltBadge) ────────────────────

/**
 * Used by `src/components/ui/BeltBadge.tsx` for the simple single-color
 * pill in admin tables. The pill picks a *representative* color for
 * bicolor kids belts (the primary one) — the visual two-tone treatment
 * lives in the bicolor metadata below.
 */
export const BELT_COLORS: Record<Belt, string> = {
  // adult
  white: "bg-white border border-gray-300",
  blue: "bg-blue-600",
  purple: "bg-purple-700",
  brown: "bg-amber-900",
  black: "bg-gray-900",
  coral: "bg-orange-500",
  red_black: "bg-red-700",
  red_white: "bg-red-500",
  red: "bg-red-600",
  // kids — primary color of each family
  gray_white: "bg-gray-400",
  gray: "bg-gray-500",
  gray_black: "bg-gray-500",
  yellow_white: "bg-yellow-400",
  yellow: "bg-yellow-400",
  yellow_black: "bg-yellow-500",
  orange_white: "bg-orange-400",
  orange: "bg-orange-500",
  orange_black: "bg-orange-600",
  green_white: "bg-green-500",
  green: "bg-green-600",
  green_black: "bg-green-700",
}

// ─── Hex values for SVG / inline styles / PDF ────────────────────────────────

/**
 * Single source of truth for raw hex codes. Imported by BeltJourney
 * (timeline glow), the certificate route (PDF inline styles), and
 * anywhere else that needs a non-Tailwind color reference. Previously
 * duplicated as a local constant in two places — drift was inevitable.
 */
export const BELT_HEX: Record<Belt, string> = {
  // adult
  white: "#e5e7eb",
  blue: "#2563eb",
  purple: "#7e22ce",
  brown: "#92400e",
  black: "#1f2937",
  coral: "#f97316",
  red_black: "#b91c1c",
  red_white: "#ef4444",
  red: "#dc2626",
  // kids
  gray_white: "#9ca3af",
  gray: "#6b7280",
  gray_black: "#4b5563",
  yellow_white: "#facc15",
  yellow: "#eab308",
  yellow_black: "#ca8a04",
  orange_white: "#fb923c",
  orange: "#f97316",
  orange_black: "#ea580c",
  green_white: "#22c55e",
  green: "#16a34a",
  green_black: "#15803d",
}

// ─── Bicolor visual metadata ─────────────────────────────────────────────────

/**
 * Two-tone visualization data. `secondary === null` means the belt is
 * solid (a single color); otherwise the badge renders the primary color
 * filling the left half of the belt and the secondary filling the right
 * half — matching how IBJJF kids belts are physically split.
 *
 * Consumed by both BeltBadge components.
 */
export interface BeltBicolor {
  primary: string
  secondary: string | null
}

export const BELT_BICOLOR: Record<Belt, BeltBicolor> = {
  // adult — all single-color
  white: { primary: "#f5f5f5", secondary: null },
  blue: { primary: "#2563eb", secondary: null },
  purple: { primary: "#7e22ce", secondary: null },
  brown: { primary: "#92400e", secondary: null },
  black: { primary: "#1f2937", secondary: null },
  coral: { primary: "#f97316", secondary: null },
  red_black: { primary: "#dc2626", secondary: "#0a0a0a" },
  red_white: { primary: "#dc2626", secondary: "#f5f5f5" },
  red: { primary: "#dc2626", secondary: null },
  // kids
  gray_white: { primary: "#6b7280", secondary: "#f5f5f5" },
  gray: { primary: "#6b7280", secondary: null },
  gray_black: { primary: "#6b7280", secondary: "#0a0a0a" },
  yellow_white: { primary: "#eab308", secondary: "#f5f5f5" },
  yellow: { primary: "#eab308", secondary: null },
  yellow_black: { primary: "#eab308", secondary: "#0a0a0a" },
  orange_white: { primary: "#f97316", secondary: "#f5f5f5" },
  orange: { primary: "#f97316", secondary: null },
  orange_black: { primary: "#f97316", secondary: "#0a0a0a" },
  green_white: { primary: "#16a34a", secondary: "#f5f5f5" },
  green: { primary: "#16a34a", secondary: null },
  green_black: { primary: "#16a34a", secondary: "#0a0a0a" },
}

export const MAX_STRIPES = 4
