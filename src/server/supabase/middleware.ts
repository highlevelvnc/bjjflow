import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/database"

/**
 * Creates a lightweight Supabase client for use inside middleware.ts.
 *
 * Middleware cannot use the server client (no `next/headers` in Edge Runtime).
 * This client reads/writes cookies directly on the request/response objects.
 *
 * Its sole job in middleware is to refresh the Supabase Auth session so
 * the access token stays fresh. All actual authorization logic lives in
 * the tRPC procedure chain and server-side guards — NOT here.
 */
export function createMiddlewareSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Write updated cookies to both request (for downstream reads)
          // and response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )
}
