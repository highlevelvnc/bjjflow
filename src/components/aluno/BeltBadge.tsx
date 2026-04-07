"use client"

const BELT_META: Record<
  string,
  { label: string; bg: string; ring: string; text: string }
> = {
  white: {
    label: "Branca",
    bg: "bg-white",
    ring: "ring-white/40",
    text: "text-gray-900",
  },
  blue: {
    label: "Azul",
    bg: "bg-blue-600",
    ring: "ring-blue-400/60",
    text: "text-white",
  },
  purple: {
    label: "Roxa",
    bg: "bg-purple-600",
    ring: "ring-purple-400/60",
    text: "text-white",
  },
  brown: {
    label: "Marrom",
    bg: "bg-amber-800",
    ring: "ring-amber-600/60",
    text: "text-white",
  },
  black: {
    label: "Preta",
    bg: "bg-gray-900",
    ring: "ring-gray-700/60",
    text: "text-white",
  },
}

export function BeltBadge({
  belt,
  stripes,
  compact = false,
}: {
  belt: string
  stripes: number
  compact?: boolean
}) {
  const meta = BELT_META[belt] ?? BELT_META.white!
  const safeStripes = Math.min(Math.max(stripes ?? 0, 0), 4)

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}
      >
        {meta.label}
        {safeStripes > 0 && (
          <span className="flex gap-0.5">
            {Array.from({ length: safeStripes }).map((_, i) => (
              <span key={i} className="h-1 w-0.5 rounded-sm bg-current" />
            ))}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative h-3 w-20 overflow-hidden rounded-sm ring-2 ${meta.bg} ${meta.ring}`}
      >
        {/* faixa preta no canto direito (estilo BJJ) */}
        <div className="absolute right-0 top-0 h-full w-5 bg-black/90">
          <div className="flex h-full items-center justify-center gap-0.5">
            {Array.from({ length: safeStripes }).map((_, i) => (
              <span key={i} className="h-2 w-0.5 rounded-sm bg-white/90" />
            ))}
          </div>
        </div>
      </div>
      <span className={`text-xs font-semibold ${meta.text === "text-white" ? "text-gray-200" : "text-gray-200"}`}>
        Faixa {meta.label}
      </span>
    </div>
  )
}
