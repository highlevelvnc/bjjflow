import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerCaller } from "@/lib/trpc/server"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { MatchManager } from "./MatchManager"

export const metadata: Metadata = { title: "Detalhe do título" }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TitleDetailPage({ params }: PageProps) {
  const { id } = await params
  const trpc = await createServerCaller()
  const title = await trpc.title.byId({ id })

  const placementMeta: Record<string, { label: string; emoji: string; cls: string }> = {
    gold: { label: "Ouro", emoji: "🥇", cls: "text-amber-300 bg-amber-500/15 ring-amber-400/30" },
    silver: { label: "Prata", emoji: "🥈", cls: "text-zinc-200 bg-zinc-300/10 ring-zinc-300/30" },
    bronze: { label: "Bronze", emoji: "🥉", cls: "text-orange-300 bg-orange-500/15 ring-orange-400/30" },
    other: { label: "Participação", emoji: "🏅", cls: "text-gray-200 bg-white/5 ring-white/15" },
  }
  const meta = placementMeta[title.placement ?? "other"] ?? placementMeta.other!

  return (
    <div className="space-y-6">
      <Link
        href="/app/titles"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para títulos
      </Link>

      {/* ── Title hero ─────────────────────────────────────────────────── */}
      <header className="rounded-2xl border border-white/8 bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-amber-400">
              {title.competition}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-100">{title.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <BeltBadge belt={title.member_belt} stripes={title.member_stripes} />
              <span className="text-sm text-gray-300">{title.member_name}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {title.category && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                  {title.category}
                </span>
              )}
              {title.weight_class && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                  {title.weight_class}
                </span>
              )}
              {title.date && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-400">
                  {new Date(title.date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            {title.notes && (
              <p className="mt-3 text-sm italic text-gray-400">&ldquo;{title.notes}&rdquo;</p>
            )}
          </div>
          <div
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1 ${meta.cls}`}
          >
            <span className="text-2xl">{meta.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {meta.label}
            </span>
          </div>
        </div>
      </header>

      {/* ── Match manager ─────────────────────────────────────────────── */}
      <MatchManager titleId={title.id} />
    </div>
  )
}
