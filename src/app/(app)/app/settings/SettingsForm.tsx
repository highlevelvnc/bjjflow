"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

interface SettingsFormProps {
  initialData: {
    name: string
    slug: string
    timezone: string
    allow_student_self_checkin: boolean
    allow_student_portal: boolean
    block_after_days_overdue: number
    pix_key?: string
    pix_key_type?: "cpf" | "cnpj" | "email" | "phone" | "random"
    merchant_city?: string
  }
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
]

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name)
  const [timezone, setTimezone] = useState(initialData.timezone)
  const [selfCheckin, setSelfCheckin] = useState(initialData.allow_student_self_checkin)
  const [studentPortal, setStudentPortal] = useState(initialData.allow_student_portal)
  const [blockDays, setBlockDays] = useState(initialData.block_after_days_overdue)
  const [pixKey, setPixKey] = useState(initialData.pix_key ?? "")
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj" | "email" | "phone" | "random">(initialData.pix_key_type ?? "cpf")
  const [merchantCity, setMerchantCity] = useState(initialData.merchant_city ?? "")
  const [saved, setSaved] = useState(false)

  const updateSettings = trpc.academy.updateSettings.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateSettings.mutate({
      name,
      timezone,
      allow_student_self_checkin: selfCheckin,
      allow_student_portal: studentPortal,
      block_after_days_overdue: blockDays,
      pix_key: pixKey || undefined,
      pix_key_type: pixKey ? pixKeyType : undefined,
      merchant_city: merchantCity || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Academy info */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-100">Informações da Academia</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
              Nome da Academia
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              placeholder="Minha Academia"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-gray-300">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-100">Funcionalidades</h2>

        <div className="space-y-4">
          {/* Self check-in toggle */}
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Check-in do Aluno</p>
              <p className="text-xs text-gray-500">Permita que alunos façam check-in via QR code.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={selfCheckin}
              onClick={() => setSelfCheckin(!selfCheckin)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                selfCheckin ? "bg-brand-500" : "bg-white/12"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  selfCheckin ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {/* Student portal toggle */}
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Portal do Aluno</p>
              <p className="text-xs text-gray-500">Permita que alunos acessem e vejam seu progresso.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={studentPortal}
              onClick={() => setStudentPortal(!studentPortal)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                studentPortal ? "bg-brand-500" : "bg-white/12"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  studentPortal ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Bloqueio por inadimplência */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-100">Bloqueio por Inadimplência</h2>
        <p className="mb-4 text-xs text-gray-500">
          Bloqueia automaticamente o check-in (catraca/QR) e o portal do aluno quando houver pagamento em atraso.
        </p>
        <label htmlFor="block_days" className="mb-1.5 block text-sm font-medium text-gray-300">
          Bloquear após (dias de atraso)
        </label>
        <input
          id="block_days"
          type="number"
          min={0}
          max={365}
          value={blockDays}
          onChange={(e) => setBlockDays(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
          className="w-32 rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
        />
        <p className="mt-2 text-xs text-gray-600">
          {blockDays === 0
            ? "Bloqueio desativado — alunos podem treinar mesmo em atraso."
            : `Alunos com qualquer cobrança em atraso há ${blockDays} dia(s) ou mais não conseguirão fazer check-in.`}
        </p>
      </div>

      {/* PIX Configuration */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-100">Configurações de Pagamento PIX</h2>
        <p className="mb-4 text-xs text-gray-500">
          Configure o PIX para aceitar pagamentos dos alunos via QR code.
        </p>

        <div className="space-y-4">
          {/* Chave PIX */}
          <div>
            <label htmlFor="pix_key" className="mb-1.5 block text-sm font-medium text-gray-300">
              Chave PIX
            </label>
            <input
              id="pix_key"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
              placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
              maxLength={100}
            />
          </div>

          {/* Chave PIX Type */}
          <div>
            <label htmlFor="pix_key_type" className="mb-1.5 block text-sm font-medium text-gray-300">
              Tipo de Chave PIX
            </label>
            <select
              id="pix_key_type"
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value as typeof pixKeyType)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>

          {/* Cidade do Recebedor */}
          <div>
            <label htmlFor="merchant_city" className="mb-1.5 block text-sm font-medium text-gray-300">
              Cidade do Recebedor
            </label>
            <input
              id="merchant_city"
              type="text"
              value={merchantCity}
              onChange={(e) => setMerchantCity(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
              placeholder="São Paulo"
              maxLength={15}
            />
            <p className="mt-1 text-xs text-gray-600">Nome da cidade para o QR code PIX (máx. 15 caracteres).</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Configurações salvas.</span>
        )}
        {updateSettings.isError && (
          <span className="text-sm text-red-400">Falha ao salvar. Tente novamente.</span>
        )}
      </div>

      {/* Agenda Pública */}
      <PublicScheduleSection slug={initialData.slug} />
    </form>
  )
}

// ─── Agenda Pública Section ─────────────────────────────────────────────────

function PublicScheduleSection({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const scheduleUrl = `${typeof window !== "undefined" ? window.location.origin : "https://kumo.com"}/schedule?academy=${slug}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(scheduleUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // noop
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-100">Agenda Pública</h2>
      <p className="mb-4 text-xs text-gray-500">
        Compartilhe a agenda de aulas com alunos e visitantes. Sem necessidade de login.
      </p>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-400">
          <span className="block truncate">{scheduleUrl}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/8 hover:text-gray-100"
        >
          {copied ? "Copiado!" : "Copiar Link"}
        </button>
      </div>

      <a
        href={`/schedule?academy=${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400 transition-colors hover:text-brand-300"
      >
        Visualizar agenda
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  )
}
