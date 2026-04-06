"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import { ArrowLeft, Loader2 } from "lucide-react"

const EVENT_TYPES = [
  { value: "seminar", label: "Seminário", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "competition", label: "Competição", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "social", label: "Social", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "workshop", label: "Workshop", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "other", label: "Outro", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
] as const

type EventType = "seminar" | "competition" | "social" | "workshop" | "other"

export function EventForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "other" as EventType,
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    is_public: false,
    max_participants: "",
    registration_required: false,
  })

  const createMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      router.push("/app/events")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      location: form.location || undefined,
      is_public: form.is_public,
      max_participants: form.max_participants ? parseInt(form.max_participants, 10) : undefined,
      registration_required: form.registration_required,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/events"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Novo Evento</h1>
          <p className="mt-0.5 text-sm text-gray-500">Criar um novo evento da academia</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        {/* Event type */}
        <div>
          <label className="mb-2 block text-xs text-gray-500">Tipo de Evento</label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, event_type: type.value })}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                  form.event_type === type.value
                    ? type.color
                    : "border-white/8 bg-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs text-gray-500">Título *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            placeholder="e.g. Spring Open Mat"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs text-gray-500">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            rows={3}
            placeholder="Detalhes do evento..."
          />
        </div>

        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Data de Início *</label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Data de Término</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* Times */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Hora de Início</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Hora de Término</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-xs text-gray-500">Local</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            placeholder="e.g. Academy Main Room, Arena XYZ"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
            />
            Evento público
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.registration_required}
              onChange={(e) => setForm({ ...form, registration_required: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
            />
            Inscrição obrigatória
          </label>
        </div>

        {/* Max participants */}
        {form.registration_required && (
          <div>
            <label className="mb-1 block text-xs text-gray-500">Máximo de Participantes</label>
            <input
              type="number"
              min="1"
              value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
              placeholder="Deixe vazio para ilimitado"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/app/events"
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
            Criar Evento
          </button>
        </div>
        {createMutation.error && (
          <p className="text-xs text-red-400">{createMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}
