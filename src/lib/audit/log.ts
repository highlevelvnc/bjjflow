import "server-only"
import { createClient } from "@supabase/supabase-js"

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function writeAuditLog(entry: {
  academy_id: string
  actor_id?: string
  action: string
  resource_type: string
  resource_id?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await getAdmin().from("audit_log").insert(entry)
  } catch { /* non-fatal */ }
}
