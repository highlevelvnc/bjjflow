"use client"

import { trpc } from "@/lib/trpc/client"
import { CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function CheckInClient() {
  const router = useRouter()
  const { data: sessions, isLoading } = trpc.checkin.todaySessions.useQuery()
  const checkin = trpc.checkin.selfCheckin.useMutation({
    onSuccess: () => router.refresh(),
  })

  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set())

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/3 px-6 py-12 text-center">
        <Clock className="mx-auto mb-3 h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-400">No sessions available today</p>
      </div>
    )
  }

  async function handleCheckin(sessionId: string) {
    try {
      await checkin.mutateAsync({ sessionId })
      setCheckedIn((prev) => new Set(prev).add(sessionId))
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const done = s.alreadyCheckedIn || checkedIn.has(s.id)
        return (
          <div
            key={s.id}
            className="flex items-center gap-4 rounded-xl border border-white/8 bg-gray-900 p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-100">
                {s.class?.name ?? "Session"}
              </p>
              <p className="text-xs text-gray-500">
                {s.start_time} – {s.end_time}
                {s.class?.gi_type && (
                  <span className="ml-2 capitalize">{s.class.gi_type}</span>
                )}
              </p>
            </div>

            {done ? (
              <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Checked in
              </div>
            ) : (
              <button
                onClick={() => handleCheckin(s.id)}
                disabled={checkin.isPending}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-400 disabled:opacity-50"
              >
                {checkin.isPending ? "..." : "Check In"}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
