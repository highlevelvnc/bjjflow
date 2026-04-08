"use client"

import { BELT_COLORS, BELT_LABELS, BELT_HEX } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"
import { Award, Download } from "lucide-react"

interface BeltJourneyProps {
  currentBelt: string
  currentStripes: number
  memberSince: string
  memberId: string
  beltHistory: Array<{
    id: string
    belt_rank: string
    stripes: number
    promoted_at: string
    notes: string | null
  }>
}

function formatDuration(from: string, to: string): string {
  const a = new Date(from)
  const b = new Date(to)
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years > 0 && rem > 0) return `${years}y ${rem}mo`
  if (years > 0) return `${years}y`
  if (rem > 0) return `${rem}mo`
  return "< 1 month"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function BeltJourney({
  currentBelt,
  currentStripes,
  memberSince,
  memberId,
  beltHistory,
}: BeltJourneyProps) {
  const beltKey = currentBelt as Belt
  const currentColor = BELT_COLORS[beltKey] ?? "bg-gray-500"
  const currentHex = BELT_HEX[beltKey] ?? "#6b7280"
  const currentLabel = BELT_LABELS[beltKey] ?? currentBelt

  // Sort ascending (oldest first) for timeline
  const sorted = [...beltHistory].sort(
    (a, b) => new Date(a.promoted_at).getTime() - new Date(b.promoted_at).getTime(),
  )

  const hasMilestones = sorted.length > 0

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
      <h3 className="mb-5 text-sm font-medium text-gray-300">Jornada de Faixas</h3>

      {!hasMilestones ? (
        /* ---- No belt history: single milestone ---- */
        <div className="flex flex-col items-center gap-3 py-6">
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{ boxShadow: `0 0 20px 4px ${currentHex}55` }}
          >
            <div className={`h-14 w-14 rounded-full ${currentColor}`} />
            {/* Pulsing ring */}
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-20"
              style={{ backgroundColor: currentHex }}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-100">
              {currentLabel} Belt{currentStripes > 0 ? ` \u00b7 ${currentStripes} stripe${currentStripes > 1 ? "s" : ""}` : ""}
            </p>
            <p className="mt-1 text-xs text-gray-500">Sua jornada começa</p>
            <p className="text-xs text-gray-600">Membro desde {formatDate(memberSince)}</p>
          </div>
        </div>
      ) : (
        /* ---- Full timeline ---- */
        <div className="relative ml-6">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5"
            style={{
              background: `linear-gradient(to bottom, ${currentHex}, ${BELT_HEX[sorted[0]!.belt_rank as Belt] ?? "#6b7280"})`,
              opacity: 0.3,
            }}
          />

          {/* Current belt (top) */}
          <TimelineMilestone
            beltRank={currentBelt}
            stripes={currentStripes}
            date={sorted[sorted.length - 1]!.promoted_at}
            isCurrent
            memberId={memberId}
          />

          {/* Duration from last promotion to now */}
          <DurationBadge
            text={formatDuration(sorted[sorted.length - 1]!.promoted_at, new Date().toISOString())}
          />

          {/* Past milestones (newest first) */}
          {[...sorted].reverse().map((entry, idx) => {
            const nextEntry = idx < sorted.length - 1 ? [...sorted].reverse()[idx + 1] : null
            return (
              <div key={entry.id}>
                <TimelineMilestone
                  beltRank={entry.belt_rank}
                  stripes={entry.stripes}
                  date={entry.promoted_at}
                  notes={entry.notes}
                  isCurrent={false}
                  memberId={memberId}
                />
                {nextEntry && (
                  <DurationBadge
                    text={formatDuration(nextEntry.promoted_at, entry.promoted_at)}
                  />
                )}
              </div>
            )
          })}

          {/* Journey started */}
          <div className="relative flex items-center gap-4 pb-2 pl-0">
            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-gray-800">
              <Award className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Jornada iniciada</p>
              <p className="text-xs text-gray-600">{formatDate(memberSince)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Sub-components ---- */

function TimelineMilestone({
  beltRank,
  stripes,
  date,
  notes,
  isCurrent,
  memberId,
}: {
  beltRank: string
  stripes: number
  date: string
  notes?: string | null
  isCurrent?: boolean
  memberId: string
}) {
  const bk = beltRank as Belt
  const color = BELT_COLORS[bk] ?? "bg-gray-500"
  const hex = BELT_HEX[bk] ?? "#6b7280"
  const label = BELT_LABELS[bk] ?? beltRank

  const certUrl = `/api/certificate/${memberId}?belt=${encodeURIComponent(beltRank)}&date=${encodeURIComponent(date)}`

  return (
    <div className="relative flex items-start gap-4 pb-4 pl-0">
      {/* Belt circle */}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={isCurrent ? { boxShadow: `0 0 14px 3px ${hex}44` } : undefined}
      >
        <div className={`h-7 w-7 rounded-full ${color}`} />
        {isCurrent && (
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-15"
            style={{ backgroundColor: hex }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${isCurrent ? "text-gray-100" : "text-gray-300"}`}>
          {label} Belt
          {stripes > 0 && (
            <span className="ml-1 text-gray-500">
              {"\u00b7"} {stripes} stripe{stripes > 1 ? "s" : ""}
            </span>
          )}
          {isCurrent && (
            <span className="ml-2 inline-block rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-400">
              Atual
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{formatDate(date)}</p>
        {notes && <p className="mt-1 text-xs italic text-gray-600">{notes}</p>}

        {/* Certificate button */}
        <a
          href={certUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/3 px-2 py-1 text-[10px] font-medium text-gray-400 transition-colors hover:bg-white/6 hover:text-gray-200"
        >
          <Download className="h-3 w-3" />
          Certificado
        </a>
      </div>
    </div>
  )
}

function DurationBadge({ text }: { text: string }) {
  return (
    <div className="relative flex items-center pb-3 pl-0">
      <div className="z-10 flex h-8 w-8 items-center justify-center">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-700" />
      </div>
      <span className="ml-4 rounded-full border border-white/5 bg-white/3 px-2.5 py-0.5 text-[10px] text-gray-600">
        {text}
      </span>
    </div>
  )
}
