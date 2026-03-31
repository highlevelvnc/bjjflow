import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { RoleBadge } from "@/components/ui/RoleBadge"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import { CSVImport } from "@/components/members/CSVImport"
import type { Role } from "@/types/auth"
import { Pencil } from "lucide-react"

export const metadata: Metadata = {
  title: "Members",
}

export default async function MembersPage() {
  const trpc = await createServerCaller()
  const { items: members } = await trpc.member.list({ status: "active" })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Members</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} active member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/members/invite"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            Invite Instructor
          </Link>
          <Link
            href="/app/members/new"
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
          >
            Add Member
          </Link>
        </div>
      </div>

      {/* CSV Import section */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-300">Bulk Import</h2>
        <CSVImport />
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Add your first student or invite an instructor to get started."
          action={
            <Link
              href="/app/members/new"
              className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
            >
              Add Member
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Belt</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Portal</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/4">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-100">{member.full_name}</p>
                      {member.email && <p className="text-xs text-gray-600">{member.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role as Role} />
                  </td>
                  <td className="px-4 py-3">
                    <BeltBadge belt={member.belt_rank} stripes={member.stripes} />
                  </td>
                  <td className="px-4 py-3">
                    {member.has_portal_access ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Managed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/members/${member.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/6 hover:text-gray-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
