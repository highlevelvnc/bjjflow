import "server-only"
import { router } from "../init"
import { protectedProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const gamificationRouter = router({
  leaderboard: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: members } = await supabase
      .from("members").select("id, full_name, belt_rank, stripes")
      .eq("academy_id", ctx.academyId!).eq("role", "student").eq("status", "active")

    const { data: attendance } = await supabase
      .from("attendance").select("member_id")
      .eq("academy_id", ctx.academyId!).gte("checked_in_at", thirtyDaysAgo)

    const counts = new Map<string, number>()
    for (const a of attendance ?? []) counts.set(a.member_id, (counts.get(a.member_id) ?? 0) + 1)

    return (members ?? [])
      .map((m) => ({ ...m, sessions: counts.get(m.id) ?? 0 }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20)
      .map((m, i) => ({ ...m, rank: i + 1 }))
  }),

  myRank: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: attendance } = await supabase
      .from("attendance").select("member_id")
      .eq("academy_id", ctx.academyId!).gte("checked_in_at", thirtyDaysAgo)

    const counts = new Map<string, number>()
    for (const a of attendance ?? []) counts.set(a.member_id, (counts.get(a.member_id) ?? 0) + 1)

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const myIdx = sorted.findIndex(([id]) => id === ctx.member!.id)

    return { rank: myIdx >= 0 ? myIdx + 1 : null, sessions: counts.get(ctx.member!.id) ?? 0, total: sorted.length }
  }),
})
