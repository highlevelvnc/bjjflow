"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trophy } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all focus:border-brand-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-brand-500/20"

interface Props {
  members: { id: string; full_name: string; belt_rank: string }[]
}

export function TitleForm({ members }: Props) {
  const router = useRouter()
  const [memberId, setMemberId] = useState("")
  const [title, setTitle] = useState("")
  const [competition, setCompetition] = useState("")
  const [category, setCategory] = useState("")
  const [weightClass, setWeightClass] = useState("")
  const [placement, setPlacement] = useState<"gold" | "silver" | "bronze" | "other">("gold")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]!)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const createTitle = trpc.title.create.useMutation({
    onSuccess: () => {
      router.push("/app/titles")
      router.refresh()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createTitle.mutate({
      member_id: memberId,
      title,
      competition,
      category: category || undefined,
      weight_class: weightClass || undefined,
      placement,
      date,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/8 bg-gray-900 p-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Aluno *</label>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Selecione o aluno</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} ({m.belt_rank})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Título *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Campeão Absoluto" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Competição *</label>
          <input type="text" value={competition} onChange={(e) => setCompetition(e.target.value)} required placeholder="Ex: CBJJ Regional RJ" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Categoria</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Adulto Faixa Azul" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Peso</label>
          <input type="text" value={weightClass} onChange={(e) => setWeightClass(e.target.value)} placeholder="Ex: Meio-pesado" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Colocação</label>
          <select value={placement} onChange={(e) => setPlacement(e.target.value as typeof placement)} className={inputClass}>
            <option value="gold">🥇 Ouro</option>
            <option value="silver">🥈 Prata</option>
            <option value="bronze">🥉 Bronze</option>
            <option value="other">🏅 Outro</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Data *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-400">Observações</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Detalhes adicionais..." className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={createTitle.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 disabled:opacity-60"
      >
        {createTitle.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
        ) : (
          <><Trophy className="h-4 w-4" /> Registrar Título</>
        )}
      </button>
    </form>
  )
}
