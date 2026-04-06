"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

interface AcceptInviteButtonProps {
  token: string
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const acceptInvite = trpc.invite.accept.useMutation({
    onSuccess: () => {
      // Force a full page reload to pick up the new JWT with academy_id
      window.location.href = "/app"
    },
    onError: (err) => {
      setErrorMsg(err.message ?? "Failed to accept invite. Please try again.")
    },
  })

  function handleAccept() {
    setErrorMsg(null)
    acceptInvite.mutate({ token })
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={handleAccept}
        disabled={acceptInvite.isPending}
        className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
      >
        {acceptInvite.isPending ? "Accepting..." : "Accept Invite"}
      </button>

      {errorMsg && (
        <p className="text-center text-sm text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}
