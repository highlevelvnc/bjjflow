import type { Metadata } from "next"
import Link from "next/link"
import { Users, Dumbbell, Award } from "lucide-react"
import { createServerCaller } from "@/lib/trpc/server"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { AttendanceChart } from "@/components/dashboard/AttendanceChart"
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard"
import { PageWrapper, PageItem } from "@/components/ui/PageWrapper"
import { getLocale } from "@/lib/i18n"
import { getAppMessagesSync } from "@/lib/i18n/app-messages"

export const metadata: Metadata = {
  title: "Painel",
}

function timeAgoShort(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "ontem"
  if (days < 30) return `${days}d`
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export default async function DashboardPage() {
  const locale = await getLocale()
  const t = getAppMessagesSync(locale)
  const trpc = await createServerCaller()

  const [academy, counts, upcoming, atRisk, attendanceTrend, recentAnnouncements, overdueSummary, birthdays, weeklyTraining, recentTitles] = await Promise.all([
    trpc.academy.getCurrent(),
    trpc.member.getCounts(),
    trpc.session.listUpcoming({ limit: 5 }),
    trpc.member.getAtRisk().catch(() => [] as Awaited<ReturnType<typeof trpc.member.getAtRisk>>),
    trpc.member.getAttendanceTrend().catch(() => [] as { label: string; count: number }[]),
    trpc.announcement.list({ limit: 3, offset: 0 }).catch(() => ({ items: [] as { id: string; title: string; content: string; priority: string; published_at: string | null }[], total: 0 })),
    trpc.finance.overdueSummary().catch(() => ({ count: 0, totalAmount: 0 })),
    trpc.member.getBirthdays().catch(() => [] as { id: string; full_name: string; belt_rank: string; stripes: number; birth_date: string | null; avatar_url: string | null; day: number }[]),
    trpc.member.getWeeklyTraining().catch(() => [] as { id: string; full_name: string; belt_rank: string; stripes: number; count: number }[]),
    trpc.title.recent().catch(() => [] as { id: string; member_name: string; member_belt: string; title: string; competition: string; placement: string; date: string }[]),
  ])

  return (
    <PageWrapper>
      {/* Page header */}
      <PageItem>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Painel</p>
            <h1 className="mt-0.5 text-2xl font-bold text-white">{academy.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500 capitalize">
              Plano {academy.plan} · {academy.timezone}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Sistema ativo</span>
          </div>
        </div>
      </PageItem>

      {/* Animated Stat cards */}
      <PageItem>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnimatedStatCard label={t.dashboard.totalMembers ?? "Total"} value={counts.total} href="/app/members" icon={<Users className="h-4 w-4" />} color="brand" />
          <AnimatedStatCard label={t.dashboard.activeStudents ?? "Alunos"} value={counts.students} href="/app/members" icon={<Users className="h-4 w-4" />} color="emerald" />
          <AnimatedStatCard label={t.dashboard.instructors ?? "Instrutores"} value={counts.instructors} href="/app/members" icon={<Award className="h-4 w-4" />} color="cyan" />
          <AnimatedStatCard label={t.dashboard.admins ?? "Admins"} value={counts.admins} href="/app/members" icon={<Dumbbell className="h-4 w-4" />} color="amber" />
        </div>
      </PageItem>

      {/* Overdue payments alert (admin only) */}
      {overdueSummary.count > 0 && (
        <PageItem>
          <Link
            href="/app/analytics/finance"
            className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 px-5 py-4 transition-colors hover:border-red-500/30 hover:bg-red-950/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-400">
                {overdueSummary.count} pagamento{overdueSummary.count !== 1 ? "s" : ""} em atraso
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Total R${overdueSummary.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="shrink-0 text-xs text-gray-500">Ver detalhes →</span>
          </Link>
        </PageItem>
      )}

      <PageItem>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming sessions */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">{t.dashboard.upcomingSessions ?? "Próximas Aulas"}</h2>
            <Link href="/app/sessions" className="text-xs text-gray-500 hover:text-gray-300">
              Ver tudo →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500">Nenhuma aula agendada.</p>
              <Link
                href="/app/sessions"
                className="mt-2 inline-block text-sm text-gray-100 underline hover:no-underline"
              >
                Gerar aulas
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {upcoming.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/app/sessions/${session.id}/attendance`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/4"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white/8 text-center">
                      <span className="text-[10px] font-medium uppercase leading-none text-gray-500">
                        {new Date(session.date + "T00:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}
                      </span>
                      <span className="mt-0.5 text-lg font-semibold leading-none text-gray-100">
                        {new Date(session.date + "T00:00:00").getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">
                        {session.class?.name ?? "Class"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatTime(session.start_time)}–{formatTime(session.end_time)}
                        {session.class?.gi_type && (
                          <span className="ml-1 capitalize text-gray-600">
                            · {session.class.gi_type}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-100">
                        {session.attendance_count}
                      </span>
                      <p className="text-xs text-gray-600">presentes</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* At-risk students */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">{t.dashboard.atRiskStudents ?? "Alunos em Risco"}</h2>
            <Link href="/app/members" className="text-xs text-gray-500 hover:text-gray-300">
              Ver tudo →
            </Link>
          </div>

          {atRisk.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500">Nenhum aluno em risco detectado.</p>
              <p className="mt-1 text-xs text-gray-600">
                Requer ≥ 4 aulas nos últimos 30 dias.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {atRisk.map((student) => (
                <li key={student.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs font-bold text-red-400"
                    title={`${student.rate}% attendance`}
                  >
                    {student.rate}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">
                      {student.full_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <BeltBadge belt={student.belt_rank} stripes={student.stripes} />
                      <span className="text-xs text-gray-600">{student.reason}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </PageItem>

      {/* Attendance trend */}
      {attendanceTrend.length > 0 && (
        <PageItem>
        <section className="rounded-xl border border-white/8 bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-100">Frequência (Últimas 4 Semanas)</h2>
          <AttendanceChart weeks={attendanceTrend} />
        </section>
        </PageItem>
      )}

      {/* Recent Announcements */}
      {recentAnnouncements.items.length > 0 && (
        <PageItem>
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-100">Avisos Recentes</h2>
            <Link href="/app/announcements" className="text-xs text-gray-500 hover:text-gray-300">
              Ver tudo →
            </Link>
          </div>
          <ul className="divide-y divide-white/6">
            {recentAnnouncements.items.map((a) => {
              const dotColor =
                a.priority === "urgent"
                  ? "bg-red-500"
                  : a.priority === "important"
                    ? "bg-amber-500"
                    : "bg-gray-500"
              return (
                <li key={a.id}>
                  <Link
                    href="/app/announcements"
                    className="flex items-start gap-3 px-5 py-3 hover:bg-white/4"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-100">{a.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{a.content}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-600">
                      {a.published_at ? timeAgoShort(a.published_at) : ""}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
        </PageItem>
      )}

      {/* 3 new sections: Birthdays, Titles, Weekly Training */}
      <PageItem>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aniversariantes do mês */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-100">
              🎂 Aniversariantes do Mês
            </h2>
          </div>
          {birthdays.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-500">Nenhum aniversariante este mês.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {birthdays.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-xs font-bold text-pink-400">
                    {m.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{m.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{m.belt_rank} · {m.stripes} grau{m.stripes !== 1 ? "s" : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Títulos / Conquistas */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-100">
              🏆 Títulos
            </h2>
            <Link href="/app/titles" className="text-xs text-gray-500 hover:text-gray-300">
              Ver tudo →
            </Link>
          </div>
          {recentTitles.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-500">Nenhum título registrado.</p>
              <Link href="/app/titles/new" className="mt-1 inline-block text-sm text-brand-400 hover:text-brand-300">
                Registrar título →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {recentTitles.map((t) => {
                const medal = t.placement === "gold" ? "🥇" : t.placement === "silver" ? "🥈" : t.placement === "bronze" ? "🥉" : "🏅"
                return (
                  <li key={t.id} className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medal}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-100">{t.member_name}</p>
                        <p className="truncate text-xs text-gray-500">{t.title} · {t.competition}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Treinos na semana */}
        <section className="rounded-xl border border-white/8 bg-gray-900">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-gray-100">
              💪 Treinos na Semana
            </h2>
          </div>
          {weeklyTraining.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-500">Nenhum treino registrado esta semana.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {weeklyTraining.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.count >= 4 ? "bg-emerald-500/15 text-emerald-400"
                      : m.count >= 2 ? "bg-amber-500/15 text-amber-400"
                        : m.count > 0 ? "bg-blue-500/15 text-blue-400"
                          : "bg-white/8 text-gray-500"
                  }`}>
                    {m.count}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{m.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{m.belt_rank}</p>
                  </div>
                  <span className="text-xs text-gray-600">{m.count} {m.count === 1 ? "treino" : "treinos"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </PageItem>

      {/* Quick actions */}
      <PageItem>
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <h2 className="text-sm font-medium text-gray-100">{t.dashboard.quickActions ?? "Ações Rápidas"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/app/members/new"
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
          >
            {t.dashboard.addMember ?? "Adicionar Aluno"}
          </Link>
          <Link
            href="/app/classes/new"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            {t.dashboard.newClass ?? "Nova Turma"}
          </Link>
          <Link
            href="/app/sessions"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            {t.dashboard.viewSessions ?? "Ver Aulas"}
          </Link>
          <Link
            href="/app/members/invite"
            className="rounded-md border border-white/12 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/6 hover:text-gray-100"
          >
            {t.dashboard.inviteInstructor ?? "Convidar Instrutor"}
          </Link>
        </div>
      </div>
      </PageItem>
    </PageWrapper>
  )
}
