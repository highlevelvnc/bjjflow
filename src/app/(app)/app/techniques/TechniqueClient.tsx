"use client"

import { useMemo, useState } from "react"
import { trpc } from "@/lib/trpc/client"
import {
  BookOpen,
  Plus,
  Loader2,
  X,
  Search,
  Sparkles,
  ChevronRight,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import { BJJ_BASE_COUNT } from "@/lib/techniques/bjjBase"

// ─── Configurações visuais ──────────────────────────────────────────────

const BELT_META: Record<
  string,
  { label: string; chip: string; bar: string; sortOrder: number }
> = {
  white: {
    label: "Branca",
    chip: "bg-white/15 text-white border border-white/25",
    bar: "bg-white/80",
    sortOrder: 0,
  },
  blue: {
    label: "Azul",
    chip: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    bar: "bg-blue-500",
    sortOrder: 1,
  },
  purple: {
    label: "Roxa",
    chip: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    bar: "bg-purple-500",
    sortOrder: 2,
  },
  brown: {
    label: "Marrom",
    chip: "bg-amber-700/20 text-amber-400 border border-amber-700/40",
    bar: "bg-amber-700",
    sortOrder: 3,
  },
  black: {
    label: "Preta",
    chip: "bg-gray-700/40 text-gray-200 border border-gray-600/50",
    bar: "bg-gray-800",
    sortOrder: 4,
  },
}

const CATEGORY_META: Record<string, { color: string }> = {
  Finalização: { color: "text-rose-300 bg-rose-500/10 border border-rose-500/30" },
  Raspagem: { color: "text-emerald-300 bg-emerald-500/10 border border-emerald-500/30" },
  Passagem: { color: "text-sky-300 bg-sky-500/10 border border-sky-500/30" },
  "Defesa/Escape": { color: "text-amber-300 bg-amber-500/10 border border-amber-500/30" },
  Transição: { color: "text-violet-300 bg-violet-500/10 border border-violet-500/30" },
  Queda: { color: "text-orange-300 bg-orange-500/10 border border-orange-500/30" },
}

const CATEGORIES = [
  "Finalização",
  "Raspagem",
  "Passagem",
  "Defesa/Escape",
  "Transição",
  "Queda",
] as const

const POSITION_ORDER = [
  "Em Pé",
  "Guarda Fechada",
  "Guarda Aberta",
  "Guarda De La Riva",
  "Guarda Aranha",
  "Meia-Guarda",
  "Montada",
  "Pegada nas Costas",
  "100 Kilos",
  "Norte-Sul",
  "Joelho na Barriga",
  "Tartaruga",
] as const

type Technique = {
  id: string
  name: string
  description: string | null
  position: string
  category: string
  belt_level: string
  difficulty: number
  instructions: string | null
  key_points: string[] | null
  tags: string[]
}

// ─── Componente principal ──────────────────────────────────────────────

export function TechniqueClient() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [activePosition, setActivePosition] = useState<string>("Todas")
  const [activeCategory, setActiveCategory] = useState<string>("Todas")
  const [activeBelt, setActiveBelt] = useState<string>("Todas")
  const [detailId, setDetailId] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.technique.list.useQuery({})

  const seedMutation = trpc.technique.seedBjjBase.useMutation({
    onSuccess: () => {
      utils.technique.list.invalidate()
    },
  })

  const deleteMutation = trpc.technique.delete.useMutation({
    onSuccess: () => {
      utils.technique.list.invalidate()
      setDetailId(null)
    },
  })

  // Filtragem cliente — list já vem completa
  const filteredItems = useMemo(() => {
    const items = (data?.items ?? []) as Technique[]
    return items.filter((t) => {
      if (activePosition !== "Todas" && t.position !== activePosition) return false
      if (activeCategory !== "Todas" && t.category !== activeCategory) return false
      if (activeBelt !== "Todas" && t.belt_level !== activeBelt) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !t.name.toLowerCase().includes(q) &&
          !(t.description ?? "").toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [data, activePosition, activeCategory, activeBelt, search])

  // Agrupamento por posição respeitando a ordem canônica
  const grouped = useMemo(() => {
    const map = new Map<string, Technique[]>()
    for (const t of filteredItems) {
      if (!map.has(t.position)) map.set(t.position, [])
      map.get(t.position)!.push(t)
    }
    const order = POSITION_ORDER as readonly string[]
    return Array.from(map.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0])
      const bi = order.indexOf(b[0])
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [filteredItems])

  const detailItem = useMemo(
    () => (data?.items ?? []).find((t) => t.id === detailId) ?? null,
    [data, detailId],
  )

  const totalRaw = data?.total ?? 0
  const isEmpty = !isLoading && totalRaw === 0
  const filteredEmpty = !isLoading && totalRaw > 0 && filteredItems.length === 0

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 sm:text-2xl">
            Catálogo de Técnicas
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading
              ? "Carregando..."
              : `${totalRaw} ${totalRaw === 1 ? "técnica" : "técnicas"} no currículo da academia`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalRaw === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-200 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Importar base BJJ ({BJJ_BASE_COUNT})
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* ── Banner sucesso após seed ─────────────────────────────────── */}
      {seedMutation.data && seedMutation.data.inserted > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {seedMutation.data.inserted} técnicas importadas com sucesso
          {seedMutation.data.skipped > 0 && (
            <span className="text-emerald-400/70">
              {" "}
              ({seedMutation.data.skipped} já existiam)
            </span>
          )}
        </div>
      )}
      {seedMutation.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {seedMutation.error.message}
        </div>
      )}

      {/* ── Barra de busca + filtros de faixa ────────────────────────── */}
      {!isEmpty && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="w-full rounded-xl border border-white/8 bg-gray-900/80 py-2 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-600 backdrop-blur outline-none focus:border-brand-500/50"
              />
            </div>
            <BeltFilter value={activeBelt} onChange={setActiveBelt} />
          </div>

          {/* Tabs por posição */}
          <Tabs
            counts={data?.countsByPosition ?? {}}
            active={activePosition}
            onChange={setActivePosition}
          />

          {/* Tabs por categoria */}
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
        </div>
      )}

      {/* ── Conteúdo principal ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          onSeed={() => seedMutation.mutate()}
          isSeeding={seedMutation.isPending}
        />
      ) : filteredEmpty ? (
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">Nenhuma técnica encontrada</p>
          <p className="mt-1 text-xs text-gray-600">Ajuste os filtros ou a busca.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([position, items]) => (
            <PositionGroup
              key={position}
              position={position}
              items={items}
              onSelect={(id) => setDetailId(id)}
            />
          ))}
        </div>
      )}

      {/* ── Modal: detalhe ───────────────────────────────────────────── */}
      {detailItem && (
        <DetailModal
          item={detailItem as Technique}
          onClose={() => setDetailId(null)}
          onDelete={() => {
            if (confirm(`Remover "${detailItem.name}"?`)) {
              deleteMutation.mutate({ id: detailItem.id })
            }
          }}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* ── Modal: criar nova ────────────────────────────────────────── */}
      {showForm && (
        <CreateModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            utils.technique.list.invalidate()
          }}
        />
      )}
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────

