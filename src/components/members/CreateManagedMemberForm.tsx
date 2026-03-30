"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { BELT_ORDER, BELT_LABELS } from "@/lib/constants/belts"

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
] as const

export function CreateManagedMemberForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "student" as "student" | "instructor",
    belt_rank: "white" as (typeof BELT_ORDER)[number],
    stripes: 0,
    phone: "",
    birth_date: "",
    notes: "",
  })

  const createMember = trpc.member.createManaged.useMutation({
    onSuccess: () => {
      router.push("/app/members")
      router.refresh()
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
      setError("Full name must be at least 2 characters.")
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Full name */}
      <Field label="Full Name" required>
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
      <Field label="Email" hint="Optional — needed to send a portal invite later">
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="joao@example.com"
          className={inputClass}
        />
      </Field>

      {/* Role + Belt in a row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Role" required>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value as "student" | "instructor")}
            className={inputClass}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Belt" required>
          <select
            value={form.belt_rank}
            onChange={(e) => set("belt_rank", e.target.value as (typeof BELT_ORDER)[number])}
            className={inputClass}
          >
            {BELT_ORDER.map((b) => (
              <option key={b} value={b}>
                {BELT_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Stripes */}
      <Field label="Stripes">
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
      <Field label="Phone">
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
      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Any notes about this member..."
          className={inputClass}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={createMember.isPending}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50"
        >
          {createMember.isPending ? "Creating..." : "Create Member"}
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
