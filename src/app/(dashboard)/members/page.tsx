import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { RoleBadge } from "@/components/ui/RoleBadge"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { Role } from "@/types/auth"

export const metadata: Metadata = {
  title: "Members",
}

export default async function MembersPage() {
  const trpc = await createServerCaller()
  const members = await trpc.member.list({ status: "active" })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Members</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} active member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/members/invite"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Invite Instructor
          </Link>
          <Link
            href="/members/new"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Add Member
          </Link>
        </div>
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Add your first student or invite an instructor to get started."
          action={
            <Link
              href="/members/new"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Add Member
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Belt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Portal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                      {member.email && (
                        <p className="text-xs text-gray-400">{member.email}</p>
                      )}
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
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Managed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
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