function Tabs({
  counts,
  active,
  onChange,
}: {
  counts: Record<string, number>
  active: string
  onChange: (v: string) => void
}) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const positions = (POSITION_ORDER as readonly string[]).filter((p) => (counts[p] ?? 0) > 0)
  // técnicas sem posição canônica vão no final
  const others = Object.keys(counts).filter(
    (k) => !(POSITION_ORDER as readonly string[]).includes(k as never),
  )

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-1.5 pb-1">
        <Tab
          label="Todas"
          count={total}
          active={active === "Todas"}
          onClick={() => onChange("Todas")}
        />
        {positions.map((p) => (
          <Tab
            key={p}
            label={p}
            count={counts[p] ?? 0}
            active={active === p}
            onClick={() => onChange(p)}
          />
        ))}
        {others.map((p) => (
          <Tab
            key={p}
            label={p}
            count={counts[p] ?? 0}
            active={active === p}
            onClick={() => onChange(p)}
          />
        ))}
      </div>
    </div>
  )
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-brand-500/50 bg-brand-500/15 text-brand-200 shadow-sm shadow-brand-500/10"
          : "border-white/8 bg-gray-900/60 text-gray-400 hover:border-white/20 hover:text-gray-200"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
          active ? "bg-brand-500/30 text-brand-100" : "bg-white/10 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function CategoryFilter({
  active,
  onChange,
}: {
  active: string
  onChange: (v: string) => void
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-1.5">
        <button
          onClick={() => onChange("Todas")}
          className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
            active === "Todas"
              ? "bg-white/15 text-gray-100"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Todas categorias
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${
              active === c
                ? CATEGORY_META[c]?.color ?? "border-white/15 text-gray-200"
                : "border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

function BeltFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const belts = ["Todas", ...Object.keys(BELT_META)]
  return (
    <div className="inline-flex rounded-xl border border-white/8 bg-gray-900/80 p-1 backdrop-blur">
      {belts.map((b) => {
        const isActive = value === b
        const meta = BELT_META[b]
        const label = b === "Todas" ? "Todas" : meta?.label ?? b
        return (
          <button
            key={b}
            onClick={() => onChange(b)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
              isActive
                ? "bg-white/10 text-gray-100"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {meta && (
                <span className={`h-2 w-2 rounded-full ${meta.bar}`} aria-hidden />
              )}
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function PositionGroup({
  position,
  items,
  onSelect,
}: {
  position: string
  items: Technique[]
  onSelect: (id: string) => void
}) {
  // Ordena por categoria e depois faixa
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aCat = a.category.localeCompare(b.category)
      if (aCat !== 0) return aCat
      const ao = BELT_META[a.belt_level]?.sortOrder ?? 99
      const bo = BELT_META[b.belt_level]?.sortOrder ?? 99
      return ao - bo
    })
  }, [items])

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
          {position}
        </h2>
        <span className="text-[11px] text-gray-600">
          {items.length} {items.length === 1 ? "técnica" : "técnicas"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((t) => (
          <TechniqueCard key={t.id} item={t} onClick={() => onSelect(t.id)} />
        ))}
      </div>
    </section>
  )
}

function TechniqueCard({ item, onClick }: { item: Technique; onClick: () => void }) {
  const belt = BELT_META[item.belt_level] ?? BELT_META.white!
  const cat = CATEGORY_META[item.category]

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gray-900/70 p-4 text-left transition-all hover:border-white/15 hover:bg-gray-900/90"
    >
      {/* faixa colorida lateral */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${belt.bar}`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-100 group-hover:text-brand-200">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-300" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {cat && (
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
            {item.category}
          </span>
        )}
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${belt.chip}`}
        >
          {belt.label}
        </span>
        <DifficultyDots level={item.difficulty} />
      </div>
    </button>
  )
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="ml-auto flex items-center gap-0.5" title={`Dificuldade: ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-full ${
            i < level ? "bg-brand-400" : "bg-gray-700"
          }`}
        />
      ))}
    </span>
  )
}

