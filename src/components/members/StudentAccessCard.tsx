"use client"

import { useState } from "react"
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  MessageCircle,
  Smartphone,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"

interface Props {
  member: {
    id: string
    full_name: string
    email: string | null
    role: string
    has_portal_access: boolean
  }
}

/**
 * Card mostrado na página de edição do aluno. Permite ao instrutor:
 *   1. Gerar um link único de acesso ao app /aluno (válido por 30 dias)
 *   2. Copiar o link
 *   3. Compartilhar via WhatsApp com mensagem pré-pronta
 *
 * Quando o aluno já tem `has_portal_access = true`, o card mostra apenas
 * o status "Acesso ativo" sem botão de gerar.
 */
export function StudentAccessCard({ member }: Props) {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = trpc.invite.createForStudent.useMutation({
    onSuccess: (data) => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : ""
      setLink(`${origin}/invite?token=${data.token}`)
      setError(null)
    },
    onError: (err) => setError(err.message),
  })

  // Aluno sem email — não dá para gerar
  if (!member.email) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">
            <KeyRound className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-100">
              Acesso ao app do aluno
            </h3>
            <p className="mt-1 text-xs text-amber-300/90">
              Cadastre um email no perfil acima para poder gerar o acesso ao
              aplicativo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Já tem acesso — só mostra status
  if (member.has_portal_access) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-100">
              App do aluno conectado
            </h3>
            <p className="mt-1 text-xs text-emerald-300/90">
              {member.full_name} já tem acesso ao painel mobile. Login com{" "}
              <span className="font-mono">{member.email}</span>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  function handleGenerate() {
    setError(null)
    generate.mutate({ memberId: member.id })
  }

  async function handleCopy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Não foi possível copiar")
    }
  }

  function handleWhatsApp() {
    if (!link) return
    const message = `Olá ${member.full_name.split(" ")[0]}! 👊\n\nVocê foi adicionado(a) ao app da nossa academia. Acesse o link abaixo para criar sua senha e começar a acompanhar seus treinos, conquistas e ranking:\n\n${link}\n\nO link é válido por 30 dias. Bons treinos! 🥋`
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="rounded-xl border border-brand-500/25 bg-gradient-to-br from-brand-500/10 via-gray-900 to-cyan-brand/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">
          <KeyRound className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-100">
            Acesso ao app do aluno
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Gere um link único para {member.full_name.split(" ")[0]} criar a
            senha e instalar o painel mobile. Link válido por 30 dias.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {!link ? (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 disabled:opacity-60"
        >
          {generate.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Gerar link de acesso
            </>
          )}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
            <p className="break-all font-mono text-[11px] text-brand-200">
              {link}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-500/25"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar no WhatsApp
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            O aluno cria a senha pelo link e cai direto no app do treino.
          </p>
        </div>
      )}
    </div>
  )
}
