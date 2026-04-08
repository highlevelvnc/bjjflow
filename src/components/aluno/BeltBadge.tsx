"use client"

import { BELT_BICOLOR, BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

/**
 * Student-portal belt badge.
 *
 * Renders the actual belt as a horizontal bar — the left region is the
 * primary color, the right region is the secondary color (or a black
 * stripe if the belt is single-tone, matching BJJ tradition). The
 * stripes (0–4) sit inside the dark stripe section as small white pips.
 *
 * Bicolor metadata comes from `BELT_BICOLOR` so kids belts (gray/yellow/
 * orange/green families) render correctly with two real colors.
 */
export function BeltBadge({
  belt,
  stripes,
  compact = false,
}: {
  belt: string
  stripes: number
  compact?: boolean
}) {
  const beltKey = belt as Belt
  const bicolor = BELT_BICOLOR[beltKey] ?? BELT_BICOLOR.white!
  const label = BELT_LABELS[beltKey] ?? "Branca"
  const safeStripes = Math.min(Math.max(stripes ?? 0, 0), 4)

  // Stripe section: secondary color when the belt is bicolor (so a
  // gray-and-white belt's stripes show on the white half), otherwise the
  // traditional black bar with white stripe pips.
  const stripeBg = bicolor.secondary ?? "#0a0a0a"
  const pipColor = isLightHex(stripeBg) ? "#1f2937" : "#ffffff"

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ring-1 ring-white/20"
        style={{
          backgroundImage: `linear-gradient(to right, ${bicolor.primary} 0%, ${bicolor.primary} 60%, ${stripeBg} 60%, ${stripeBg} 100%)`,
          color: isLightHex(bicolor.primary) ? "#1f2937" : "#ffffff",
        }}
      >
        {label}
        {safeStripes > 0 && (
          <span className="flex gap-0.5">
            {Array.from({ length: safeStripes }).map((_, i) => (
              <span
                key={i}
                className="h-1 w-0.5 rounded-sm"
                style={{ backgroundColor: pipColor }}
              />
            ))}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-3 w-20 overflow-hidden rounded-sm ring-2 ring-white/20"
        style={{ backgroundColor: bicolor.primary }}
      >
        {/* Stripe section: kids belts use the secondary color (e.g. white
            on a gray-and-white belt), single-tone belts use the classic
            black tip. */}
        <div
          className="absolute right-0 top-0 h-full w-5"
          style={{ backgroundColor: stripeBg }}
        >
          <div className="flex h-full items-center justify-center gap-0.5">
            {Array.from({ length: safeStripes }).map((_, i) => (
              <span
                key={i}
                className="h-2 w-0.5 rounded-sm"
                style={{ backgroundColor: pipColor }}
              />
            ))}
          </div>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-200">
        Faixa {label}
      </span>
    </div>
  )
}

/** Same naïve luminance helper as ui/BeltBadge — kept local to avoid a
 *  shared util just for two callers. */
function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "")
  if (m.length !== 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 175
}
