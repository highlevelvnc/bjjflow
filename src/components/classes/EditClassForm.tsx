"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { BELT_ORDER, BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

const CLASS_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "open_mat", label: "Open Mat" },
  { value: "competition_prep", label: "Competition Prep" },
  { value: "private", label: "Private" },
  { value: "seminar", label: "Seminar" },
  { value: "kids", label: "Kids" },
]

const GI_TYPE_OPTIONS = [
  { value: "gi", label: "Gi" },
  { value: "nogi", label: "No-Gi" },
  { value: "both", label: "Gi + No-Gi" },
]

interface Instructor {
  id: string
  full_name: string
}

interface ClassData {
  id: string
  name: string
  description: string | null
  class_type: string
  gi_type: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
  max_students: number | null
  default_instructor_id: string | null
  belt_level_min: string | null
  belt_level_max: string | null
  room: string | null
}

interface EditClassFormProps {
  classData: ClassData
  instructors: Instructor[]
}

export function EditClassForm({ classData, instructors }: EditClassFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: classData.name,
    description: classData.description ?? "",
    class_type: classData.class_type,
    gi_type: classData.gi_type,
    day_of_week: classData.day_of_week !== null ? String(classData.day_of_week) : "",
    start_time: classData.start_time,
    end_time: classData.end_time,
    max_students: classData.max_students !== null ? String(classData.max_students) : "",
    default_instructor_id: classData.default_instructor_id ?? "",
    belt_level_min: classData.belt_level_min ?? "",
    belt_level_max: classData.belt_level_max ?? "",
    room: classData.room ?? "",
  })

  const updateClass = trpc.class.update.useMutation({
    onSuccess: () => {
      setError(null)
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Class name must be at least 2 characters.")
      return
    }
    if (form.start_time >= form.end_time) {
      setError("End time must be after start time.")
      return
    }

    updateClass.mutate({
      id: classData.id,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      class_type: form.class_type as "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids",
      gi_type: form.gi_type as "gi" | "nogi" | "both",
      day_of_week: form.day_of_week !== "" ? Number(form.day_of_week) : null,
      start_time: form.start_time,
      end_time: form.end_time,
      max_students: form.max_students !== "" ? Number(form.max_students) : null,
      default_instructor_id: form.default_instructor_id || null,
      belt_level_min: (form.belt_level_min || null) as Belt | null,
      belt_level_max: (form.belt_level_max || null) as Belt | null,
      room: form.room.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Class updated successfully.
        </div>
      )}

      <Field label="Nome da Turma" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Fundamentals, Advanced, Open Mat..."
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </Field>

      <Field label="Descrição">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Optional description"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de Turma" required>
          <select
            value={form.class_type}
            onChange={(e) => set("class_type", e.target.value)}
            className={inputClass}
          >
            {CLASS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de Treino" required>
          <select
            value={form.gi_type}
            onChange={(e) => set("gi_type", e.target.value)}
            className={inputClass}
          >
            {GI_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Day of Week">
          <select
            value={form.day_of_week}
            onChange={(e) => set("day_of_week", e.target.value)}
            className={inputClass}
          >
            <option value="">-- No schedule --</option>
            {DAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Horário de Início" required>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Horário de Término" required>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Default Instructor">
          <select
            value={form.default_instructor_id}
            onChange={(e) => set("default_instructor_id", e.target.value)}
            className={inputClass}
          >
            <option value="">-- None --</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.full_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Max Students">
          <input
            type="number"
            value={form.max_students}
            onChange={(e) => set("max_students", e.target.value)}
            min={1}
            max={500}
            placeholder="Unlimited"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Belt Level">
          <select
            value={form.belt_level_min}
            onChange={(e) => set("belt_level_min", e.target.value)}
            className={inputClass}
          >
            <option value="">-- Any --</option>
            {BELT_ORDER.slice(0, 5).map((b) => (
              <option key={b} value={b}>{BELT_LABELS[b]}</option>
            ))}
          </select>
        </Field>
        <Field label="Max Belt Level">
          <select
            value={form.belt_level_max}
            onChange={(e) => set("belt_level_max", e.target.value)}
            className={inputClass}
          >
            <option value="">-- Any --</option>
            {BELT_ORDER.slice(0, 5).map((b) => (
              <option key={b} value={b}>{BELT_LABELS[b]}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Room / Mat">
        <input
          type="text"
          value={form.room}
          onChange={(e) => set("room", e.target.value)}
          placeholder="Mat 1, Main Floor..."
          maxLength={100}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={updateClass.isPending}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50"
        >
          {updateClass.isPending ? "Salvando..." : "Salvar Alterações"}
        </button>
        <a href="/app/classes" className="text-sm text-gray-500 hover:text-gray-300">
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
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
