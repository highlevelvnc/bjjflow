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

interface CreateClassFormProps {
  instructors: Instructor[]
}

export function CreateClassForm({ instructors }: CreateClassFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    class_type: "regular" as string,
    gi_type: "gi" as string,
    day_of_week: "" as string,
    start_time: "18:00",
    end_time: "19:00",
    is_recurring: true,
    max_students: "" as string,
    default_instructor_id: "" as string,
    belt_level_min: "" as string,
    belt_level_max: "" as string,
    room: "",
  })

  const createClass = trpc.class.create.useMutation({
    onSuccess: () => {
      router.push("/classes")
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function set<K extends keyof typeof form>(key: K, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Class name must be at least 2 characters.")
      return
    }
    if (form.start_time >= form.end_time) {
      setError("End time must be after start time.")
      return
    }

    createClass.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      class_type: form.class_type as "regular" | "open_mat" | "competition_prep" | "private" | "seminar" | "kids",
      gi_type: form.gi_type as "gi" | "nogi" | "both",
      day_of_week: form.day_of_week !== "" ? Number(form.day_of_week) : null,
      start_time: form.start_time,
      end_time: form.end_time,
      is_recurring: form.is_recurring,
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
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Field label="Class Name" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Fundamentals, Advanced, Open Mat…"
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
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
        <Field label="Class Type" required>
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
        <Field label="Gi Type" required>
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
            <option value="">— No schedule —</option>
            {DAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Start Time" required>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="End Time" required>
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
            <option value="">— None —</option>
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
            <option value="">— Any —</option>
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
            <option value="">— Any —</option>
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
          placeholder="Mat 1, Main Floor…"
          maxLength={100}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={createClass.isPending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {createClass.isPending ? "Creating..." : "Create Class"}
        </button>
        <a href="/classes" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
      </div>
    </form>
  )
}

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"

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
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
