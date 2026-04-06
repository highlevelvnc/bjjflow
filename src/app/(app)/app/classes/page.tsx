import type { Metadata } from "next"
import Link from "next/link"
import { createServerCaller } from "@/lib/trpc/server"
import { EmptyState } from "@/components/ui/EmptyState"
import { ClassToggleButton } from "@/components/classes/ClassToggleButton"
import { Pencil } from "lucide-react"

export const metadata: Metadata = {
  title: "Turmas",
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const CLASS_TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  open_mat: "Open Mat",
  competition_prep: "Comp Prep",
  private: "Private",
  seminar: "Seminar",
  kids: "Kids",
}

const GI_TYPE_LABELS: Record<string, string> = {
  gi: "Gi",
  nogi: "No-Gi",
  both: "Gi + No-Gi",
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  if (h === undefined || m === undefined) return t
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

export default async function ClassesPage() {
  const trpc = await createServerCaller()
  const { items: classes } = await trpc.class.list({ activeOnly: false })

  const active = classes.filter((c) => c.is_active)
  const inactive = classes.filter((c) => !c.is_active)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Turmas</h1>
          <p className="mt-0.5 text-sm text-gray-500">{active.length} turma ativa{active.length !== 1 ? "es" : ""}</p>
        </div>
        <Link
          href="/app/classes/new"
          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
        >
          Nova Turma
        </Link>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          title="Nenhuma turma ainda"
          description="Crie seu primeiro modelo de turma para começar a agendar aulas."
          action={
            <Link
              href="/app/classes/new"
              className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400"
            >
              Nova Turma
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && <ClassGroup title="Active" classes={active} />}
          {inactive.length > 0 && <ClassGroup title="Inactive" classes={inactive} muted />}
        </div>
      )}
    </div>
  )
}

type ClassRow = Awaited<ReturnType<Awaited<ReturnType<typeof createServerCaller>>["class"]["list"]>>["items"][number]

function ClassGroup({ title, classes, muted }: { title: string; classes: ClassRow[]; muted?: boolean }) {
  return (
    <div>
      <h2 className={`mb-2 text-xs font-medium uppercase tracking-wide ${muted ? "text-gray-600" : "text-gray-500"}`}>
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
        <table className="min-w-full divide-y divide-white/8">
          <thead>
            <tr className="bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Turma</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Horário</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Capacidade</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {classes.map((cls) => (
              <tr key={cls.id} className={muted ? "opacity-50" : ""}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-100">{cls.name}</p>
                  {cls.room && <p className="text-xs text-gray-600">{cls.room}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {cls.day_of_week !== null ? (
                    <span>{DAY_LABELS[cls.day_of_week]} · {formatTime(cls.start_time)}–{formatTime(cls.end_time)}</span>
                  ) : (
                    <span className="text-gray-600">Sem horário</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-400">{CLASS_TYPE_LABELS[cls.class_type] ?? cls.class_type}</span>
                  <span className="ml-1 text-xs text-gray-600">· {GI_TYPE_LABELS[cls.gi_type] ?? cls.gi_type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{cls.max_students ?? "Ilimitado"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/app/classes/${cls.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/6 hover:text-gray-200"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Link>
                    <ClassToggleButton classId={cls.id} isActive={cls.is_active} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
