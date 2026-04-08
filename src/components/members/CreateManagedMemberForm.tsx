"use client"

/**
 * CreateManagedMemberForm
 * ─────────────────────────────────────────────────────────────────────────
 * Creates a student in one shot AND immediately generates the activation
 * link so the instructor can share it via WhatsApp/copy before leaving the
 * page. This means every student gets a real path to log in — they never
 * get stuck as a "managed" profile forever.
 *
 * Flow:
 *   1. Fill name + email (required) + belt
 *   2. Submit → member.createManaged + invite.createForStudent fire together
 *   3. Success modal shows the link + WhatsApp/copy buttons
 *   4. Instructor shares the link → student creates their own password
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  BELT_LABELS,
  beltsForTrack,
  type Belt,
  type BeltTrack,
} from "@/lib/constants/belts"

const ROLE_OPTIONS = [
  { value: "student", label: "Aluno" },
  { value: "instructor", label: "Instrutor" },
] as const

export function CreateManagedMemberForm() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [error, setError] = useState<string | null>(null)
  const [successLink, setSuccessLink] = useState<{
    link: string
    name: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // The belt track toggle is local state — it does NOT round-trip to the
  // server. It's purely a UX filter on which belts the dropdown shows.
  const [beltTrack, setBeltTrack] = useState<BeltTrack>("adult")

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "student" as "student" | "instructor",
    belt_rank: "white" as Belt,
    stripes: 0,
    phone: "",
    birth_date: "",
    notes: "",
  })

  /**
   * Switching tracks must reset the belt selection if it isn't valid in
   * the new track. White is in both, so it's always a safe fallback.
   */
  function handleBeltTrackChange(next: BeltTrack) {
    setBeltTrack(next)
    const allowed = beltsForTrack(next)
    if (!allowed.includes(form.belt_rank)) {
      setForm((prev) => ({ ...prev, belt_rank: "white" }))
    }
  }

  const generateLink = trpc.invite.createForStudent.useMutation()

  const createMember = trpc.member.createManaged.useMutation({
    onSuccess: async (member) => {
      await utils.member.list.invalidate()
      await utils.member.getCounts.invalidate()

      // For students with email → immediately generate activation link
      if (form.role === "student" && form.email.trim()) {
        try {
          const invite = await generateLink.mutateAsync({ memberId: member.id })
          const origin =
            typeof window !== "undefined" ? window.location.origin : ""
          setSuccessLink({
            link: `${origin}/invite?token=${invite.token}`,
            name: member.full_name,
          })
        } catch (err) {
          // If invite generation fails, still route to the member — they can
          // regenerate from the edit page.
          console.warn("[createManaged] invite generation failed", err)
          router.push(`/app/members/${member.id}/edit`)
        }
      } else {
        router.push("/app/members")
        router.refresh()
      }
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.full_name.trim().length < 2) {
      setError("Nome completo precisa ter pelo menos 2 caracteres.")
      return
    }

    // Students MUST have an email so they can log in via the activation link
    if (form.role === "student" && !form.email.trim()) {
      setError(
        "O email é obrigatório para alunos — é com ele que o aluno faz login no app.",
      )
      return
    }

    createMember.mutate({
      full_name: form.full_name.trim(),
      email: form.email.trim() || undefined,
      role: form.role,
      belt_rank: form.belt_rank,
      stripes: form.stripes,
      phone: form.phone.trim() || undefined,
      birth_date: form.birth_date || undefined,
      notes: form.notes.trim() || undefined,
    })
  }

  // ─── Success modal with shareable link ─────────────────────────────────
  if (successLink) {
    const firstName = successLink.name.split(" ")[0] ?? "aluno"
    const whatsappMessage = `Olá ${firstName}! 👊\n\nVocê foi adicionado(a) ao app da nossa academia. Acesse o link abaixo para criar sua senha e começar a acompanhar seus treinos, conquistas e ranking:\n\n${successLink.link}\n\nO link é válido por 30 dias. Bons treinos! 🥋`

    async function handleCopy() {
      if (!successLink) return
      try {
        await navigator.clipboard.writeText(successLink.link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // ignore
      }
    }

    function handleWhatsApp() {
      const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
      window.open(url, "_blank", "noopener,noreferrer")
    }

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <Check className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-100">
              {successLink.name} foi cadastrado(a)!
            </h3>
            <p className="mt-1 text-xs text-emerald-300/90">
              Envie o link de acesso abaixo para ele(a) criar a senha e entrar
              no app.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-brand-500/25 bg-gradient-to-br from-brand-500/10 via-gray-900 to-cyan-brand/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">
              <KeyRound className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-100">
                Link de acesso do aluno
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Link único válido por 30 dias. O aluno cria a senha e cai
                direto no app do treino.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
            <p className="break-all font-mono text-[11px] text-brand-200">
              {successLink.link}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/app/members")}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
          >
            Concluído
          </button>
          <button
            type="button"
            onClick={() => {
              // Reset and allow adding another student immediately
              setSuccessLink(null)
              setBeltTrack("adult")
              setForm({
                full_name: "",
                email: "",
                role: "student",
                belt_rank: "white",
                stripes: 0,
                phone: "",
                birth_date: "",
                notes: "",
              })
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/12 px-4 py-2 text-sm text-gray-300 hover:bg-white/6"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar outro aluno
          </button>
        </div>
      </div>
    )
  }

  // ─── Form ──────────────────────────────────────────────────────────────
  const isStudent = form.role === "student"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Full name */}
      <Field label="Nome Completo" required>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="João Silva"
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </Field>

      {/* Email */}
      <Field
        label="Email"
        required={isStudent}
        hint={
          isStudent
            ? "O aluno usa esse email + senha criada por ele para entrar no app."
            : "Opcional — necessário para enviar convite depois."
        }
      >
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="aluno@example.com"
          required={isStudent}
          className={inputClass}
        />
      </Field>

      {/* Role + Belt in a row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Função" required>
          <select
            value={form.role}
            onChange={(e) =>
              set("role", e.target.value as "student" | "instructor")
            }
            className={inputClass}
          >
            {ROLE_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
                className="bg-gray-900 text-gray-100"
              >
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Faixa" required>
          {/* Adulto / Infantil segmented control. Filters which belts the
              dropdown below shows. Default = Adulto (most common case). */}
          <div className="mb-2 inline-flex w-full rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(["adult", "kids"] as const).map((track) => {
              const active = beltTrack === track
              const label = track === "adult" ? "Adulto" : "Infantil"
              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => handleBeltTrackChange(track)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                      : "text-gray-400 hover:text-gray-100"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <select
            value={form.belt_rank}
            onChange={(e) => set("belt_rank", e.target.value as Belt)}
            className={inputClass}
          >
            {beltsForTrack(beltTrack).map((b) => (
              <option
                key={b}
                value={b}
                className="bg-gray-900 text-gray-100"
              >
                {BELT_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Stripes */}
      <Field label="Graus">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("stripes", n)}
              className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                form.stripes === n
                  ? "bg-brand-500 text-white"
                  : "border border-white/12 text-gray-300 hover:bg-white/6"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {/* Phone */}
      <Field label="Telefone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+55 11 99999-9999"
          maxLength={30}
          className={inputClass}
        />
      </Field>

      {/* Birth date */}
      <Field label="Data de Nascimento">
        <input
          type="date"
          value={form.birth_date}
          onChange={(e) => set("birth_date", e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Notes */}
      <Field label="Observações">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Qualquer observação sobre este aluno..."
          className={inputClass}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={createMember.isPending || generateLink.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50"
        >
          {createMember.isPending || generateLink.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Criando...
            </>
          ) : isStudent ? (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              Criar e gerar acesso
            </>
          ) : (
            "Criar Membro"
          )}
        </button>
        <a
          href="/app/members"
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

const inputClass =
  "w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
      {children}
    </div>
  )
}
