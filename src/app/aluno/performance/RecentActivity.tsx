"use client"

import { Target, CheckCircle2, Trophy, Trash2, Clock, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const EVENT_META: Record<
  "attempt" | "success" | "submission",
  { label: string; icon: React.ElementType; chip: string }
> = {
  attempt: {
    label: "Tentativa",
    icon: Target,
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  success: {
    label: "Sucesso",
    icon: CheckCircle2,
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  submission: {
    label: "Finalização",
    icon: Trophy,
    chip: "border-brand-500/30 bg-brand-500/10 text-brand-300",
  },
}

function relativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return "agora há pouco"
  if (min < 60) return `há ${min}min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function RecentActivity() {
  const utils = trpc.useUtils()
  const { data, isLoading, isError } = trpc.studentPerformance.recent.useQuery({ limit: 10 })

  const deleteMutation = trpc.studentPerformance.deleteEvent.useMutation({
    onSuccess: () => {
      utils.studentPerformance.recent.invalidate()
      utils.studentPerformance.byTechnique.invalidate()
      utils.studentPerformance.summary.invalidate()
    },
  })

  return (
    <section className="rounded-2xl border border-white/8 bg-gray-900/80 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 sm:text-base">
            Histórico recente
          </h2>
          <p className="text-xs text-gray-500">Últimos 10 registros</p>
        </div>
        <Clock className="h-4 w-4 text-gray-600" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-red-400">Falha ao carregar histórico.</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/8 bg-white/2 px-4 py-8 text-center">
          <Clock className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <p className="text-sm text-gray-400">Nenhum registro ainda</p>
          <p className="mt-0.5 text-xs text-gray-600">
            Comece a marcar suas técnicas após cada rolamento.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {data.map((row) => {
            const meta = EVENT_META[row.eventType]
            const Icon = meta.icon
            return (
              <li
                key={row.id}
                className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2 transition-all hover:border-white/12 hover:bg-white/5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.chip}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-gray-100">{row.label}</p>
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {row.notes && (
                    <p className="mt-0.5 truncate text-[11px] text-gray-500" title={row.notes}>
                      {row.notes}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-gray-600 sm:text-[11px]">
                  {relativeTime(row.createdAt)}
                </span>
                <button
                  onClick={() => {
                    if (confirm("Remover este registro?")) {
                      deleteMutation.mutate({ id: row.id })
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-1 text-gray-600 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-0"
                  aria-label="Remover registro"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
