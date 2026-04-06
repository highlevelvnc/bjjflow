import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { RoleBadge } from "@/components/ui/RoleBadge"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { EmptyState } from "@/components/ui/EmptyState"
import { CSVImport } from "@/components/members/CSVImport"
import { MemberFilters } from "@/components/members/MemberFilters"
import type { Role } from "@/types/auth"
import { Pencil } from "lucide-react"

export const metadata: Metadata = {
  title: "Alunos",
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string }>
}) {
  const params = await searchParams
  const trpc = await createServerCaller()
  const { items: members } = await trpc.member.list({
    search: params.search || undefined,
    role: (params.role as "admin" | "instructor" | "student") || undefined,
    status: (params.status as "active" | "inactive" | "suspended") || "active",
  })

  const statusLabel = params.status || "active"
  const hasFilters = !!(params.search || params.role || params.status)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Alunos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {members.length} {statusLabel === "active" ? "ativo" : statusLabel === "inactive" ? "inativo" : statusLabel === "suspended" ? "suspenso" : statusLabel}{members.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtrado)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/members/invite"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            Convidar Instrutor
          </Link>
          <Link
            href="/app/members/new"
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
          >
            Adicionar Aluno
          </Link>
        </div>
      </div>

      {/* CSV Import section */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-300">Importar CSV</h2>
        <CSVImport />
      </div>

      {/* Filters */}
      <MemberFilters />

      {members.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Nenhum aluno encontrado com esses filtros" : "Nenhum aluno ainda"}
          description={
            hasFilters
              ? "Tente ajustar sua busca ou filtro."
              : "Adicione seu primeiro aluno ou convide um instrutor para começar."
          }
          action={
            !hasFilters ? (
              <Link
                href="/app/members/new"
                className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
              >
                Adicionar Aluno
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Função</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Faixa</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Portal</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Cadastro</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/4">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-100">{member.full_name}</p>
                      {member.email && <p className="text-xs text-gray-600">{member.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role as Role} />
                  </td>
                  <td className="px-4 py-3">
                    <BeltBadge belt={member.belt_rank} stripes={member.stripes} />
                  </td>
                  <td className="px-4 py-3">
                    {member.has_portal_access ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Gerenciado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/members/${member.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/6 hover:text-gray-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
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
