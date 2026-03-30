import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/**
 * Creates a Supabase client for use in Client Components and browser-side code.
 *
 * Uses the anon key + session stored in cookies by @supabase/ssr.
 * The same type-cast pattern as server.ts is applied for consistent inference.
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
