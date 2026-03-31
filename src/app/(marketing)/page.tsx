import type { Metadata } from "next"
import { getLocale, LOCALE_CURRENCY } from "@/lib/i18n"
import { getMessages } from "@/lib/i18n/messages"
import { AnimatedSections, type LandingMessages } from "@/components/marketing/AnimatedSections"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getMessages(locale)
  return { title: t.meta.title, description: t.meta.description }
}

// ─── Page (Server Component) ─────────────────────────────────────────────────

export default async function LandingPage() {
  const locale = await getLocale()
  const t = getMessages(locale)
  const currency = LOCALE_CURRENCY[locale]

  // Map messages to the LandingMessages shape expected by AnimatedSections.
  // The pricing section uses the new 3-plan structure. We bridge by mapping
  // the data from the messages object. If the other agent hasn't updated
  // messages.ts yet, we provide sensible defaults.
  const pricingAny = t.pricing as Record<string, unknown>

  const landing: LandingMessages = {
    nav: {
      features: t.nav.features,
      pricing: t.nav.pricing,
      academies: (t.nav as Record<string, string>).academies ?? "For Academies",
      signIn: t.nav.signIn,
      getStarted: t.nav.getStarted,
    },
    hero: t.hero,
    stats: t.stats,
    features: t.features,
    howItWorks: t.howItWorks,
    testimonial: t.testimonial,
    pricing: {
      tag: t.pricing.tag,
      h2: t.pricing.h2,
      tagline: t.pricing.tagline,
      plans: Array.isArray(pricingAny.plans)
        ? (pricingAny.plans as LandingMessages["pricing"]["plans"])
        : currency.plans.map((_p) => ({
            name: _p.name,
            description: "",
            features: Array.isArray(pricingAny.features)
              ? (pricingAny.features as string[])
              : [],
            cta: typeof pricingAny.cta === "string"
              ? (pricingAny.cta as string)
              : "Start free trial",
          })),
      noCard: t.pricing.noCard,
    },
    cta: t.cta,
    footer: t.footer,
  }

  return <AnimatedSections t={landing} locale={locale} currency={currency} />
}
