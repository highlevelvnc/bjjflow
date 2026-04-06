import "server-only"
import { createHmac } from "crypto"
import { createClient } from "@supabase/supabase-js"

/**
 * Lazy-init Supabase admin client to avoid build-time errors
 * when env vars are not yet available.
 */
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Dispatches a webhook event to all active webhooks for the given academy
 * that subscribe to the specified event.
 *
 * This is fire-and-forget — it never throws. Failures are recorded in the
 * webhook row (failure_count, last_status_code). Webhooks are auto-disabled
 * after 10 consecutive failures.
 */
export async function dispatchWebhookEvent(
  academyId: string,
  event: string,
  data: Record<string, unknown>,
) {
  try {
    const admin = getAdmin()

    // Fetch all active webhooks for this academy that subscribe to this event
    const { data: webhooks, error } = await admin
      .from("webhooks")
      .select("id, url, secret, events, failure_count")
      .eq("academy_id", academyId)
      .eq("is_active", true)

    if (error || !webhooks || webhooks.length === 0) return

    // Filter to only webhooks that subscribe to this event
    const matching = webhooks.filter(
      (w) => Array.isArray(w.events) && w.events.includes(event),
    )
    if (matching.length === 0) return

    // Dispatch all webhooks in parallel
    await Promise.allSettled(
      matching.map(async (webhook) => {
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id,
        }

        const body = JSON.stringify(payload)
        const signature = createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex")

        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-GrapplingFlow-Signature": `sha256=${signature}`,
              "X-GrapplingFlow-Event": event,
            },
            body,
            signal: AbortSignal.timeout(10_000),
          })

          if (response.ok) {
            // Success — reset failure count
            await admin
              .from("webhooks")
              .update({
                last_triggered_at: new Date().toISOString(),
                last_status_code: response.status,
                failure_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", webhook.id)
          } else {
            // Non-2xx — increment failure count
            const newCount = (webhook.failure_count ?? 0) + 1
            await admin
              .from("webhooks")
              .update({
                last_triggered_at: new Date().toISOString(),
                last_status_code: response.status,
                failure_count: newCount,
                // Auto-disable after 10 consecutive failures
                ...(newCount > 10 ? { is_active: false } : {}),
                updated_at: new Date().toISOString(),
              })
              .eq("id", webhook.id)
          }
        } catch {
          // Network error — increment failure count
          const newCount = (webhook.failure_count ?? 0) + 1
          await admin
            .from("webhooks")
            .update({
              last_triggered_at: new Date().toISOString(),
              last_status_code: 0,
              failure_count: newCount,
              ...(newCount > 10 ? { is_active: false } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("id", webhook.id)
        }
      }),
    )
  } catch {
    // Swallow all errors — webhook dispatch is fire-and-forget
  }
}
