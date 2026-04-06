import "server-only"
import { z } from "zod"
import { randomBytes, createHmac } from "crypto"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"

const WEBHOOK_EVENTS = [
  "member.created",
  "member.updated",
  "member.deactivated",
  "session.created",
  "session.completed",
  "session.cancelled",
  "attendance.marked",
  "attendance.unmarked",
  "class.created",
  "class.updated",
  "invite.created",
  "invite.accepted",
  "contract.signed",
  "event.created",
  "announcement.created",
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export { WEBHOOK_EVENTS }

export const webhookRouter = router({
  /** List all webhooks for the current academy. */
  list: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from("webhooks")
      .select(
        "id, url, events, is_active, last_triggered_at, last_status_code, failure_count, created_at, updated_at",
      )
      .eq("academy_id", ctx.academyId!)
      .order("created_at", { ascending: false })

    if (error) throw new Error("Failed to fetch webhooks")

    return data ?? []
  }),

  /** Create a new webhook with an auto-generated signing secret. */
  create: adminProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const secret = randomBytes(32).toString("hex")

      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          academy_id: ctx.academyId!,
          url: input.url,
          secret,
          events: input.events,
        })
        .select("id, url, events, is_active, created_at")
        .single()

      if (error) throw new Error("Failed to create webhook")

      // Return secret only on creation — it cannot be retrieved again
      return { ...data, secret }
    }),

  /** Update a webhook's URL, events, or active state. */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        url: z.string().url().optional(),
        events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const { id, ...updates } = input

      const { data, error } = await supabase
        .from("webhooks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("academy_id", ctx.academyId!)
        .select("id, url, events, is_active, updated_at")
        .single()

      if (error) throw new Error("Failed to update webhook")

      return data
    }),

  /** Delete a webhook. */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { error } = await supabase
        .from("webhooks")
        .delete()
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)

      if (error) throw new Error("Failed to delete webhook")

      return { success: true }
    }),

  /** Send a test event to a webhook URL. */
  test: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()

      const { data: webhook, error } = await supabase
        .from("webhooks")
        .select("id, url, secret")
        .eq("id", input.id)
        .eq("academy_id", ctx.academyId!)
        .single()

      if (error || !webhook) throw new Error("Webhook not found")

      const payload = {
        event: "webhook.test",
        data: { message: "Test from GrapplingFlow" },
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
            "X-GrapplingFlow-Event": "webhook.test",
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })

        // Update last_triggered_at and status code
        await supabase
          .from("webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status_code: response.status,
            failure_count: response.ok ? 0 : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", webhook.id)

        return { status: response.status, ok: response.ok }
      } catch {
        await supabase
          .from("webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status_code: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", webhook.id)

        return { status: 0, ok: false }
      }
    }),
})
