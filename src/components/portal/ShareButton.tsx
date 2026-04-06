"use client"

import { useState, useCallback } from "react"
import { Share2, Check } from "lucide-react"
import { BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

interface ShareButtonProps {
  name: string
  belt: string
  totalSessions: number
}

export function ShareButton({ name, belt, totalSessions }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const beltLabel = BELT_LABELS[belt as Belt] ?? belt

  const text = `\u{1F94B} ${name} \u00b7 ${beltLabel} Belt \u00b7 ${totalSessions} aulas no Kumo`

  const handleShare = useCallback(async () => {
    // Try native Web Share API first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // User cancelled or not supported; fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API might not be available
    }
  }, [text])

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3.5 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/6 hover:text-gray-200"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-400" />
          <span className="text-green-400">Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Compartilhar minha jornada
        </>
      )}
    </button>
  )
}
