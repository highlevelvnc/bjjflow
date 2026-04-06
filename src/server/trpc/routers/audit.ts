import "server-only"
import { z } from "zod"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

export const auditRouter = router({
  list: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
      resourceType: z.string().optional(),
      action: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      let query = supabase
        .from("audit_log")
        .select("id, actor_id, action, resource_type, resource_id, metadata, ip_address, created_at", { count: "exact", head: false })
        .eq("academy_id", ctx.academyId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (input?.resourceType) query = query.eq("resource_type", input.resourceType)
      if (input?.action) query = query.ilike("action", `%${input.action}%`)

      const { data, count, error } = await query
      if (error) throw new Error("Failed to fetch audit log")

      // Resolve actor names
      const actorIds = [...new Set((data ?? []).map((a) => a.actor_id).filter((id): id is string => id !== null))]
      let actorMap: Record<string, string> = {}
      if (actorIds.length > 0) {
        const { data: members } = await supabase.from("members").select("id, full_name").in("id", actorIds)
        if (members) actorMap = Object.fromEntries(members.map((m) => [m.id, m.full_name]))
      }

      const items = (data ?? []).map((a) => ({
        ...a,
        actor_name: a.actor_id ? actorMap[a.actor_id] ?? "Unknown" : "System",
      }))

      return { items, total: count ?? 0, limit, offset }
    }),
})
