import "server-only"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * Creates a per-request Supabase client for Server Components and Route Handlers.
 *
 * Uses the anon key + user's session cookies. Subject to RLS.
 * Academy context flows from JWT app_metadata.academy_id — never from headers.
 *
 * TYPE NOTE: `createServerClient<Database>()` from @supabase/ssr maps the schema
 * type as the 3rd generic arg to `SupabaseClient`, which @supabase/supabase-js
 * expects as `SchemaName` (a string), causing `Schema = never` and breaking all
 * query type inference. We cast to `SupabaseClient<Database>` (1 arg = correct
 * defaults) to fix this. Tracked upstream: supabase/supabase-js#1087 pattern.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // Session refresh happens in middleware instead.
          }
        },
      },
    },
  )

  return client as unknown as SupabaseClient<Database>
}
