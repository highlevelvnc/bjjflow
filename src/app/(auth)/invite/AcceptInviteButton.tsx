"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { createBrowserSupabase } from "@/server/supabase/browser"

interface AcceptInviteButtonProps {
  token: string
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const acceptInvite = trpc.invite.accept.useMutation({
    onSuccess: async (data) => {
      // ⚠ Critical: invite.accept updates the user's app_metadata via the
      // admin API, but the BROWSER's existing JWT cookie still holds the
      // old payload (no academy_id, no member_role). A plain navigation to
      // /aluno would bounce off the layout's `academy_id` check and dump
      // the student on /setup. We MUST force-refresh the session here so
      // the cookies pick up a new access token with the merged metadata.
      try {
        const supabase = createBrowserSupabase()
        await supabase.auth.refreshSession()
      } catch {
        // If refresh fails for any reason, fall through — middleware will
        // re-issue on next nav. The hard reload below is the safety net.
      }

      // Students go to the mobile /aluno app, instructors/admins to /app.
      // window.location.href forces a full reload so the SSR layout re-reads
      // cookies (router.push() would not).
      const dest = data?.role === "student" ? "/aluno" : "/app"
      window.location.href = dest
    },
    onError: (err) => {
      setErrorMsg(err.message ?? "Falha ao aceitar convite. Tente novamente.")
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
        {acceptInvite.isPending ? "Aceitando..." : "Aceitar convite"}
      </button>

      {errorMsg && (
        <p className="text-center text-sm text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}
