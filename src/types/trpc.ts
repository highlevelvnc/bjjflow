import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/server/trpc/root"

/**
 * Inferred input types for all tRPC procedures.
 * Use these in client components for type-safe mutation/query inputs.
 *
 * @example
 *   type CreateMemberInput = RouterInputs["member"]["create"]
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inferred output types for all tRPC procedures.
 * Use these for type-safe access to query results.
 *
 * @example
 *   type MemberListOutput = RouterOutputs["member"]["list"]
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>
