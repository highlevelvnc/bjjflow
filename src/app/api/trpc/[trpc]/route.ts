import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/trpc/root"
import { createTRPCContext } from "@/server/trpc/init"

/**
 * tRPC HTTP handler — proxies all /api/trpc/* requests to the root router.
 *
 * Uses the Fetch adapter (compatible with Next.js App Router Edge/Node runtime).
 * Context is created fresh per request via createTRPCContext (React.cache-wrapped).
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`[tRPC error] ${path ?? "<no-path>"}:`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }
