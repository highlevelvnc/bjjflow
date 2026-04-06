"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"

type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled"

interface SessionActionsMenuProps {
  sessionId: string
  status: SessionStatus
}

export function SessionActionsMenu({ sessionId, status }: SessionActionsMenuProps) {
  const router = useRouter()
  const [cancelReason, setCancelReason] = useState("")
  const [showCancelPrompt, setShowCancelPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = trpc.session.cancel.useMutation({
    onSuccess: () => {
      setShowCancelPrompt(false)
      setError(null)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  const complete = trpc.session.complete.useMutation({
    onSuccess: () => {
      setError(null)
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  if (status === "cancelled" || status === "completed") {
    return (
      <span className="text-xs capitalize text-gray-600">{status}</span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        {showCancelPrompt ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-40 rounded border border-white/12 bg-white/6 px-2 py-1 text-xs text-gray-100 placeholder-gray-600"
            />
            <button
              onClick={() => cancel.mutate({ id: sessionId, cancel_reason: cancelReason || undefined })}
              disabled={cancel.isPending}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
            >
              {cancel.isPending ? "…" : "Confirmar"}
            </button>
            <button
              onClick={() => setShowCancelPrompt(false)}
              className="text-xs text-gray-600 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => complete.mutate({ id: sessionId })}
              disabled={complete.isPending}
              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
            >
              {complete.isPending ? "…" : "Complete"}
            </button>
            <span className="text-gray-700">·</span>
            <button
              onClick={() => setShowCancelPrompt(true)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
