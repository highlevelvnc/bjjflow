import type { Metadata } from "next"
import React from "react"
import Link from "next/link"
import {
  Users, CalendarDays, CheckSquare,
  ArrowRight, Shield, Zap, BarChart3, ChevronRight,
  Star, Clock, Globe,
} from "lucide-react"
import { getLocale, LOCALE_CURRENCY, type Locale } from "@/lib/i18n"
import { getMessages, type Messages } from "@/lib/i18n/messages"
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher"
import type { CurrencyInfo } from "@/lib/i18n"

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getMessages(locale)
  return { title: t.meta.title, description: t.meta.description }
}

// ─── Feature icon map (order matches messages.features.items) ─────────────────

const FEATURE_META = [
  { icon: Users,       color: "text-violet-400", bg: "bg-violet-500/10", border: "group-hover:border-violet-500/30" },
  { icon: CalendarDays,color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "group-hover:border-indigo-500/30" },
  { icon: CheckSquare, color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "group-hover:border-cyan-500/30" },
  { icon: BarChart3,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "group-hover:border-emerald-500/30" },
  { icon: Shield,      color: "text-orange-400",  bg: "bg-orange-500/10",  border: "group-hover:border-orange-500/30" },
  { icon: Zap,         color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "group-hover:border-yellow-500/30" },
]

const STEP_ICONS: React.ComponentType<{ className?: string }>[] = [Globe, Users, BarChart3]

