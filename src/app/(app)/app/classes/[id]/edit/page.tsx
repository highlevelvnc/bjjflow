import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { EditClassForm } from "@/components/classes/EditClassForm"

export const metadata: Metadata = {
  title: "Editar Turma",
}

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const trpc = await createServerCaller()

  const [classData, instructorResult, adminResult] = await Promise.all([
    trpc.class.getById({ id }),
    trpc.member.list({ role: "instructor" }),
    trpc.member.list({ role: "admin" }),
  ])

  const instructors = [
    ...adminResult.items.map((m) => ({ id: m.id, full_name: m.full_name })),
    ...instructorResult.items.map((m) => ({ id: m.id, full_name: m.full_name })),
  ]

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/app/classes" className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Voltar às turmas
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-100">Editar Turma</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Atualize os detalhes do modelo de turma.
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <EditClassForm classData={classData} instructors={instructors} />
      </div>
    </div>
  )
}
