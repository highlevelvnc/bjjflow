"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  Flame,
  Megaphone,
  Sparkles,
  Trophy,
  Activity,
  Clock,
  Pin,
  BookOpen,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { BillingBlockBanner } from "@/components/portal/BillingBlockBanner"
import { LeaderboardCard } from "@/components/aluno/LeaderboardCard"
import { XpHero } from "@/components/aluno/XpHero"
import { DailyMission } from "@/components/aluno/DailyMission"

const PLACEMENT_LABEL: Record<string, string> = {
  gold: "Ouro",
  silver: "Prata",
  bronze: "Bronze",
  "1st": "1º lugar",
  "2nd": "2º lugar",
  "3rd": "3º lugar",
}

export function AlunoHomeClient() {
  const profile = trpc.portal.myProfile.useQuery()
  const stats = trpc.portal.myStats.useQuery()
  const summary = trpc.studentPerformance.summary.useQuery()
  const nextSessions = trpc.portal.myNextSessions.useQuery({ limit: 3 })
  const announcements = trpc.portal.myAnnouncements.useQuery({ limit: 3 })
  const titles = trpc.portal.myTitles.useQuery()
  const dailyTechnique = trpc.ai.daily.useQuery(undefined, {
    staleTime: 60 * 60_000,
  })

  const firstName = profile.data?.full_name.split(" ")[0] ?? "Aluno"
  const streak = summary.data?.streak ?? 0
  const lastTitles = (titles.data ?? []).slice(0, 2)
  const last30 = stats.data?.last30Days ?? 0
  const rate30 = stats.data?.attendanceRate30 ?? 0

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.02 },
        },
      }}
    >
      {/* ── Billing alert (top) ─────────────────────────────────────────── */}
      <BillingBlockBanner />

      {/* ── Animated XP / level hero ────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <XpHero />
      </motion.div>

      {/* ── Missão do dia (gamified daily challenge) ────────────────────── */}
      <motion.div variants={fadeUp}>
        <DailyMission />
      </motion.div>

      {/* ── Hero / welcome card ─────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-brand-500/15 via-gray-900 to-gray-950 p-5 shadow-xl shadow-black/30"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-brand/20 blur-3xl"
        />

        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
            Hoje no tatame
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-100 sm:text-[28px]">
            Pronto pra treinar, {firstName}?
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Continue evoluindo. Pequenos detalhes, grandes resultados.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeroStat
              icon={Flame}
              tone="amber"
              value={streak.toString()}
              label={streak === 1 ? "dia em sequência" : "dias seguidos"}
            />
            <HeroStat
              icon={Activity}
              tone="brand"
              value={last30.toString()}
              label="treinos / 30d"
            />
            <HeroStat
              icon={Sparkles}
              tone="cyan"
              value={`${rate30}%`}
              label="presença"
            />
          </div>
        </div>
      </motion.section>

      {/* ── Técnica do dia (centerpiece) ────────────────────────────────── */}
      {dailyTechnique.data && (
        <motion.div variants={fadeUp}>
          <Link
            href="/aluno/aprender"
            className="group relative block overflow-hidden rounded-3xl border border-brand-500/25 bg-gradient-to-br from-brand-500/15 via-gray-900 to-cyan-brand/10 p-5 shadow-xl shadow-brand-500/10 transition-all hover:border-brand-400/40 hover:shadow-brand-500/20"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-brand/20 blur-3xl"
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
              <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-50 sm:text-2xl">
                {dailyTechnique.data.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-gray-300/90">
                {dailyTechnique.data.summary}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-200">
                Estudar agora
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="grid grid-cols-2 gap-3">
        <QuickAction
          href="/aluno/aprender"
          icon={BookOpen}
          title="Biblioteca BJJ"
          subtitle="30+ técnicas curadas"
          tone="brand"
        />
        <QuickAction
          href="/aluno/badges"
          icon={Sparkles}
          title="Coleção"
          subtitle="Badges + nível"
          tone="violet"
        />
        <QuickAction
          href="/aluno/ranking"
          icon={Crown}
          title="Ranking"
          subtitle="Top da academia"
          tone="amber"
        />
        <QuickAction
          href="/aluno/conquistas"
          icon={Trophy}
          title="Meus títulos"
          subtitle="Conquistas no campeonato"
          tone="amber"
        />
      </motion.section>

      {/* ── Próxima aula ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
      <SectionCard
        title="Próximas aulas"
        subtitle="Próximos 7 dias"
        icon={CalendarDays}
        href="/aluno/performance"
      >
        {nextSessions.isLoading ? (
          <SkeletonLines count={2} />
        ) : !nextSessions.data || nextSessions.data.length === 0 ? (
          <EmptyHint text="Nenhuma aula agendada nos próximos 7 dias." />
        ) : (
          <ul className="space-y-2">
            {nextSessions.data.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                    <span className="text-[9px] font-semibold uppercase">
                      {formatMonth(s.date)}
                    </span>
                    <span className="-mt-0.5 text-base font-bold leading-none">
                      {formatDay(s.date)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-100">
                      {s.className}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {s.startTime?.slice(0, 5)}
                        {s.endTime ? ` – ${s.endTime.slice(0, 5)}` : ""}
                      </span>
                      {s.giType && (
                        <span className="rounded-full border border-white/8 px-1.5 py-px text-[9px] uppercase">
                          {s.giType === "gi" ? "Kimono" : s.giType === "nogi" ? "Sem kimono" : "Ambos"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      </motion.div>

      {/* ── Ranking da academia (top 5 + minha posição) ─────────────────── */}
      <motion.div variants={fadeUp}>
        <LeaderboardCard />
      </motion.div>

      {/* ── Mural recente ───────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
      <SectionCard
        title="Mural"
        subtitle="Avisos da academia"
        icon={Megaphone}
        href="/aluno/mural"
      >
        {announcements.isLoading ? (
          <SkeletonLines count={2} />
        ) : !announcements.data || announcements.data.length === 0 ? (
          <EmptyHint text="Nenhum aviso recente." />
        ) : (
          <ul className="space-y-2">
            {announcements.data.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/6 bg-white/[0.03] p-3"
              >
                <div className="flex items-start gap-2">
                  {a.pinned && (
                    <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-100">
                        {a.title}
                      </h3>
                      <PriorityChip priority={a.priority} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                      {a.content}
                    </p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-wider text-gray-600">
                      {a.authorName} · {formatRelativeDate(a.publishedAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      </motion.div>

      {/* ── Últimos títulos ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
      <SectionCard
        title="Conquistas recentes"
        subtitle="Seus títulos"
        icon={Trophy}
        href="/aluno/conquistas"
      >
        {titles.isLoading ? (
          <SkeletonLines count={2} />
        ) : lastTitles.length === 0 ? (
          <EmptyHint text="Você ainda não tem títulos registrados. Quando vier o primeiro, ele aparece aqui!" />
        ) : (
          <ul className="space-y-2">
            {lastTitles.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-white/[0.02] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-100">
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {t.competition ?? "—"}
                      {t.placement && (
                        <>
                          {" · "}
                          <span className="text-amber-300">
                            {PLACEMENT_LABEL[t.placement] ?? t.placement}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-gray-600">
                  {t.date ? formatShortDate(t.date) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      </motion.div>

      {/* ── CTA Biblioteca ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/aluno/aprender"
          className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/20 via-brand-600/10 to-cyan-brand/10 p-4 shadow-lg shadow-brand-500/10 transition-all hover:border-brand-400/50"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/25 blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/25 text-brand-200 ring-1 ring-brand-400/40">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-300">
                Biblioteca BJJ Brasileiro
              </p>
              <p className="text-sm font-semibold text-gray-100">
                Mais de 30 técnicas curadas em PT-BR
              </p>
              <p className="text-xs text-gray-400">
                Passo a passo, drills e erros comuns. Tudo offline.
              </p>
            </div>
          </div>
          <ArrowRight className="relative h-5 w-5 shrink-0 text-brand-200 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

// ─── Animations ────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" as const } },
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function HeroStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType
  value: string
  label: string
  tone: "amber" | "brand" | "cyan"
}) {
  const toneCls = {
    amber: "text-amber-300 bg-amber-500/15 ring-amber-400/30",
    brand: "text-brand-300 bg-brand-500/15 ring-brand-400/30",
    cyan: "text-cyan-300 bg-cyan-500/15 ring-cyan-400/30",
  }[tone]

  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-2.5 backdrop-blur">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${toneCls}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1.5 text-lg font-bold leading-none text-gray-100">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-gray-500">{label}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  href: string
  icon: React.ElementType
  title: string
  subtitle: string
  tone: "brand" | "cyan" | "amber" | "violet"
}) {
  const toneCls = {
    brand: "from-brand-500/20 to-transparent text-brand-300 border-brand-500/20",
    cyan: "from-cyan-500/20 to-transparent text-cyan-300 border-cyan-500/20",
    amber: "from-amber-500/20 to-transparent text-amber-300 border-amber-500/20",
    violet: "from-violet-500/20 to-transparent text-violet-300 border-violet-500/20",
  }[tone]

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-2 rounded-2xl border bg-gradient-to-br p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${toneCls}`}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" />
        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-100">{title}</p>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
    </Link>
  )
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  href,
  children,
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  href?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-gray-900/60 p-4 shadow-md shadow-black/20 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-300">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            Ver tudo
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function PriorityChip({ priority }: { priority: string | null }) {
  if (!priority || priority === "normal") return null
  const map: Record<string, { label: string; cls: string }> = {
    important: {
      label: "Importante",
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    urgent: {
      label: "Urgente",
      cls: "border-red-500/30 bg-red-500/10 text-red-300",
    },
  }
  const meta = map[priority]
  if (!meta) return null
  return (
    <span
      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${meta.cls}`}
    >
      {meta.label}
    </span>
  )
}

function SkeletonLines({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
        />
      ))}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-gray-500">
      {text}
    </p>
  )
}

// ─── Date helpers (PT-BR, no extra deps) ──────────────────────────────────

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

function parseLocalDate(s: string | null | undefined): Date | null {
  if (!s) return null
  // Accepts "YYYY-MM-DD" or full ISO
  const datePart = s.length >= 10 ? s.slice(0, 10) : s
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatMonth(date: string): string {
  const d = parseLocalDate(date)
  if (!d) return ""
  return MONTHS_PT[d.getMonth()] ?? ""
}

function formatDay(date: string): string {
  const d = parseLocalDate(date)
  if (!d) return ""
  return d.getDate().toString().padStart(2, "0")
}

function formatShortDate(date: string): string {
  const d = parseLocalDate(date)
  if (!d) return ""
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `há ${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `há ${diffDay}d`
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`
}