function EmptyState({ onSeed, isSeeding }: { onSeed: () => void; isSeeding: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-gray-900/80 to-gray-950/40 p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
        <BookOpen className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-gray-100">Catálogo vazio</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        Importe a base completa do Jiu-Jitsu Brasileiro com {BJJ_BASE_COUNT} técnicas
        organizadas por posição, ou cadastre as suas manualmente.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          onClick={onSeed}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {isSeeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Importar base BJJ
        </button>
      </div>
      <p className="mt-3 text-[11px] text-gray-600">
        Inclui guarda fechada, meia-guarda, montada, costas, 100 kilos, finalizações,
        raspagens, defesas e mais.
      </p>
    </div>
  )
}

// ─── Modal de detalhe ────────────────────────────────────────────────

function DetailModal({
  item,
  onClose,
  onDelete,
  isDeleting,
}: {
  item: Technique
  onClose: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const belt = BELT_META[item.belt_level] ?? BELT_META.white!
  const cat = CATEGORY_META[item.category]

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/50 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/8 bg-gray-950/95 p-5 backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {item.position}
              </span>
              {cat && (
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
                  {item.category}
                </span>
              )}
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${belt.chip}`}>
                {belt.label}
              </span>
              <DifficultyDots level={item.difficulty} />
            </div>
            <h2 className="text-lg font-semibold text-gray-100">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-gray-400">{item.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {item.instructions && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Execução
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">
                {item.instructions}
              </p>
            </section>
          )}

          {item.key_points && item.key_points.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pontos-chave
              </h3>
              <ul className="space-y-1.5">
                {item.key_points.map((kp, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                    {kp}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {item.tags && item.tags.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-white/8 bg-gray-950/95 px-5 py-3 backdrop-blur">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Remover
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/12"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de criação ────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    position: POSITION_ORDER[1] as string, // Guarda Fechada como padrão
    category: CATEGORIES[0] as string, // Finalização
    belt_level: "white",
    difficulty: 1,
    instructions: "",
    key_points: "",
  })

  const createMutation = trpc.technique.create.useMutation({
    onSuccess: () => onCreated(),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const keyPointsArr = form.key_points
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      position: form.position,
      category: form.category,
      belt_level: form.belt_level as "white" | "blue" | "purple" | "brown" | "black",
      difficulty: form.difficulty,
      instructions: form.instructions || undefined,
      key_points: keyPointsArr.length > 0 ? keyPointsArr : undefined,
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
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-950 shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-gray-950/95 p-5 backdrop-blur">
          <h2 className="text-base font-semibold text-gray-100">Nova Técnica</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Nome">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Triângulo da Guarda Fechada"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Posição">
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
              >
                {POSITION_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Faixa">
              <select
                value={form.belt_level}
                onChange={(e) => setForm({ ...form, belt_level: e.target.value })}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
              >
                {Object.entries(BELT_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dificuldade (1-5)">
              <input
                type="number"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: Number(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-brand-500/50"
              />
            </Field>
          </div>

          <Field label="Descrição curta">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Resumo de uma linha sobre a técnica..."
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            />
          </Field>

          <Field label="Execução (passo a passo)">
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={4}
              placeholder="Descreva a execução em sequência..."
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            />
          </Field>

          <Field label="Pontos-chave (um por linha)">
            <textarea
              value={form.key_points}
              onChange={(e) => setForm({ ...form, key_points: e.target.value })}
              rows={4}
              placeholder={"Quebrar a postura primeiro\nUm braço dentro, um fora\nAjustar o ângulo"}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-brand-500/50"
            />
          </Field>

          {createMutation.error && (
            <p className="text-xs text-red-400">{createMutation.error.message}</p>
          )}
        </form>

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
            disabled={createMutation.isPending || !form.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar técnica
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}
