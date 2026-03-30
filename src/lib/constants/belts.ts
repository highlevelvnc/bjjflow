/**
 * IBJJF belt progression order (adult).
 * Stripes: 0–4 per belt, then next belt at promotion.
 */
export const BELT_ORDER = [
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

export type Belt = (typeof BELT_ORDER)[number]

export const BELT_LABELS: Record<Belt, string> = {
  white: "White",
  blue: "Blue",
  purple: "Purple",
  brown: "Brown",
  black: "Black",
  coral: "Coral",
  red_black: "Red/Black",
  red_white: "Red/White",
  red: "Red",
}

/** Tailwind-compatible colors for belt display. */
export const BELT_COLORS: Record<Belt, string> = {
  white: "bg-white border border-gray-300",
  blue: "bg-blue-600",
  purple: "bg-purple-700",
  brown: "bg-amber-900",
  black: "bg-gray-900",
  coral: "bg-orange-500",
  red_black: "bg-red-700",
  red_white: "bg-red-500",
  red: "bg-red-600",
}

export const MAX_STRIPES = 4
