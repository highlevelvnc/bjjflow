"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Sparkles,
  Target,
  X,
  ListOrdered,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"

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

const CATEGORY_LABEL: Record<string, string> = {
  finalizacao: "Finalização",
  guarda: "Guarda",
  raspagem: "Raspagem",
  passagem: "Passagem",
  escape: "Escape",
  fundamento: "Fundamento",
}

interface LibraryEntry {
  id: string
  name: string
  summary: string
}

interface Props {
  techniqueId: string | null
  library: LibraryEntry[]
  onClose: () => void
  onOpenRelated: (id: string) => void
}

export function TechniqueDetailDrawer({
  techniqueId,
  library,
  onClose,
  onOpenRelated,
}: Props) {
  const isOpen = techniqueId !== null

  const { data, isLoading } = trpc.ai.byId.useQuery(
    { id: techniqueId ?? "" },
    { enabled: isOpen, staleTime: 60 * 60_000 },
  )

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Resolve related from library cache (no extra hooks)
  const relatedItems = (data?.related ?? [])
    .map((id) => library.find((l) => l.id === id))
    .filter((x): x is LibraryEntry => Boolean(x))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-hidden rounded-t-3xl border-t border-white/10 bg-gray-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <span className="h-1.5 w-12 rounded-full bg-white/15" />
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 backdrop-blur transition-colors hover:border-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content scroll */}
            <div className="max-h-[calc(92dvh-2rem)] overflow-y-auto px-5 pb-10 pt-2">
              {isLoading || !data ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <article className="mx-auto max-w-2xl">
                  {/* Hero */}
                  <header className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/15 via-gray-900 to-cyan-brand/5 p-5 shadow-lg shadow-brand-500/5">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl"
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/40">
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
                          {CATEGORY_LABEL[data.category] ?? data.category}
                        </p>
                      </div>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-50 sm:text-3xl">
                        {data.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">{data.position}</p>
                      <p className="mt-3 text-sm leading-relaxed text-gray-300">
                        {data.summary}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BELT_TONE[data.belt]}`}
                        >
                          {BELT_LABEL[data.belt]}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                          Nível
                          <span className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`h-1 w-1 rounded-full ${
                                  i < data.difficulty
                                    ? "bg-brand-400"
                                    : "bg-white/15"
                                }`}
                              />
                            ))}
                          </span>
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* Steps */}
                  <Section icon={ListOrdered} title="Passo a passo" tone="brand">
                    <ol className="space-y-2.5">
                      {data.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-3"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-200 ring-1 ring-brand-400/30">
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-gray-200">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </Section>

                  {/* Key points */}
                  <Section icon={Target} title="Pontos-chave" tone="emerald">
                    <ul className="space-y-2">
                      {data.keyPoints.map((p, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <p className="text-sm leading-relaxed text-gray-200">
                            {p}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Common mistakes */}
                  <Section
                    icon={AlertTriangle}
                    title="Erros comuns"
                    tone="amber"
                  >
                    <ul className="space-y-2">
                      {data.commonMistakes.map((p, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <p className="text-sm leading-relaxed text-gray-200">
                            {p}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Drill */}
                  <Section icon={Dumbbell} title="Drill sugerido" tone="cyan">
                    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-3.5">
                      <p className="text-sm leading-relaxed text-gray-200">
                        {data.drill}
                      </p>
                    </div>
                  </Section>

                  {/* Tags */}
                  {data.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {data.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-gray-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Related */}
                  {relatedItems.length > 0 && (
                    <Section
                      icon={Sparkles}
                      title="Combina com"
                      tone="violet"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {relatedItems.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onOpenRelated(r.id)}
                            className="group rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-violet-500/5"
                          >
                            <p className="text-sm font-semibold text-gray-100">
                              {r.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                              {r.summary}
                            </p>
                          </button>
                        ))}
                      </div>
                    </Section>
                  )}
                </article>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const TONE_ICON: Record<string, string> = {
  brand: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
}

function Section({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ElementType
  title: string
  tone: keyof typeof TONE_ICON
  children: React.ReactNode
}) {
  return (
    <section className="mt-5">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-xl ring-1 ${TONE_ICON[tone]}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
      </div>
      {children}
    </section>
  )
}
