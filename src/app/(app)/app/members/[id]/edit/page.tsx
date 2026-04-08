import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerCaller } from "@/lib/trpc/server"
import { EditMemberForm } from "@/components/members/EditMemberForm"
import { StudentAccessCard } from "@/components/members/StudentAccessCard"
import { BELT_LABELS } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"
import { Award, CalendarDays, Clock, MapPin, Users } from "lucide-react"

export const metadata = { title: "Editar Aluno" }

const DAY_LABELS_PT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
}

const CLASS_TYPE_EMOJI: Record<string, string> = {
  regular: "🥋",
  kids: "🧒",
  open_mat: "🤝",
  competition_prep: "🏆",
  private: "👤",
  seminar: "🎓",
}

const CLASS_TYPE_LABEL_PT: Record<string, string> = {
  regular: "Regular",
  kids: "Kids",
  open_mat: "Open Mat",
  competition_prep: "Competição",
  private: "Particular",
  seminar: "Seminário",
}

/** Strips Postgres `time` seconds for display. */
function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t
}

/** "há X dias" relative date for the "última presença" line. */
function relativeDays(dateStr: string | null): string {
  if (!dateStr) return ""
  const then = new Date(dateStr).getTime()
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`
  if (days < 365) return `há ${Math.floor(days / 30)} meses`
  return `há ${Math.floor(days / 365)} anos`
}

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trpc = await createServerCaller()

  let member
  try {
    member = await trpc.member.getById({ id })
  } catch {
    notFound()
  }

  // Fetch the classes the student has actually attended. Wrapped in try
  // so a query failure here never blocks the rest of the edit page.
  let attendedClasses: Awaited<
    ReturnType<typeof trpc.member.getClassesAttended>
  > = []
  try {
    attendedClasses = await trpc.member.getClassesAttended({ memberId: id })
  } catch (err) {
    console.error("[edit/page] getClassesAttended failed:", err)
  }

  const beltLabel = BELT_LABELS[member.belt_rank as Belt] ?? member.belt_rank

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/app/members" className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Voltar aos alunos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">Editar Aluno</h1>
        <p className="mt-1 text-sm text-gray-500">Atualizar perfil de {member.full_name}</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-gray-900 p-6">
        <EditMemberForm member={member} />
      </div>

      {/* ── Turmas do aluno ─────────────────────────────────────────────
          Lists every class this student has attended, derived from the
          attendance log. There's no explicit enrollment table, so this
          IS the source of truth for "which classes does this student
          belong to". Sorted: most-attended first, inactive sink down. */}
      <div className="mt-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-400" />
            <h3 className="text-sm font-medium text-gray-300">
              Turmas de {member.full_name.split(" ")[0]}
            </h3>
          </div>
          {attendedClasses.length > 0 && (
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-300">
              {attendedClasses.length}{" "}
              {attendedClasses.length === 1 ? "turma" : "turmas"}
            </span>
          )}
        </div>

        {attendedClasses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/8 bg-white/[0.02] px-4 py-6 text-center">
            <p className="text-sm text-gray-400">
              Esse aluno ainda não tem presenças registradas em nenhuma turma.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Quando o aluno marcar presença em uma aula, ela aparece aqui automaticamente.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {attendedClasses.map((c) => {
              const dayLabel =
                c.day_of_week !== null && c.day_of_week !== undefined
                  ? DAY_LABELS_PT[c.day_of_week]
                  : null
              const emoji = CLASS_TYPE_EMOJI[c.class_type] ?? "🥋"
              const typeLabel = CLASS_TYPE_LABEL_PT[c.class_type] ?? c.class_type
              return (
                <li
                  key={c.id}
                  className={`group flex items-center gap-3 rounded-xl border bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05] ${
                    c.is_active
                      ? "border-white/10"
                      : "border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-base">
                    {emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/app/classes/${c.id}/edit`}
                        className="truncate text-sm font-semibold text-gray-100 hover:text-brand-300"
                      >
                        {c.name}
                      </Link>
                      {!c.is_active && (
                        <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          Inativa
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="text-gray-600">{typeLabel}</span>
                      {dayLabel && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {dayLabel}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmtTime(c.start_time)}–{fmtTime(c.end_time)}
                      </span>
                      {c.room && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-brand-300">
                      {c.attendance_count}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600">
                      {c.attendance_count === 1 ? "presença" : "presenças"}
                    </p>
                    {c.last_attended_at && (
                      <p className="mt-0.5 text-[10px] text-gray-600">
                        {relativeDays(c.last_attended_at)}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Acesso ao app do aluno */}
      {member.role === "student" && (
        <div className="mt-4">
          <StudentAccessCard
            member={{
              id: member.id,
              full_name: member.full_name,
              email: member.email,
              role: member.role,
              has_portal_access: member.has_portal_access ?? false,
            }}
          />
        </div>
      )}

      {/* Gerar Certificado */}
      <div className="mt-4 rounded-xl border border-white/8 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">Certificado</h3>
        <p className="mb-3 text-xs text-gray-500">
          Gerar certificado de graduação de {member.full_name} para a graduação atual ({beltLabel}).
        </p>
        <a
          href={`/api/certificate/${member.id}?belt=${encodeURIComponent(member.belt_rank)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3.5 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/6 hover:text-gray-200"
        >
          <Award className="h-4 w-4" />
          Gerar Certificado
        </a>
      </div>
    </div>
  )
}
