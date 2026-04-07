"use client"

import { useState } from "react"
import { X, Loader2, Target, CheckCircle2, Trophy } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { MVP_TECHNIQUES } from "@/lib/techniques/mvp"

type EventType = "attempt" | "success" | "submission"

const EVENT_OPTIONS: {
  value: EventType
  label: string
  description: string
  icon: React.ElementType
  color: string
}[] = [
  {
    value: "attempt",
    label: "Tentativa",
    description: "Você tentou a técnica em um rolamento",
    icon: Target,
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  {
    value: "success",
    label: "Sucesso",
    description: "Você executou a técnica e ganhou a posição",
    icon: CheckCircle2,
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  {
    value: "submission",
    label: "Finalização",
    description: "Você finalizou o oponente com a técnica",
    icon: Trophy,
    color: "border-brand-500/40 bg-brand-500/10 text-brand-300",
  },
]

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function QuickLogModal({ open, onClose, onSaved }: Props) {
  const [slug, setSlug] = useState<string>(MVP_TECHNIQUES[0]!.slug)
  const [eventType, setEventType] = useState<EventType>("success")
  const [notes, setNotes] = useState("")

  const utils = trpc.useUtils()
  const logMutation = trpc.studentPerformance.logEvent.useMutation({
    onSuccess: () => {
      utils.studentPerformance.byTechnique.invalidate()
      utils.studentPerformance.summary.invalidate()
      utils.studentPerformance.recent.invalidate()
      setNotes("")
      onSaved()
    },
  })

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    logMutation.mutate({
      slug: slug as (typeof MVP_TECHNIQUES)[number]["slug"],
      eventType,
      notes: notes.trim() ? notes.trim() : undefined,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/50 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-gray-950/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Registrar treino</h2>
            <p className="text-xs text-gray-500">Marque uma técnica do seu rolamento</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          {/* Técnica */}
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Técnica
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MVP_TECHNIQUES.map((t) => {
                const isActive = slug === t.slug
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setSlug(t.slug)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-200 shadow-sm shadow-brand-500/20"
                        : "border-white/8 bg-white/5 text-gray-300 hover:border-white/15 hover:bg-white/8"
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tipo de evento */}
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Resultado
            </label>
            <div className="space-y-2">
              {EVENT_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isActive = eventType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEventType(opt.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                      isActive
                        ? opt.color
                        : "border-white/8 bg-white/5 text-gray-300 hover:border-white/15 hover:bg-white/8"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-white/10" : "bg-white/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-gray-500">{opt.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Observações <span className="text-gray-600">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Como foi a entrada? O que pode melhorar?"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            />
          </div>

          {logMutation.error && (
            <p className="text-xs text-red-400">{logMutation.error.message}</p>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-white/8 bg-gray-950/95 px-5 py-3 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={logMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-500/30 transition-colors hover:bg-brand-400 disabled:opacity-50"
          >
            {logMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar registro
          </button>
        </div>
      </div>
    </div>
  )
}
