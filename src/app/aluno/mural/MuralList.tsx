"use client"

import { Loader2, Megaphone, Pin } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  important: {
    label: "Importante",
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  urgent: {
    label: "Urgente",
    cls: "border-red-500/30 bg-red-500/10 text-red-300",
  },
}

export function MuralList() {
  const { data, isLoading, isError } = trpc.portal.myAnnouncements.useQuery({
    limit: 50,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Falha ao carregar avisos. Tente novamente em instantes.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
          <Megaphone className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-gray-200">Mural vazio</p>
        <p className="mt-1 max-w-xs text-xs text-gray-500">
          Quando sua academia publicar avisos, eles aparecem aqui.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {data.map((a) => {
        const priorityMeta = a.priority ? PRIORITY_META[a.priority] : null
        return (
          <li
            key={a.id}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-md shadow-black/20 backdrop-blur ${
              a.pinned
                ? "border-amber-500/25 bg-amber-500/[0.04]"
                : "border-white/8 bg-gray-900/60"
            }`}
          >
            {a.pinned && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                <Pin className="h-2.5 w-2.5" />
                Fixado
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 pr-12">
                  <h2 className="text-base font-semibold text-gray-100">
                    {a.title}
                  </h2>
                  {priorityMeta && (
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${priorityMeta.cls}`}
                    >
                      {priorityMeta.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {a.content}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-wider text-gray-600">
                  {a.authorName} · {formatDate(a.publishedAt)}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
