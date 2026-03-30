import "server-only"
import { initTRPC } from "@trpc/server"
import { cache } from "react"
import superjson from "superjson"
import { createServerSupabase } from "@/server/supabase/server"
import type { Database } from "@/types/database"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

export type TRPCContext = {
  /** Null when unauthenticated. */
  userId: string | null
  /** Null when unauthenticated or token has no app_metadata.academy_id. */
  academyId: string | null
  /**
   * The member row for userId in academyId.
   * Null when unauthenticated, no academy, or no active membership.
   */
  member: MemberRow | null
}

/**
 * Creates the tRPC request context.
 *
 * Wrapped in React.cache() so it runs once per request regardless of
 * how many tRPC procedures call it (de-duplicated per RSC request tree).
 *
 * Academy ID source: JWT app_metadata.academy_id ONLY.
 * We never read academy context from headers, query params, or request body.
 */
export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { userId: null, academyId: null, member: null }
  }

  // Academy ID must come from JWT — never trust client-supplied context.
  const academyId = (session.user.app_metadata?.academy_id as string | undefined) ?? null

  let member: MemberRow | null = null

  if (academyId) {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("academy_id", academyId)
      .eq("status", "active")
      .maybeSingle()

    member = data ?? null
  }

  return {
    userId: session.user.id,
    academyId,
    member,
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// tRPC instance
// ─────────────────────────────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const {
  router,
  procedure,
  middleware,
  createCallerFactory,
  mergeRouters,
} = t
