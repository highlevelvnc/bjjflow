"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ChevronRight,
  Search,
  Sparkles,
  Shield,
  RotateCw,
  ArrowRightCircle,
  Target,
  LogOut,
  GraduationCap,
  X,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { TechniqueDetailDrawer } from "./TechniqueDetailDrawer"

type Category =
  | "guarda"
  | "raspagem"
  | "passagem"
  | "finalizacao"
  | "escape"
  | "fundamento"

const CATEGORY_UI: Record<
  Category,
  { label: string; icon: React.ElementType; tone: string }
> = {
  finalizacao: { label: "Finalização", icon: Target, tone: "rose" },
  guarda: { label: "Guarda", icon: Shield, tone: "brand" },
  raspagem: { label: "Raspagem", icon: RotateCw, tone: "cyan" },
  passagem: { label: "Passagem", icon: ArrowRightCircle, tone: "amber" },
  escape: { label: "Escape", icon: LogOut, tone: "violet" },
  fundamento: { label: "Fundamento", icon: GraduationCap, tone: "emerald" },
}

const TONE_CLASSES: Record<string, { chip: string; icon: string }> = {
  rose: {
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    icon: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  },
  brand: {
    chip: "border-brand-500/30 bg-brand-500/10 text-brand-300",
    icon: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  },
  cyan: {
    chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    icon: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  },
  amber: {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  },
  violet: {
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    icon: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  },
  emerald: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  },
}

const BELT_TONE: Record<string, string> = {
  white: "bg-white text-gray-900",
  blue: "bg-blue-600 text-white",
  purple: "bg-purple-600 text-white",
  brown: "bg-amber-800 text-white",
  black: "bg-gray-900 text-white ring-1 ring-white/15",
}

const BELT_LABEL: Record<string, string> = {
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
}

export function TechniqueExplorer() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const library = trpc.ai.library.useQuery(undefined, { staleTime: 60 * 60_000 })
  const daily = trpc.ai.daily.useQuery(undefined, { staleTime: 60 * 60_000 })
  const suggestions = trpc.ai.suggestions.useQuery(undefined, {
    staleTime: 60 * 60_000,
  })

  const filtered = useMemo(() => {
    if (!library.data) return []
    let list = library.data
    if (activeCategory !== "all") {
      list = list.filter((t) => t.category === activeCategory)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      const tokens = q
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter(Boolean)
      list = list
        .map((t) => {
          const hay = `${t.name} ${t.position} ${t.category} ${t.summary} ${t.tags.join(" ")}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
          const score = tokens.reduce(
            (acc, tok) => acc + (hay.includes(tok) ? 1 : 0),
            0,
          )
          return { ...t, _score: score }
        })
        .filter((t) => t._score > 0)
        .sort((a, b) => b._score - a._score)
    }
    return list
  }, [library.data, activeCategory, query])

  const totalByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of library.data ?? []) {
      counts[t.category] = (counts[t.category] ?? 0) + 1
    }
    return counts
  }, [library.data])

  return (
    <div className="space-y-5">
      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar técnica, posição ou tag…"
          className="w-full rounded-2xl border border-white/8 bg-gray-900/70 py-3 pl-10 pr-10 text-sm text-gray-100 placeholder:text-gray-600 shadow-inner shadow-black/20 backdrop-blur transition-colors focus:border-brand-400/50 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Sugestões (quando vazio) ────────────────────────────────────── */}
      {!query && activeCategory === "all" && suggestions.data && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.data.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setQuery(s.query)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:-translate-y-0.5 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-200"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Daily technique hero ─────────────────────────────────────── */}
      {!query && activeCategory === "all" && daily.data && (
        <button
          type="button"
          onClick={() => setOpenId(daily.data!.id)}
          className="group relative w-full overflow-hidden rounded-3xl border border-brand-500/25 bg-gradient-to-br from-brand-500/15 via-gray-900 to-cyan-brand/10 p-5 text-left shadow-xl shadow-brand-500/10 transition-all hover:border-brand-400/40 hover:shadow-brand-500/20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                Técnica do dia
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-50">
              {daily.data.name}
            </h2>
            <p className="mt-1 text-sm text-gray-300/90">
              {daily.data.summary}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CategoryChip category={daily.data.category as Category} />
              <BeltChip belt={daily.data.belt} />
              <DifficultyChip difficulty={daily.data.difficulty} />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-200">
              Estudar técnica
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </button>
      )}

      {/* ── Categorias ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryButton
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          label="Tudo"
          count={library.data?.length ?? 0}
        />
        {(Object.keys(CATEGORY_UI) as Category[]).map((cat) => (
          <CategoryButton
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            label={CATEGORY_UI[cat].label}
            icon={CATEGORY_UI[cat].icon}
            tone={CATEGORY_UI[cat].tone}
            count={totalByCategory[cat] ?? 0}
          />
        ))}
      </div>

      {/* ── Resultados ──────────────────────────────────────────────────── */}
      {library.isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyResults onReset={() => setQuery("")} />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => {
              const cat = CATEGORY_UI[t.category as Category]
              const tone = TONE_CLASSES[cat.tone]!
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(t.id)}
                    className="group w-full rounded-2xl border border-white/8 bg-gray-900/60 p-3.5 text-left shadow-md shadow-black/20 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-400/30 hover:bg-gray-900/80"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${tone.icon}`}
                      >
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-100">
                            {t.name}
                          </h3>
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-300" />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                          {t.position}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-gray-400">
                          {t.summary}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${BELT_TONE[t.belt]}`}
                          >
                            {BELT_LABEL[t.belt]}
                          </span>
                          <DifficultyDots difficulty={t.difficulty} />
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* ── Drawer de detalhe ───────────────────────────────────────────── */}
      <TechniqueDetailDrawer
        techniqueId={openId}
        library={library.data ?? []}
        onClose={() => setOpenId(null)}
        onOpenRelated={(id) => setOpenId(id)}
      />
    </div>
  )
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function CategoryButton({
  active,
  onClick,
  label,
  icon: Icon,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ElementType
  tone?: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-brand-400/40 bg-brand-500/15 text-brand-200 shadow-md shadow-brand-500/10"
          : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-gray-100"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span
        className={`rounded-full px-1.5 py-px text-[9px] font-bold ${
          active ? "bg-brand-500/30 text-brand-100" : "bg-white/5 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function CategoryChip({ category }: { category: Category }) {
  const meta = CATEGORY_UI[category]
  const tone = TONE_CLASSES[meta.tone]!
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
    >
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

function BeltChip({ belt }: { belt: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BELT_TONE[belt]}`}
    >
      {BELT_LABEL[belt] ?? belt}
    </span>
  )
}

function DifficultyChip({ difficulty }: { difficulty: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
      Nível
      <DifficultyDots difficulty={difficulty} />
    </span>
  )
}

function DifficultyDots({ difficulty }: { difficulty: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-full ${
            i < difficulty ? "bg-brand-400" : "bg-white/15"
          }`}
        />
      ))}
    </span>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
        />
      ))}
    </div>
  )
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
        <Search className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-gray-200">Nenhuma técnica encontrada</p>
      <p className="mt-1 max-w-xs text-xs text-gray-500">
        Tente termos como &ldquo;triângulo&rdquo;, &ldquo;passagem&rdquo; ou &ldquo;escape do 100 kilos&rdquo;.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-white/20 hover:text-gray-100"
      >
        Limpar busca
      </button>
    </div>
  )
}
