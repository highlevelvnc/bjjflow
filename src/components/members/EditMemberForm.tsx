"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import {
  BELT_LABELS,
  beltsForTrack,
  inferBeltTrack,
  type Belt,
  type BeltTrack,
} from "@/lib/constants/belts"

const ROLE_OPTIONS = [
  { value: "student", label: "Aluno" },
  { value: "instructor", label: "Instrutor" },
  { value: "admin", label: "Admin" },
] as const

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "suspended", label: "Suspended" },
] as const

interface Member {
  id: string
  full_name: string
  email: string | null
  role: "admin" | "instructor" | "student"
  status: "active" | "inactive" | "suspended"
  belt_rank: string
  stripes: number
  phone: string | null
  birth_date: string | null
  notes: string | null
}

export function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialise the toggle from the current belt — kids belts open the form
  // on "Infantil" automatically. White (track="both") falls back to "adult"
  // since the form's primary use case is adults.
  const [beltTrack, setBeltTrack] = useState<BeltTrack>(
    inferBeltTrack(member.belt_rank),
  )

  const [form, setForm] = useState({
    full_name: member.full_name,
    email: member.email ?? "",
    role: member.role,
    status: member.status,
    belt_rank: member.belt_rank as Belt,
    stripes: member.stripes,
    phone: member.phone ?? "",
    birth_date: member.birth_date ?? "",
    notes: member.notes ?? "",
  })

  function handleBeltTrackChange(next: BeltTrack) {
    setBeltTrack(next)
    const allowed = beltsForTrack(next)
    if (!allowed.includes(form.belt_rank)) {
      setForm((prev) => ({ ...prev, belt_rank: "white" }))
    }
  }

  const updateMember = trpc.member.update.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (form.full_name.trim().length < 2) {
      setError("Full name must be at least 2 characters.")
      return
    }

    updateMember.mutate({
      id: member.id,
      full_name: form.full_name.trim(),
      email: form.email.trim() || "",
      role: form.role,
      status: form.status,
      belt_rank: form.belt_rank,
      stripes: form.stripes,
      phone: form.phone.trim() || "",
      birth_date: form.birth_date || "",
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Member updated successfully
        </div>
      )}

      {/* Full name */}
      <Field label="Nome Completo" required>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </Field>

      {/* Email */}
      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="joao@example.com"
          className={inputClass}
        />
      </Field>

      {/* Role + Status */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Função" required>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value as Member["role"])}
            className={inputClass}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as Member["status"])}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Belt + Stripes */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Faixa" required>
          {/* Adulto / Infantil segmented control. Filters which belts the
              dropdown below shows. Inferred from the current belt on mount. */}
          <div className="mb-2 inline-flex w-full rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(["adult", "kids"] as const).map((track) => {
              const active = beltTrack === track
              const label = track === "adult" ? "Adulto" : "Infantil"
              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => handleBeltTrackChange(track)}
                  className={`flex-1 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
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
              <option key={b} value={b} className="bg-gray-900 text-gray-100">
                {BELT_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>

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
      </div>

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
      <Field label="Date of Birth">
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
          placeholder="Any notes..."
          className={inputClass}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={updateMember.isPending}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50"
        >
          {updateMember.isPending ? "Salvando..." : "Salvar Alterações"}
        </button>
        <a href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          Cancel
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
