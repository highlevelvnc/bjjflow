import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { InviteForm } from "@/components/members/InviteForm"

export const metadata: Metadata = {
  title: "Invite Instructor",
}

function inviteStatus(invite: {
  accepted_at: string | null
  revoked_at: string | null
  expires_at: string
}) {
  if (invite.revoked_at) return { label: "Revoked", className: "text-red-600 bg-red-50" }
  if (invite.accepted_at) return { label: "Accepted", className: "text-green-700 bg-green-50" }
  if (new Date(invite.expires_at) < new Date())
    return { label: "Expired", className: "text-gray-500 bg-gray-100" }
  return { label: "Pending", className: "text-blue-700 bg-blue-50" }
}

export default async function InvitePage() {
  const trpc = await createServerCaller()
  const invites = await trpc.invite.list()

  const pendingInvites = invites.filter((i) => !i.accepted_at && !i.revoked_at)
  const pastInvites = invites.filter((i) => i.accepted_at || i.revoked_at)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-700">
          ← Members
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Invite Instructor</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Creates a 7-day invite token. Email delivery is not yet configured — share the token
          manually.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-gray-900">New Invite</h2>
        <InviteForm />
      </div>

      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-900">
              Pending ({pendingInvites.length})
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{invite.email}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-400 break-all">
                      {invite.token}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
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
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-900">Past Invites</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {pastInvites.map((invite) => {
              const status = inviteStatus(invite)
              return (
                <li key={invite.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-700">{invite.email}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
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
        <p className="text-center text-sm text-gray-400">No invites sent yet.</p>
      )}
    </div>
  )
}