// ─── Dashboard Preview ────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/50">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b border-white/8 bg-gray-950 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="mx-auto max-w-xs rounded-md bg-gray-800 px-3 py-1 text-center text-xs text-gray-500">
              app.bjjflow.com/app
            </div>
          </div>
        </div>
        {/* App shell */}
        <div className="flex h-80">
          <div className="w-44 shrink-0 border-r border-white/8 bg-gray-950 p-3 flex flex-col gap-1">
            <div className="mb-3 px-2 pt-1">
              <div className="text-xs font-semibold text-white">Alliance SP</div>
              <div className="text-[10px] text-gray-500">pro plan</div>
            </div>
            {["Dashboard", "Members", "Classes", "Sessions"].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  i === 0 ? "bg-brand-500/15 text-brand-400 font-medium" : "text-gray-400"
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-brand-400" : "bg-gray-600"}`} />
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden bg-gray-900/50 p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold text-white">Dashboard</div>
              <div className="text-xs text-gray-500">Alliance SP · Pro plan</div>
            </div>
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[["48", "Members"], ["32", "Students"], ["12", "Instructors"], ["4", "Admins"]].map(([n, l]) => (
                <div key={l} className="rounded-lg border border-white/8 bg-gray-800/60 p-2">
                  <div className="text-[10px] text-gray-500">{l}</div>
                  <div className="text-lg font-bold text-white">{n}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/8 bg-gray-800/60 p-3">
                <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Upcoming Sessions
                </div>
                {[["Mon", "Fundamentals", "18:00"], ["Wed", "Advanced", "19:30"], ["Fri", "Open Mat", "20:00"]].map(([d, c, t]) => (
                  <div key={c} className="flex items-center gap-2 border-b border-white/5 py-1 last:border-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500/20 text-[9px] font-bold text-brand-400">{d}</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-gray-300">{c}</div>
                      <div className="text-[9px] text-gray-600">{t}</div>
                    </div>
                    <div className="text-[9px] text-emerald-400">●</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-white/8 bg-gray-800/60 p-3">
                <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  At-Risk Students
                </div>
                {[["João S.", "Purple", "28%"], ["Ana L.", "Blue", "31%"], ["Carlos M.", "White", "18%"]].map(([n, b, r]) => (
                  <div key={n} className="flex items-center gap-2 border-b border-white/5 py-1 last:border-0">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-[8px] font-bold text-red-400">{r}</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-gray-300">{n}</div>
                      <div className="text-[9px] text-gray-600">{b} Belt</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Nav({ t, locale }: { t: Messages; locale: Locale }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-gray-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 shadow-lg shadow-brand-500/30">
            <span className="text-[11px] font-black text-white">BF</span>
          </div>
          <span className="text-sm font-semibold text-white">BJJFlow</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link href="#features" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white sm:block">
            {t.nav.features}
          </Link>
          <Link href="#pricing" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white sm:block">
            {t.nav.pricing}
          </Link>
          <div className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          <LocaleSwitcher current={locale} />
          <div className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-white">
            {t.nav.signIn}
          </Link>
          <Link
            href="/login"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-500/25 transition-colors hover:bg-brand-400"
          >
            {t.nav.getStarted} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero({ t }: { t: Messages }) {
  return (
    <section className="relative overflow-hidden bg-gray-950 bg-grid-dark px-6 pb-8 pt-20 sm:pt-28">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[80px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
          {t.hero.badge}
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        </div>

        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
          {t.hero.h1}
          <br />
          <span className="gradient-text">{t.hero.h1Gradient}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
          {t.hero.subtitle}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-brand-500/40 sm:w-auto"
          >
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-white/20 hover:text-white sm:w-auto"
          >
            {t.hero.ctaSecondary}
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-600">{t.hero.noCard}</p>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl px-4">
        <DashboardPreview />
      </div>
    </section>
  )
}

function Stats({ t }: { t: Messages }) {
  const stats = [
    { value: "500+", label: t.stats.academies },
    { value: "40k+", label: t.stats.members },
    { value: "99.9%", label: t.stats.uptime },
    { value: "< 2s",  label: t.stats.pageLoad },
  ]
  return (
    <section className="border-y border-white/8 bg-gray-900/60 py-12 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features({ t }: { t: Messages }) {
  return (
    <section id="features" className="bg-gray-950 bg-grid-dark px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
            {t.features.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.features.h2}</h2>
          <p className="mt-4 text-gray-400">{t.features.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => {
            const meta = FEATURE_META[i]!
            const Icon = meta.icon
            return (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-white/8 bg-white/3 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/6 hover:shadow-lg hover:shadow-black/20 ${meta.border}`}
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${meta.bg}`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowItWorks({ t }: { t: Messages }) {
  return (
    <section className="bg-gray-900/40 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            {t.howItWorks.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.howItWorks.h2}</h2>
          <p className="mt-4 text-gray-400">{t.howItWorks.tagline}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {t.howItWorks.steps.map((s, i) => {
            const Icon = STEP_ICONS[i]!
            return (
              <div key={s.title}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-600">0{i + 1}</span>
                </div>
                <h3 className="mb-2 font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{s.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Testimonial({ t }: { t: Messages }) {
  return (
    <section className="border-y border-white/8 bg-gray-900/40 px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
          &ldquo;{t.testimonial.quote}&rdquo;
        </blockquote>
        <div className="mt-6">
          <p className="font-semibold text-white">{t.testimonial.author}</p>
          <p className="text-sm text-gray-500">{t.testimonial.role}</p>
        </div>
      </div>
    </section>
  )
}

function Pricing({ t, currency }: { t: Messages; currency: CurrencyInfo }) {
  return (
    <section id="pricing" className="bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            {t.pricing.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.pricing.h2}</h2>
          <p className="mt-4 text-gray-400">{t.pricing.tagline}</p>
        </div>

        <div className="mx-auto mt-16 max-w-sm">
          <div className="relative rounded-2xl border border-brand-500/30 bg-gray-900 p-8 glow-brand">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand-500/30">
                <Star className="h-3 w-3 fill-current" /> {t.pricing.mostPopular}
              </span>
            </div>

            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-black text-white">
                {currency.symbol}{currency.price}
              </span>
              <span className="mb-1.5 text-gray-400">{currency.period}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t.pricing.perAcademy}</p>

            <ul className="mt-8 space-y-3">
              {t.pricing.features.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <CheckSquare className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-8 block w-full rounded-xl bg-brand-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400"
            >
              {t.pricing.cta}
            </Link>
            <p className="mt-3 text-center text-xs text-gray-600">{t.pricing.noCard}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTA({ t }: { t: Messages }) {
  return (
    <section className="relative overflow-hidden bg-gray-950 px-6 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          {t.cta.h2}
          <br />
          <span className="gradient-text">{t.cta.h2Gradient}</span>
        </h2>
        <p className="mt-6 text-lg text-gray-400">{t.cta.subtitle}</p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:bg-brand-400 sm:w-auto"
          >
            {t.cta.ctaPrimary} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-sm font-semibold text-gray-300 transition-colors hover:border-white/20 hover:text-white sm:w-auto"
          >
            {t.cta.ctaSecondary}
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t.cta.setup}</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> {t.cta.noCard}</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> {t.cta.trial}</span>
        </div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: Messages }) {
  return (
    <footer className="border-t border-white/8 bg-gray-950 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500">
            <span className="text-[10px] font-black text-white">BF</span>
          </div>
          <span className="text-sm font-semibold text-white">BJJFlow</span>
        </div>
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} BJJFlow · {t.footer.tagline}
        </p>
        <Link href="/login" className="text-sm text-gray-500 transition-colors hover:text-white">
          {t.footer.signIn}
        </Link>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const locale = await getLocale()
  const t = getMessages(locale)
  const currency = LOCALE_CURRENCY[locale]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav t={t} locale={locale} />
      <main>
        <Hero t={t} />
        <Stats t={t} />
        <Features t={t} />
        <HowItWorks t={t} />
        <Testimonial t={t} />
        <Pricing t={t} currency={currency} />
        <CTA t={t} />
      </main>
      <Footer t={t} />
    </div>
  )
}
