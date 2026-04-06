import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { InviteForm } from "@/components/members/InviteForm"

export const metadata: Metadata = {
  title: "Convidar Instrutor",
}

function inviteStatus(invite: {
  accepted_at: string | null
  revoked_at: string | null
  expires_at: string
}) {
  if (invite.revoked_at) return { label: "Revogado", className: "text-red-400 bg-red-500/15" }
  if (invite.accepted_at) return { label: "Aceito", className: "text-emerald-400 bg-emerald-500/15" }
  if (new Date(invite.expires_at) < new Date())
    return { label: "Expirado", className: "text-gray-500 bg-white/8" }
  return { label: "Pendente", className: "text-blue-400 bg-blue-500/15" }
}

export default async function InvitePage() {
  const trpc = await createServerCaller()
  const { items: invites } = await trpc.invite.list()

  const pendingInvites = invites.filter((i) => !i.accepted_at && !i.revoked_at)
  const pastInvites = invites.filter((i) => i.accepted_at || i.revoked_at)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          ← Alunos
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-100">Convidar Instrutor</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Cria um token de convite de 7 dias. Email delivery is not yet configured — share the token
          manually.
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-100">Novo Convite</h2>
        <InviteForm />
      </div>

      {pendingInvites.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">
              Pendentes ({pendingInvites.length})
            </h2>
          </div>
          <ul className="divide-y divide-white/6">
            {pendingInvites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{invite.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-600 break-all">
                      {invite.token}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {pastInvites.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Convites Anteriores</h2>
          </div>
          <ul className="divide-y divide-white/6">
            {pastInvites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-300">{invite.email}</p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Created {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {invites.length === 0 && (
        <p className="text-center text-sm text-gray-600">Nenhum convite enviado.</p>
      )}
    </div>
  )
}
