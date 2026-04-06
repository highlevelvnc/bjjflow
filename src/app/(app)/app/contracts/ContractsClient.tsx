"use client"

import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { FileSignature, Plus, Loader2 } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  signed: "bg-green-500/15 text-green-400",
  expired: "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
}

export function ContractsClient() {
  const { data, isLoading } = trpc.contract.list.useQuery()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Contracts</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {data ? `${data.total} contract${data.total === 1 ? "" : "s"}` : "Loading..."}
          </p>
        </div>
        <Link
          href="/app/contracts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
        >
          <Plus className="h-4 w-4" />
          New Contract
        </Link>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-10 text-center">
          <FileSignature className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No contracts yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Create your first contract to get started with digital signatures.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm text-gray-200">{c.member_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{c.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/contracts/${c.id}`}
                      className="text-sm text-brand-400 hover:text-brand-300"
                    >
                      View
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
