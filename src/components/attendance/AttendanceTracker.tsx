"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { RoleBadge } from "@/components/ui/RoleBadge"
import type { Role } from "@/types/auth"

// Plain prop types — no tRPC types leak across the server/client boundary.
export interface AttendanceMember {
  id: string
  full_name: string
  belt_rank: string
  stripes: number
  role: string
  avatar_url: string | null
}

export interface AttendanceRecord {
  id: string
  member_id: string
  checked_in_at: string
  check_in_method: string
}

interface Props {
  sessionId: string
  sessionStatus: string
  members: AttendanceMember[]
  initialAttendance: AttendanceRecord[]
}

export function AttendanceTracker({
  sessionId,
  sessionStatus,
  members,
  initialAttendance,
}: Props) {
  const [presentIds, setPresentIds] = useState<Set<string>>(
    () => new Set(initialAttendance.map((a) => a.member_id)),
  )
  // Track which member IDs are currently mutating for per-row loading state
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const mark = trpc.attendance.mark.useMutation({
    onSuccess: (data) => {
      setPresentIds((prev) => new Set([...prev, data.member_id]))
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(data.member_id)
        return next
      })
    },
    onError: (_err, vars) => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.memberId)
        return next
      })
    },
  })

  const unmark = trpc.attendance.unmark.useMutation({
    onSuccess: (_data, vars) => {
      setPresentIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.memberId)
        return next
      })
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.memberId)
        return next
      })
    },
    onError: (_err, vars) => {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(vars.memberId)
        return next
      })
    },
  })

  const isReadOnly = sessionStatus === "cancelled"

  function toggle(memberId: string) {
    if (isReadOnly || pendingIds.has(memberId)) return
    setPendingIds((prev) => new Set([...prev, memberId]))

    if (presentIds.has(memberId)) {
      unmark.mutate({ sessionId, memberId })
    } else {
      mark.mutate({ sessionId, memberId })
    }
  }

  const presentCount = presentIds.size
  const totalCount = members.length

  // Group: instructors/admins first, then students alphabetically
  const instructors = members.filter((m) => m.role !== "student")
  const students = members.filter((m) => m.role === "student")

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-gray-900 px-5 py-3">
        <div>
          <span className="text-2xl font-semibold text-gray-100">{presentCount}</span>
          <span className="ml-1 text-sm text-gray-500">/ {totalCount} present</span>
        </div>
        {isReadOnly && (
          <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-gray-500">
            Session cancelled — read-only
          </span>
        )}
        {sessionStatus === "completed" && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Session completed
          </span>
        )}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-300">No active members</p>
          <p className="mt-1 text-sm text-gray-500">Add members to start taking attendance.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          {instructors.length > 0 && (
            <MemberGroup
              label="Instructors & Staff"
              members={instructors}
              presentIds={presentIds}
              pendingIds={pendingIds}
              isReadOnly={isReadOnly}
              onToggle={toggle}
            />
          )}
          {students.length > 0 && (
            <MemberGroup
              label={`Students (${students.length})`}
              members={students}
              presentIds={presentIds}
              pendingIds={pendingIds}
              isReadOnly={isReadOnly}
              onToggle={toggle}
              bordered={instructors.length > 0}
            />
          )}
        </div>
      )}
    </div>
  )
}

function MemberGroup({
  label,
  members,
  presentIds,
  pendingIds,
  isReadOnly,
  onToggle,
  bordered,
}: {
  label: string
  members: AttendanceMember[]
  presentIds: Set<string>
  pendingIds: Set<string>
  isReadOnly: boolean
  onToggle: (id: string) => void
  bordered?: boolean
}) {
  return (
    <div className={bordered ? "border-t border-white/8" : undefined}>
      <div className="bg-gray-800/50 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <ul className="divide-y divide-white/6">
        {members.map((member) => {
          const isPresent = presentIds.has(member.id)
          const isPending = pendingIds.has(member.id)

          return (
            <li
              key={member.id}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/3 ${
                isPresent ? "bg-emerald-500/6" : ""
              }`}
            >
              {/* Avatar initials */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isPresent ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-gray-400"
                }`}
              >
                {member.full_name.charAt(0).toUpperCase()}
              </div>

              {/* Name + belt */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-100">{member.full_name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <BeltBadge belt={member.belt_rank} stripes={member.stripes} />
                  {member.role !== "student" && (
                    <RoleBadge role={member.role as Role} />
                  )}
                </div>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => onToggle(member.id)}
                disabled={isReadOnly || isPending}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  isPresent
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "border border-white/12 text-gray-400 hover:bg-white/6 hover:text-gray-200"
                }`}
              >
                {isPending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPresent ? (
                  "Present ✓"
                ) : (
                  "Mark Present"
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
