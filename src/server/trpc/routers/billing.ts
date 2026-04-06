import "server-only"
import { z } from "zod"
import { router } from "../init"
import { adminProcedure } from "../procedures"
import { createServerSupabase } from "@/server/supabase/server"
import Stripe from "stripe"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  })
}

/** Maps plan + currency to the correct STRIPE_PRICE_* env var name. */
function getPriceEnvVar(plan: string, currency: string): string {
  // e.g. STRIPE_PRICE_STARTER_USD, STRIPE_PRICE_GROWTH_BRL
  return `STRIPE_PRICE_${plan.toUpperCase()}_${currency.toUpperCase()}`
}

export const billingRouter = router({
  /**
   * Creates a Stripe Checkout session for the given plan.
   * Returns { url } for client-side redirect.
   */
  createCheckoutSession: adminProcedure
    .input(z.object({ plan: z.enum(["starter", "growth", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServerSupabase()
      const stripe = getStripe()

      // Fetch the academy's currency and existing Stripe customer ID
      const { data: academy, error } = await supabase
        .from("academies")
        .select("currency, stripe_customer_id, name")
        .eq("id", ctx.academyId!)
        .single()

      if (error || !academy) throw new Error("Academy not found")

      const envVar = getPriceEnvVar(input.plan, academy.currency)
      const priceId = process.env[envVar]
      if (!priceId) {
        throw new Error(`Stripe price not configured for ${input.plan}/${academy.currency}. Missing env: ${envVar}`)
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/app/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
        cancel_url: `${baseUrl}/app/billing?cancelled=1`,
        metadata: {
          academy_id: ctx.academyId!,
          plan: input.plan,
        },
      }

      // If the academy already has a Stripe customer, reuse it
      if (academy.stripe_customer_id) {
        sessionParams.customer = academy.stripe_customer_id
      } else {
        // Let Checkout create a new customer, but pass academy name
        sessionParams.customer_creation = "always"
        sessionParams.customer_email = ctx.member?.email ?? undefined
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      return { url: session.url }
    }),

  /**
   * Creates a Stripe Customer Portal session.
   * Returns { url } for client-side redirect.
   */
  createPortalSession: adminProcedure.mutation(async ({ ctx }) => {
    const supabase = await createServerSupabase()
    const stripe = getStripe()

    const { data: academy, error } = await supabase
      .from("academies")
      .select("stripe_customer_id")
      .eq("id", ctx.academyId!)
      .single()

    if (error || !academy) throw new Error("Academy not found")

    if (!academy.stripe_customer_id) {
      throw new Error("No billing account found. Please subscribe to a plan first.")
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const session = await stripe.billingPortal.sessions.create({
      customer: academy.stripe_customer_id,
      return_url: `${baseUrl}/app/billing`,
    })

    return { url: session.url }
  }),

  /**
   * Returns current subscription info for the academy.
   */
  getSubscription: adminProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase()

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("academy_id", ctx.academyId!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return subscription
  }),
})
