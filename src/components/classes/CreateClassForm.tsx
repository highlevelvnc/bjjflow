"use client"

/**
 * CreateClassForm — Simplified "quick create" flow.
 *
 * The old version had 12 stacked fields and used native <select> dropdowns.
 * It was slow, intimidating, and had a macOS rendering bug where the
 * option text became invisible (dark text class cascaded into the native
 * option menu, making options white-on-white).
 *
 * The new version:
 *   • Name + visual pill buttons for class type (no <select>)
 *   • Day-of-week chip row (Dom..Sáb) — instant tap-to-select
 *   • Two time inputs with smart default (18:00 – 19:00)
 *   • Gi / NoGi / Ambos as a segmented control
 *   • All the "advanced" stuff (description, room, instructor, max students,
 *     belt filter) is hidden behind a collapsible "Opções avançadas" panel
 *     that nobody needs for the normal case.
 *
 * Result: a teacher can create a class in ~15 seconds, tapping ~6 times.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  GraduationCap,
  Loader2,
  Plus,
  Settings2,
  Shirt,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  BELT_LABELS,
  KIDS_BELT_ORDER,
  ADULT_PROMOTION_BELTS,
} from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"

const DAY_OPTIONS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
]

const CLASS_TYPE_OPTIONS = [
  { value: "regular", label: "Regular", emoji: "🥋" },
  { value: "kids", label: "Kids", emoji: "🧒" },
  { value: "open_mat", label: "Open Mat", emoji: "🤝" },
  { value: "competition_prep", label: "Competição", emoji: "🏆" },
  { value: "private", label: "Particular", emoji: "👤" },
  { value: "seminar", label: "Seminário", emoji: "🎓" },
] as const

const GI_TYPE_OPTIONS = [
  { value: "gi", label: "Kimono" },
  { value: "nogi", label: "Sem Kimono" },
  { value: "both", label: "Ambos" },
] as const

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
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    class_type: "regular" as (typeof CLASS_TYPE_OPTIONS)[number]["value"],
    gi_type: "gi" as (typeof GI_TYPE_OPTIONS)[number]["value"],
    day_of_week: null as number | null,
    start_time: "18:00",
    end_time: "19:00",
    max_students: "" as string,
    default_instructor_id: "" as string,
    belt_level_min: "" as string,
    belt_level_max: "" as string,
    room: "",
  })

  const createClass = trpc.class.create.useMutation({
    onSuccess: () => {
      router.push("/app/classes")
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * Belt-range filter options track the class type:
   *   • Kids classes show the 13 IBJJF kids belts
   *   • Everything else shows white→black (the 5 adult promotion belts)
   *
   * This is computed each render rather than stored in state so the
   * dropdown always reflects the current class_type without an effect.
   */
  const beltRangeOptions: readonly Belt[] =
    form.class_type === "kids" ? KIDS_BELT_ORDER : ADULT_PROMOTION_BELTS

  /**
   * Switching class type can leave a previously-selected belt in the
   * filter that no longer exists in the new track (e.g. picked "purple"
   * for a regular class, then switched to "kids"). Clear both bounds
   * whenever the type changes — instructors rarely keep belt limits
   * when switching anyway.
   */
  function handleClassTypeChange(
    next: (typeof CLASS_TYPE_OPTIONS)[number]["value"],
  ) {
    setForm((prev) => ({
      ...prev,
      class_type: next,
      belt_level_min: prev.class_type === next ? prev.belt_level_min : "",
      belt_level_max: prev.class_type === next ? prev.belt_level_max : "",
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Dê um nome para a turma (mínimo 2 caracteres).")
      return
    }
    if (form.start_time >= form.end_time) {
      setError("O horário de término precisa ser depois do início.")
      return
    }

    createClass.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      class_type: form.class_type,
      gi_type: form.gi_type,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      is_recurring: true,
      max_students:
        form.max_students !== "" ? Number(form.max_students) : null,
      default_instructor_id: form.default_instructor_id || null,
      belt_level_min: (form.belt_level_min || null) as Belt | null,
      belt_level_max: (form.belt_level_max || null) as Belt | null,
      room: form.room.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── Nome ────────────────────────────────────────────────────────── */}
      <Field label="Nome da Turma" required icon={Sparkles}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Fundamentos, Avançado, Open Mat..."
          required
          minLength={2}
          maxLength={100}
          autoFocus
          className={inputClass}
        />
      </Field>

      {/* ── Tipo de Turma — pill buttons ────────────────────────────────── */}
      <Field label="Tipo de Turma" icon={Tag}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CLASS_TYPE_OPTIONS.map((o) => {
            const active = form.class_type === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => handleClassTypeChange(o.value)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all ${
                  active
                    ? "border-brand-400/50 bg-brand-500/15 text-brand-100 shadow-md shadow-brand-500/15"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-gray-100"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {o.emoji}
                </span>
                <span>{o.label}</span>
              </button>
            )
          })}
        </div>
      </Field>

      {/* ── Kimono segmented control ─────────────────────────────────────── */}
      <Field label="Tipo de Treino" icon={Shirt}>
        <div className="inline-flex w-full rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {GI_TYPE_OPTIONS.map((o) => {
            const active = form.gi_type === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => set("gi_type", o.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                    : "text-gray-400 hover:text-gray-100"
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </Field>

      {/* ── Dia da semana — chip row ─────────────────────────────────────── */}
      <Field
        label="Dia da Semana"
        icon={Calendar}
        hint="Deixe em branco se for sob demanda."
      >
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => {
            const active = form.day_of_week === d.value
            return (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  set("day_of_week", active ? null : d.value)
                }
                className={`h-10 min-w-[3rem] rounded-xl border px-3 text-sm font-semibold transition-all ${
                  active
                    ? "border-brand-400/50 bg-brand-500/15 text-brand-100 shadow-md shadow-brand-500/10"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-gray-100"
                }`}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </Field>

      {/* ── Horário ──────────────────────────────────────────────────────── */}
      <Field label="Horário" icon={Clock} required>
        <div className="grid grid-cols-2 gap-3">
          <label className="relative block">
            <span className="sr-only">Início</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              required
              className={inputClass}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              Início
            </span>
          </label>
          <label className="relative block">
            <span className="sr-only">Término</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
              required
              className={inputClass}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              Fim
            </span>
          </label>
        </div>
      </Field>

      {/* ── Advanced accordion ───────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-brand-300"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {showAdvanced ? "Ocultar opções avançadas" : "Opções avançadas"}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <Field label="Descrição">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Descrição opcional"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Instrutor Padrão" icon={GraduationCap}>
                <select
                  value={form.default_instructor_id}
                  onChange={(e) =>
                    set("default_instructor_id", e.target.value)
                  }
                  className={inputClass}
                >
                  <option
                    value=""
                    className="bg-gray-900 text-gray-100"
                  >
                    — Nenhum —
                  </option>
                  {instructors.map((i) => (
                    <option
                      key={i.id}
                      value={i.id}
                      className="bg-gray-900 text-gray-100"
                    >
                      {i.full_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Máx. de Alunos" icon={Users}>
                <input
                  type="number"
                  value={form.max_students}
                  onChange={(e) => set("max_students", e.target.value)}
                  min={1}
                  max={500}
                  placeholder="Sem limite"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Faixa Mínima">
                <select
                  value={form.belt_level_min}
                  onChange={(e) => set("belt_level_min", e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="bg-gray-900 text-gray-100">
                    — Qualquer —
                  </option>
                  {beltRangeOptions.map((b) => (
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

              <Field label="Faixa Máxima">
                <select
                  value={form.belt_level_max}
                  onChange={(e) => set("belt_level_max", e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="bg-gray-900 text-gray-100">
                    — Qualquer —
                  </option>
                  {beltRangeOptions.map((b) => (
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

            <Field label="Sala / Tatame">
              <input
                type="text"
                value={form.room}
                onChange={(e) => set("room", e.target.value)}
                placeholder="Tatame 1, Sala Principal..."
                maxLength={100}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={createClass.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 disabled:opacity-50"
        >
          {createClass.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Criar Turma
            </>
          )}
        </button>
        <a
          href="/app/classes"
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

// ─── Shared styles + Field helper ────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

function Field({
  label,
  required,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-500" />}
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="-mt-1 text-[11px] text-gray-600">{hint}</p>}
      {children}
    </div>
  )
}
