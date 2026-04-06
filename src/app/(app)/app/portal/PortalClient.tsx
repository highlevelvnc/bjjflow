"use client"

import { trpc } from "@/lib/trpc/client"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { BeltJourney } from "@/components/portal/BeltJourney"
import { ShareButton } from "@/components/portal/ShareButton"
import { TechniqueOfDay } from "@/components/portal/TechniqueOfDay"
import { StreakCard } from "@/components/portal/StreakCard"
import { ComparisonCard } from "@/components/portal/ComparisonCard"
import { Loader2, TrendingUp, Calendar, Award, Clock } from "lucide-react"

export function PortalClient() {
  const { data: profile, isLoading: loadingProfile } = trpc.portal.myProfile.useQuery()
  const { data: stats, isLoading: loadingStats } = trpc.portal.myStats.useQuery()
  const { data: history, isLoading: loadingHistory } = trpc.portal.myAttendance.useQuery({ limit: 20 })
  const { data: beltHistory } = trpc.portal.myBeltHistory.useQuery()

  if (loadingProfile || loadingStats) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      {profile && (
        <div className="flex items-center justify-between rounded-xl border border-white/8 bg-gray-900 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-lg font-bold text-brand-400">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">{profile.full_name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <BeltBadge belt={profile.belt_rank} stripes={profile.stripes} />
                <span className="text-xs capitalize text-gray-500">{profile.role}</span>
              </div>
            </div>
          </div>

          {/* Share button */}
          {stats && (
            <ShareButton
              name={profile.full_name}
              belt={profile.belt_rank}
              totalSessions={stats.totalAttendance}
            />
          )}
        </div>
      )}

      {/* Technique of the Day */}
      <TechniqueOfDay />

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="Total de Aulas"
            value={stats.totalAttendance}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Últimos 30 Dias"
            value={stats.last30Days}
          />
          <StatCard
            icon={<Award className="h-4 w-4" />}
            label="Taxa de Presença"
            value={`${stats.attendanceRate30}%`}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Últimos 90 Dias"
            value={stats.last90Days}
          />
        </div>
      )}

      {/* Streak & Comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StreakCard />
        <ComparisonCard />
      </div>

      {/* Belt Journey timeline */}
      {profile && stats && (
        <BeltJourney
          currentBelt={profile.belt_rank}
          currentStripes={profile.stripes}
          memberSince={stats.memberSince}
          memberId={profile.id}
          beltHistory={beltHistory ?? []}
        />
      )}

      {/* Recent attendance */}
      <div className="rounded-xl border border-white/8 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-medium text-gray-300">Presença Recente</h3>
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        ) : !history || history.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-600">Nenhum registro de presença ainda</p>
        ) : (
          <div className="space-y-2">
            {history.items.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-gray-200">{a.session?.class_name ?? "Session"}</p>
                  <p className="text-xs text-gray-500">
                    {a.session?.date
                      ? new Date(a.session.date).toLocaleDateString("pt-BR", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "Data desconhecida"}
                    {a.session?.start_time && ` \u00b7 ${a.session.start_time}`}
                    {a.session?.gi_type && (
                      <span className="ml-1 capitalize">\u00b7 {a.session.gi_type}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs capitalize text-gray-600">{a.check_in_method}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-100">{value}</p>
    </div>
  )
}
