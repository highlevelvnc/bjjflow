import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * ⚠️  DANGER: Service role client. Bypasses ALL Row-Level Security.
 *
 * Use ONLY for:
 *   - Stripe webhook handlers (academy creation, subscription sync)
 *   - Cron jobs (invite cleanup, subscription checks)
 *   - Audit log writes (immutable, no user-facing write policy)
 *   - Ownership transfer mutations
 *
 * NEVER:
 *   - Import this in any file that could be bundled client-side
 *   - Pass this client or its results to client components
 *   - Use this for anything a user can trigger directly without service validation
 *
 * The "server-only" import at the top enforces the import boundary at build time.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
