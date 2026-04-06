"use client"
import { trpc } from "@/lib/trpc/client"
import { Loader2, ScrollText } from "lucide-react"

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-400",
  update: "bg-blue-500/15 text-blue-400",
  delete: "bg-red-500/15 text-red-400",
}

function getActionColor(action: string) {
  if (action.includes("create") || action.includes("add")) return ACTION_COLORS.create
  if (action.includes("delete") || action.includes("remove")) return ACTION_COLORS.delete
  return ACTION_COLORS.update
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "yesterday" : `${days}d ago`
}

export function AuditClient() {
  const { data, isLoading } = trpc.audit.list.useQuery({ limit: 50 })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-gray-500" />
        <h1 className="text-xl font-semibold text-gray-100">Audit Log</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/3 py-12 text-center text-sm text-gray-500">No audit entries yet</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead><tr className="bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resource</th>
            </tr></thead>
            <tbody className="divide-y divide-white/6">
              {data.items.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/3">
                  <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(entry.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{entry.actor_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}>{entry.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{entry.resource_type}{entry.resource_id ? ` #${entry.resource_id.slice(0, 8)}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
