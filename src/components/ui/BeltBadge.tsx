import { cn } from "@/lib/utils/cn"
import { BELT_LABELS, BELT_COLORS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

interface BeltBadgeProps {
  belt: string
  stripes?: number
  className?: string
}

export function BeltBadge({ belt, stripes = 0, className }: BeltBadgeProps) {
  const beltKey = belt as Belt
  const label = BELT_LABELS[beltKey] ?? belt
  const color = BELT_COLORS[beltKey] ?? "bg-gray-200"
  const textColor =
    beltKey === "white" ? "text-gray-700" : beltKey === "black" ? "text-white" : "text-white"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        color,
        textColor,
        className,
      )}
    >
      {label}
      {stripes > 0 && (
        <span className="opacity-75">
          {"·".repeat(stripes)}
        </span>
      )}
    </span>
  )
}
