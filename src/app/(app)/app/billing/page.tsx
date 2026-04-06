import type { Metadata } from "next"
import { createServerCaller } from "@/lib/trpc/server"
import { LOCALE_CURRENCY, type Locale } from "@/lib/i18n/config"
import { BillingClient } from "./BillingClient"

export const metadata: Metadata = {
  title: "Planos",
}

/** Map academy currency code to the matching locale for pricing display. */
function currencyToLocale(currency: string): Locale {
  switch (currency) {
    case "BRL":
      return "pt-BR"
    case "EUR":
      return "de" // EUR pricing is the same across de/fr/pt-PT
    case "USD":
    default:
      return "en"
  }
}

export default async function BillingPage() {
  const trpc = await createServerCaller()

  const [academy, subscription, memberCounts] = await Promise.all([
    trpc.academy.getCurrent(),
    trpc.billing.getSubscription(),
    trpc.member.getCounts(),
  ])

  const locale = currencyToLocale(academy.currency)
  const currency = LOCALE_CURRENCY[locale]

  // Derive max members from plan (should match DB but provide defaults)
  const MAX_MEMBERS_BY_PLAN: Record<string, number> = {
    starter: 30,
    growth: 100,
    pro: 999999,
    enterprise: 999999,
  }
  const maxMembers = MAX_MEMBERS_BY_PLAN[academy.plan] ?? 30

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Planos</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Gerencie a assinatura e os dados de cobrança da sua academia.
        </p>
      </div>

      <BillingClient
        academyPlan={academy.plan}
        academyStatus={academy.status}
        currency={currency}
        memberCount={memberCounts.total}
        maxMembers={maxMembers}
        subscription={subscription}
        hasStripeCustomer={!!subscription?.stripe_customer_id}
      />
    </div>
  )
}
