"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const TEMPLATES: Record<string, { title: string; content: string }> = {
  enrollment: {
    title: "Contrato de Matrícula",
    content: `CONTRATO DE MATRÍCULA

Este Contrato de Matrícula ("Contrato") é firmado entre a Academia e o Aluno/Membro abaixo assinado.

1. MATRÍCULA
O Aluno concorda em se matricular no programa de Jiu-Jitsu Brasileiro da Academia e cumprir todas as regras e regulamentos estabelecidos pela Academia.

2. VIGÊNCIA
Este Contrato terá início na data de sua assinatura e continuará durante o período de matrícula ativa do Aluno.

3. TAXAS E PAGAMENTOS
O Aluno concorda em pagar todas as taxas de mensalidade aplicáveis conforme descrito no plano de matrícula selecionado. As taxas vencem no primeiro dia de cada mês.

4. REGRAS E CONDUTA
O Aluno concorda em:
- Manter higiene adequada e usar uniforme limpo
- Respeitar todos os instrutores, funcionários e colegas
- Seguir as diretrizes de treinamento e protocolos de segurança da Academia
- Não utilizar técnicas aprendidas de forma prejudicial ou irresponsável

5. DECLARAÇÃO
Ao assinar abaixo, o Aluno declara que leu, compreendeu e concorda com os termos deste Contrato.

Assinatura: ___________________________
Data: ___________________________`,
  },
  liability: {
    title: "Termo de Responsabilidade",
    content: `TERMO DE RESPONSABILIDADE E ISENÇÃO DE RESPONSABILIDADE

Eu, abaixo assinado(a), reconheço que a participação no treinamento de Jiu-Jitsu Brasileiro envolve riscos inerentes de lesão física.

1. ASSUNÇÃO DE RISCO
Assumo voluntariamente todos os riscos associados à participação em aulas de BJJ, treinos livres, seminários e competições organizadas pela Academia, incluindo, mas não se limitando a, contusões, entorses, fraturas e outras lesões.

2. ISENÇÃO DE RESPONSABILIDADE
Pelo presente, isento, renuncio e libero a Academia, seus proprietários, instrutores, funcionários e representantes de toda e qualquer responsabilidade por lesão, doença ou dano decorrente da minha participação nas atividades da Academia.

3. AUTORIZAÇÃO MÉDICA
Confirmo que estou fisicamente apto(a) para participar do treinamento de BJJ. Autorizo a Academia a buscar atendimento médico de emergência em meu nome, se necessário.

4. CONSENTIMENTO DE FOTO/VÍDEO
Concedo à Academia permissão para usar fotografias e vídeos feitos durante o treinamento para fins promocionais e educacionais.

5. ACORDO
Este termo permanecerá em vigor durante o período da minha matrícula na Academia.

Assinatura: ___________________________
Data: ___________________________`,
  },
  monthly: {
    title: "Contrato de Plano Mensal",
    content: `CONTRATO DE PLANO MENSAL

Este Contrato de Plano Mensal ("Contrato") é firmado entre a Academia e o Membro abaixo assinado.

1. PLANO DE MATRÍCULA
O Membro concorda em se inscrever em um plano mensal, com acesso às aulas conforme definido pelo nível do seu plano.

2. TERMOS DE PAGAMENTO
- As mensalidades são cobradas automaticamente no dia 1º de cada mês
- O Membro é responsável por manter as informações de pagamento atualizadas
- Atrasos no pagamento podem resultar na suspensão dos privilégios de treinamento

3. POLÍTICA DE CANCELAMENTO
- É necessário aviso prévio por escrito de no mínimo 30 dias para cancelamento
- Não haverá reembolso para meses parciais
- A Academia reserva-se o direito de cancelar a matrícula por violações das políticas da Academia

4. CONGELAMENTO DE MATRÍCULA
- Membros podem congelar sua matrícula por até 30 dias por ano
- Solicitações de congelamento devem ser enviadas por escrito com pelo menos 7 dias de antecedência

5. ACORDO
Ao assinar abaixo, o Membro confirma sua inscrição no plano mensal e concorda com todos os termos acima descritos.

Assinatura: ___________________________
Data: ___________________________`,
  },
}

export function ContractForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    memberId: "",
    title: "",
    content: "",
    expiresAt: "",
  })

  const { data: members } = trpc.member.list.useQuery()
  const createMutation = trpc.contract.create.useMutation({
    onSuccess: (data) => {
      router.push(`/app/contracts/${data.id}`)
    },
  })

  function applyTemplate(key: string) {
    const template = TEMPLATES[key]
    if (template) {
      setForm({ ...form, title: template.title, content: template.content })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      memberId: form.memberId,
      title: form.title,
      content: form.content,
      expiresAt: form.expiresAt || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/contracts"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Novo Contrato</h1>
          <p className="mt-0.5 text-sm text-gray-500">Crie um contrato para um membro assinar</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-medium text-gray-300">Modelos Rápidos</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyTemplate(key)}
              className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-brand-300"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Membro *</label>
          <select
            required
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
          >
            <option value="">Selecione um membro...</option>
            {members?.items?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.email ?? "sem email"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Título *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            placeholder="e.g. Enrollment Agreement"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Conteúdo *</label>
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50 font-mono"
            rows={16}
            placeholder="Conteúdo do contrato..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Data de Expiração (opcional)</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/app/contracts"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Criar Contrato
          </button>
        </div>
        {createMutation.error && (
          <p className="text-xs text-red-400">{createMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}
