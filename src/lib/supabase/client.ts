import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/**
 * Creates a Supabase client for use in Client Components.
 *
 * Uses only NEXT_PUBLIC_ keys — safe to expose to the browser.
 * Subject to RLS. Academy context flows from JWT app_metadata.academy_id.
 *
 * Call once per component tree via a provider, not on every render.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
