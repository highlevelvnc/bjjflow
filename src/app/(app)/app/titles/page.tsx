import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { BeltBadge } from "@/components/ui/BeltBadge"

export const metadata: Metadata = { title: "Títulos" }

export default async function TitlesPage() {
  const trpc = await createServerCaller()
  const { items } = await trpc.title.list({ limit: 50, offset: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">🏆 Títulos & Conquistas</h1>
          <p className="mt-0.5 text-sm text-gray-500">{items.length} título{items.length !== 1 ? "s" : ""} registrado{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/app/titles/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
        >
          Registrar Título
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-gray-900 p-12 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-3 text-sm text-gray-400">Nenhum título registrado ainda.</p>
          <Link href="/app/titles/new" className="mt-2 inline-block text-sm text-brand-400 hover:text-brand-300">
            Registrar primeiro título →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs uppercase text-gray-500">
                <th className="px-5 py-3">Aluno</th>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Competição</th>
                <th className="px-5 py-3">Colocação</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {items.map((t) => {
                const medal = t.placement === "gold" ? "🥇" : t.placement === "silver" ? "🥈" : t.placement === "bronze" ? "🥉" : "🏅"
                return (
                  <tr key={t.id} className="hover:bg-white/4">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <BeltBadge belt={t.member_belt} stripes={t.member_stripes} />
                        <span className="text-gray-100">{t.member_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-100">{t.title}</td>
                    <td className="px-5 py-3 text-gray-400">{t.competition}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1">
                        {medal}
                        <span className="capitalize text-gray-300">{t.placement === "gold" ? "Ouro" : t.placement === "silver" ? "Prata" : t.placement === "bronze" ? "Bronze" : "Outro"}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
