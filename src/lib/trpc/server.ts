import "server-only"
import { createCaller } from "@/server/trpc/root"
import { createTRPCContext } from "@/server/trpc/init"

/**
 * Server-side tRPC caller.
 *
 * Use in Server Components and Server Actions to call tRPC procedures
 * directly (no HTTP round-trip).
 *
 * @example
 *   const trpc = await createServerCaller()
 *   const academy = await trpc.academy.getCurrent()
 */
export async function createServerCaller() {
  const ctx = await createTRPCContext()
  return createCaller(ctx)
}
