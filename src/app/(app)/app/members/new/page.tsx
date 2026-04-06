import type { Metadata } from "next"
import Link from "next/link"
import { CreateManagedMemberForm } from "@/components/members/CreateManagedMemberForm"

export const metadata: Metadata = {
  title: "Adicionar Aluno",
}

export default function NewMemberPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          ← Alunos
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-100">Adicionar Aluno</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Cria um perfil gerenciado sem conta no portal. Você pode enviar um convite depois.
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <CreateManagedMemberForm />
      </div>
    </div>
  )
}
