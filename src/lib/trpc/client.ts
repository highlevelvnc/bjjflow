"use client"

import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/server/trpc/root"

/**
 * Type-safe tRPC React client.
 *
 * Use this in Client Components via the TRPCProvider.
 * Import the `trpc` object and call hooks:
 *
 * @example
 *   const { data } = trpc.academy.getCurrent.useQuery()
 *   const mutation = trpc.member.createManaged.useMutation()
 */
export const trpc = createTRPCReact<AppRouter>()
