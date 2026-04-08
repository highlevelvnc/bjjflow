import { cn } from "@/lib/utils/cn"
import { BELT_LABELS, BELT_BICOLOR } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

interface BeltBadgeProps {
  belt: string
  stripes?: number
  className?: string
}

/**
 * Compact belt badge used in admin tables and lists.
 *
 * Renders the belt label inside a colored pill. For IBJJF kids belts that
 * are physically two-toned (e.g. cinza-e-branca, amarela-e-preta), the pill
 * is split horizontally with the primary color on the left half and the
 * secondary color on the right half — matching the real belt.
 */
export function BeltBadge({ belt, stripes = 0, className }: BeltBadgeProps) {
  const beltKey = belt as Belt
  const label = BELT_LABELS[beltKey] ?? belt
  const bicolor = BELT_BICOLOR[beltKey]

  // Fall back to a neutral pill for slugs we don't recognise. This keeps
  // legacy/unknown data from crashing the table.
  if (!bicolor) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800",
          className,
        )}
      >
        {label}
        {stripes > 0 && <span className="opacity-75">{"·".repeat(stripes)}</span>}
      </span>
    )
  }

  // Pick a readable text color against the primary background. We base it
  // on the primary because the label sits over the left half of the pill.
  const textColor = isLightHex(bicolor.primary) ? "text-gray-900" : "text-white"

  // Single-color belt → solid background, original behaviour preserved.
  if (bicolor.secondary === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
          textColor,
          className,
        )}
        style={{ backgroundColor: bicolor.primary }}
      >
        {label}
        {stripes > 0 && <span className="opacity-75">{"·".repeat(stripes)}</span>}
      </span>
    )
  }

  // Two-tone belt → split background via linear-gradient with hard stops.
  // Using a gradient (instead of two child divs) keeps the pill a single
  // element so flex/text rendering still works the same way as the
  // single-color path.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        textColor,
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(to right, ${bicolor.primary} 0%, ${bicolor.primary} 50%, ${bicolor.secondary} 50%, ${bicolor.secondary} 100%)`,
      }}
    >
      {label}
      {stripes > 0 && <span className="opacity-75">{"·".repeat(stripes)}</span>}
    </span>
  )
}

/**
 * Naïve perceived-luminance check used to flip the label color between
 * black-on-light and white-on-dark. Sufficient for the small set of
 * known belt hex values; we don't need WCAG-grade contrast here.
 */
function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "")
  if (m.length !== 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  // Rec. 601 luma — fast and good enough for solid hex values.
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 175
}
