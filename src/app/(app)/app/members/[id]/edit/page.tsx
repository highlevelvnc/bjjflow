import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerCaller } from "@/lib/trpc/server"
import { EditMemberForm } from "@/components/members/EditMemberForm"
import { BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"
import { Award } from "lucide-react"

export const metadata = { title: "Editar Aluno" }

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trpc = await createServerCaller()

  let member
  try {
    member = await trpc.member.getById({ id })
  } catch {
    notFound()
  }

  const beltLabel = BELT_LABELS[member.belt_rank as Belt] ?? member.belt_rank

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Voltar aos alunos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">Editar Aluno</h1>
        <p className="mt-1 text-sm text-gray-500">Update {member.full_name}&apos;s perfil</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <EditMemberForm member={member} />
      </div>

      {/* Gerar Certificado */}
      <div className="mt-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">Certificado</h3>
        <p className="mb-3 text-xs text-gray-500">
          Gerar certificado de graduação for {member.full_name}&apos;s graduação atual ({beltLabel} Faixa).
        </p>
        <a
          href={`/api/certificate/${member.id}?belt=${encodeURIComponent(member.belt_rank)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3.5 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/6 hover:text-gray-200"
        >
          <Award className="h-4 w-4" />
          Gerar Certificado
        </a>
      </div>
    </div>
  )
}
