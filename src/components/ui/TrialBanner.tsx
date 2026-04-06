"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

interface TrialBannerProps {
  trialEndsAt?: string | null
}

export function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  let message = "Você está no período de teste gratuito. Faça upgrade para manter sua academia ativa."

  if (trialEndsAt) {
    const now = new Date()
    const end = new Date(trialEndsAt)
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    if (diffDays === 0) {
      message = "Seu teste expira hoje. Faça upgrade agora."
    } else if (diffDays === 1) {
      message = "Seu teste expira amanhã. Faça upgrade agora."
    } else {
      message = `Seu teste expira em ${diffDays} dias. Faça upgrade agora.`
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <svg
          className="h-4 w-4 shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p className="truncate text-sm font-medium text-amber-200">
          {message}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/app/billing"
          className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400"
        >
          Assinar
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 text-amber-400/60 hover:text-amber-300"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
