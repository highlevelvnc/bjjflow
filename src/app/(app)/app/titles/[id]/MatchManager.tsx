"use client"

import { useState } from "react"
import { Loader2, Plus, Swords, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import {
  MatchTimeline,
  type CompetitionMatch,
  type MatchMethod,
  type MatchResult,
} from "@/components/aluno/MatchTimeline"

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 transition-all focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

const METHOD_OPTIONS: { value: MatchMethod; label: string }[] = [
  { value: "submission", label: "Finalização" },
  { value: "points", label: "Pontos" },
  { value: "advantage", label: "Vantagem" },
  { value: "penalty", label: "Punição" },
  { value: "decision", label: "Decisão" },
  { value: "dq", label: "Desclassificação" },
  { value: "wo", label: "W.O." },
]

const RESULT_OPTIONS: { value: MatchResult; label: string }[] = [
  { value: "win", label: "Vitória" },
  { value: "loss", label: "Derrota" },
  { value: "draw", label: "Empate" },
]

interface Props {
  titleId: string
}

export function MatchManager({ titleId }: Props) {
  const utils = trpc.useUtils()
  const matches = trpc.title.matchesFor.useQuery({ titleId })

  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchOrder, setMatchOrder] = useState(1)
  const [result, setResult] = useState<MatchResult>("win")
  const [method, setMethod] = useState<MatchMethod>("submission")
  const [submissionType, setSubmissionType] = useState("")
  const [pointsFor, setPointsFor] = useState("")
  const [pointsAgainst, setPointsAgainst] = useState("")
  const [advantagesFor, setAdvantagesFor] = useState("")
  const [advantagesAgainst, setAdvantagesAgainst] = useState("")
  const [finishTime, setFinishTime] = useState("")
  const [opponentName, setOpponentName] = useState("")
  const [opponentTeam, setOpponentTeam] = useState("")
  const [notes, setNotes] = useState("")

  const createMatch = trpc.title.createMatch.useMutation({
    onSuccess: () => {
      utils.title.matchesFor.invalidate({ titleId })
      utils.portal.myTitleMatches.invalidate()
      resetForm()
      setShowForm(false)
    },
    onError: (err) => setError(err.message),
  })

  const deleteMatch = trpc.title.deleteMatch.useMutation({
    onSuccess: () => {
      utils.title.matchesFor.invalidate({ titleId })
      utils.portal.myTitleMatches.invalidate()
    },
  })

  function resetForm() {
    setMatchOrder((matches.data?.length ?? 0) + 2)
    setResult("win")
    setMethod("submission")
    setSubmissionType("")
    setPointsFor("")
    setPointsAgainst("")
    setAdvantagesFor("")
    setAdvantagesAgainst("")
    setFinishTime("")
    setOpponentName("")
    setOpponentTeam("")
    setNotes("")
    setError(null)
  }

  function openForm() {
    setMatchOrder((matches.data?.length ?? 0) + 1)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      title_id: titleId,
      match_order: matchOrder,
      result,
      method,
      submission_type: submissionType.trim() || undefined,
      points_for: pointsFor === "" ? undefined : Number(pointsFor),
      points_against: pointsAgainst === "" ? undefined : Number(pointsAgainst),
      advantages_for: advantagesFor === "" ? undefined : Number(advantagesFor),
      advantages_against:
        advantagesAgainst === "" ? undefined : Number(advantagesAgainst),
      finish_time: finishTime.trim() || undefined,
      opponent_name: opponentName.trim() || undefined,
      opponent_team: opponentTeam.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    createMatch.mutate(payload)
  }

  const normalized: CompetitionMatch[] = (matches.data ?? []).map((r) => ({
    id: r.id,
    match_order: r.match_order,
    result: r.result as MatchResult,
    method: r.method as MatchMethod,
    submission_type: r.submission_type,
    points_for: r.points_for,
    points_against: r.points_against,
    advantages_for: r.advantages_for,
    advantages_against: r.advantages_against,
    finish_time: r.finish_time,
    opponent_name: r.opponent_name,
    opponent_team: r.opponent_team,
    notes: r.notes,
  }))

  return (
    <section className="rounded-2xl border border-white/8 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
            <Swords className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100">
              Súmula da campanha
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">
              Estilo Abu Dhabi · {normalized.length} luta
              {normalized.length !== 1 ? "s" : ""} registrada
              {normalized.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar luta
          </button>
        )}
      </div>

      {/* ── Loading / list ────────────────────────────────────────────── */}
      {matches.isLoading ? (
        <div className="flex justify-center py-6 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : normalized.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-gray-500">
          Nenhuma luta registrada ainda. Adicione cada combate para que o aluno
          veja a súmula completa do campeonato.
        </p>
      ) : (
        <>
          <MatchTimeline matches={normalized} />
          <ul className="mt-3 space-y-1">
            {normalized.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-1.5 text-[11px] text-gray-400"
              >
                <span>
                  Luta {m.match_order} — {m.result.toUpperCase()} via {m.method}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Excluir esta luta?")) {
                      deleteMatch.mutate({ id: m.id })
                    }
                  }}
                  className="rounded p-1 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  aria-label="Excluir luta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Form ───────────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-xl border border-brand-500/20 bg-brand-500/[0.04] p-4"
        >
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nº da luta">
              <input
                type="number"
                min={1}
                max={20}
                value={matchOrder}
                onChange={(e) => setMatchOrder(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Resultado">
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as MatchResult)}
                className={inputClass}
              >
                {RESULT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Como aconteceu">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as MatchMethod)}
                className={inputClass}
              >
                {METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {method === "submission" && (
            <Field label="Tipo de finalização">
              <input
                type="text"
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                placeholder="Ex: Mata-leão, Armlock, Triângulo"
                className={inputClass}
              />
            </Field>
          )}

          {(method === "points" || method === "advantage") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pontos (você × adversário)">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={pointsFor}
                    onChange={(e) => setPointsFor(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="text-gray-500">×</span>
                  <input
                    type="number"
                    min={0}
                    value={pointsAgainst}
                    onChange={(e) => setPointsAgainst(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </Field>
              <Field label="Vantagens (você × adversário)">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={advantagesFor}
                    onChange={(e) => setAdvantagesFor(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                  <span className="text-gray-500">×</span>
                  <input
                    type="number"
                    min={0}
                    value={advantagesAgainst}
                    onChange={(e) => setAdvantagesAgainst(e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </Field>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tempo do final">
              <input
                type="text"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
                placeholder="Ex: 2:14"
                className={inputClass}
              />
            </Field>
            <Field label="Adversário">
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Nome do oponente"
                className={inputClass}
              />
            </Field>
            <Field label="Equipe do adversário">
              <input
                type="text"
                value={opponentTeam}
                onChange={(e) => setOpponentTeam(e.target.value)}
                placeholder="Ex: Alliance, Atos"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notas técnicas">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalhes da luta — guarda usada, momento decisivo..."
              className={inputClass}
            />
          </Field>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={createMatch.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 disabled:opacity-60"
            >
              {createMatch.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Salvar luta
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}
