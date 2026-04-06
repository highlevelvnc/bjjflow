import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { TitleForm } from "./TitleForm"

export const metadata: Metadata = { title: "Registrar Título" }

export default async function NewTitlePage() {
  const trpc = await createServerCaller()
  const { items } = await trpc.member.list({ limit: 200, offset: 0 })
  const members = items.map((m) => ({ id: m.id, full_name: m.full_name, belt_rank: m.belt_rank }))

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">🏆 Registrar Título</h1>
        <p className="mt-0.5 text-sm text-gray-500">Registre conquistas em competições dos seus alunos.</p>
      </div>
      <TitleForm members={members} />
    </div>
  )
}
