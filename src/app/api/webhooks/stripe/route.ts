import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Lazy-init to avoid build-time env errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" })
}

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const priceId = subscription.items.data[0]?.price.id

  // Map Stripe status to academy status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "suspended",
    incomplete: "active",
    incomplete_expired: "cancelled",
    paused: "suspended",
  }

  const academyStatus = statusMap[status] ?? "active"

  // Determine plan from price ID
  const priceToPlans: Record<string, string> = {}
  const envPrices = [
    ["STRIPE_PRICE_STARTER_BRL", "starter"],
    ["STRIPE_PRICE_GROWTH_BRL", "growth"],
    ["STRIPE_PRICE_PRO_BRL", "pro"],
    ["STRIPE_PRICE_STARTER_EUR", "starter"],
    ["STRIPE_PRICE_GROWTH_EUR", "growth"],
    ["STRIPE_PRICE_PRO_EUR", "pro"],
  ] as const

  for (const [envKey, plan] of envPrices) {
    const id = process.env[envKey]
    if (id) priceToPlans[id] = plan
  }

  const plan = priceId ? (priceToPlans[priceId] ?? "starter") : "starter"

  // Update academy
  await getAdmin()
    .from("academies")
    .update({
      status: academyStatus as "trialing" | "active" | "past_due" | "suspended" | "cancelled" | "deleted",
      plan: plan as "starter" | "growth" | "pro" | "enterprise",
      stripe_subscription_id: subscription.id,
    })
    .eq("stripe_customer_id", customerId)

  // Find the academy for this customer
  const { data: academy } = await getAdmin()
    .from("academies")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!academy) return

  // Upsert subscription record
  const item = subscription.items.data[0]
  await getAdmin().from("subscriptions").upsert(
    {
      academy_id: academy.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      plan: plan as "starter" | "growth" | "pro",
      billing_interval: item?.price.recurring?.interval === "year" ? "year" : "month",
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  )
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription || !invoice.customer) return

  const customerId = invoice.customer as string

  // Find the academy
  const { data: academy } = await getAdmin()
    .from("academies")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!academy) return

  // Find subscription for this invoice
  const subscriptionId = invoice.subscription as string
  const { data: sub } = await getAdmin()
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .single()

  if (!sub) return

  // Record payment
  await getAdmin().from("payments").upsert(
    {
      academy_id: academy.id,
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: (invoice.payment_intent as string) ?? null,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: "succeeded",
      paid_at: new Date().toISOString(),
    },
    { onConflict: "stripe_invoice_id" },
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Stripe webhook verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        // The subscription.updated webhook handles the status change
        break
      default:
        break
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
