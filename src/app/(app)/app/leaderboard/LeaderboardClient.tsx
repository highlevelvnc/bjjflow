"use client"
import { trpc } from "@/lib/trpc/client"
import { BeltBadge } from "@/components/ui/BeltBadge"
import { Loader2, Trophy, Medal } from "lucide-react"

const MEDAL = ["🥇", "🥈", "🥉"]

export function LeaderboardClient() {
  const { data: board, isLoading } = trpc.gamification.leaderboard.useQuery()
  const { data: myRank } = trpc.gamification.myRank.useQuery()

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h1 className="text-xl font-semibold text-gray-100">Leaderboard</h1>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {myRank && myRank.rank && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-center">
          <p className="text-sm text-gray-400">Your rank</p>
          <p className="text-3xl font-black text-brand-400">#{myRank.rank}</p>
          <p className="text-xs text-gray-500">{myRank.sessions} aulas this month</p>
        </div>
      )}

      {/* Top 3 podium */}
      {board && board.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const m = board[idx]!
            const isFirst = idx === 0
            return (
              <div key={m.id} className={`rounded-xl border p-4 text-center ${isFirst ? "border-yellow-500/30 bg-yellow-500/5 scale-105" : "border-white/8 bg-gray-900"}`}>
                <div className="text-2xl">{MEDAL[idx]}</div>
                <p className="mt-1 truncate text-sm font-medium text-gray-100">{m.full_name}</p>
                <BeltBadge belt={m.belt_rank} stripes={m.stripes} />
                <p className="mt-1 text-lg font-bold text-gray-100">{m.sessions}</p>
                <p className="text-xs text-gray-500">aulas</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      {board && board.length > 3 && (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-gray-900">
          <table className="min-w-full divide-y divide-white/8">
            <thead><tr className="bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Belt</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Sessions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/6">
              {board.slice(3).map((m) => (
                <tr key={m.id} className={m.id === myRank?.rank?.toString() ? "bg-brand-500/5" : "hover:bg-white/3"}>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.rank}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-100">{m.full_name}</td>
                  <td className="px-4 py-3"><BeltBadge belt={m.belt_rank} stripes={m.stripes} /></td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-100">{m.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!board || board.length === 0) && (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
          <Medal className="mx-auto mb-2 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-500">No attendance data yet. Start training!</p>
        </div>
      )}
    </div>
  )
}
