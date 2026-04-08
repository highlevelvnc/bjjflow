"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Users, CalendarDays, CheckSquare,
  ArrowRight, Shield, Zap, BarChart3, ChevronRight,
  Star, Clock, Globe, Check, GraduationCap,
} from "lucide-react"
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher"
import type { CurrencyInfo, PlanPricing, Locale } from "@/lib/i18n/config"

// ─── Types matching the new Messages interface ──────────────────────────────

interface PlanMessage {
  name: string
  description: string
  features: string[]
  cta: string
}

export interface LandingMessages {
  nav: { features: string; pricing: string; academies: string; signIn: string; getStarted: string }
  hero: {
    badge: string
    h1: string
    h1Gradient: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    noCard: string
  }
  stats: { academies: string; members: string; uptime: string; pageLoad: string }
  features: {
    tag: string
    h2: string
    subtitle: string
    items: Array<{ title: string; description: string }>
  }
  howItWorks: {
    tag: string
    h2: string
    tagline: string
    steps: Array<{ title: string; body: string }>
  }
  testimonials: Array<{ quote: string; author: string; role: string }>
  pricing: {
    tag: string
    h2: string
    tagline: string
    plans: PlanMessage[]
    noCard: string
  }
  cta: {
    h2: string
    h2Gradient: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    setup: string
    noCard: string
    trial: string
  }
  footer: { tagline: string; signIn: string }
  studentPortal: {
    navLabel: string
    title: string
    subtitle: string
    cta: string
    footnote: string
  }
}

// ─── Feature icon map ───────────────────────────────────────────────────────

const FEATURE_META = [
  { icon: Users,        color: "text-violet-400",  bg: "bg-violet-500/10",  border: "group-hover:border-violet-500/30" },
  { icon: CalendarDays, color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "group-hover:border-indigo-500/30" },
  { icon: CheckSquare,  color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "group-hover:border-cyan-500/30" },
  { icon: BarChart3,    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "group-hover:border-emerald-500/30" },
  { icon: Shield,       color: "text-orange-400",  bg: "bg-orange-500/10",  border: "group-hover:border-orange-500/30" },
  { icon: Zap,          color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "group-hover:border-yellow-500/30" },
]

const STEP_ICONS: React.ComponentType<{ className?: string }>[] = [Globe, Users, BarChart3]

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUpChild = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const } },
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({ t, locale }: { t: LandingMessages; locale: Locale }) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-lg shadow-black/20"
          : "border-white/8 bg-gray-950/60 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image src="/kumologo.png" alt="Kumo" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-semibold text-white">Kumo</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="#features" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white sm:block">
            {t.nav.features}
          </Link>
          <Link href="#pricing" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white sm:block">
            {t.nav.pricing}
          </Link>
          <Link href="#pricing" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white md:block">
            {t.nav.academies}
          </Link>
          <div className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          <LocaleSwitcher current={locale} />
          <div className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          {/* Student portal pill — visible on every breakpoint, including mobile,
              so a student arriving on the marketing page can hop straight into
              their app without scrolling through pricing/features. */}
          <Link
            href="/login?role=student"
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-brand/30 bg-cyan-brand/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-brand/50 hover:bg-cyan-brand/15 hover:text-cyan-200 sm:text-sm"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            {t.studentPortal.navLabel}
          </Link>
          <Link href="/login" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-white sm:inline-block">
            {t.nav.signIn}
          </Link>
          <Link
            href="/login"
            className="ml-1 hidden items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-500/25 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-brand-500/40 sm:inline-flex"
          >
            {t.nav.getStarted} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ t }: { t: LandingMessages }) {
  return (
    <section className="relative overflow-hidden bg-gray-950">
      {/* Video background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          poster="/videos/bjj-poster.jpg"
        >
          <source src="/videos/bjj.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-transparent to-gray-950" />
      </div>

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[80px]" />

      <div className="relative px-6 pb-8 pt-20 sm:pt-28">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUpChild} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
            {t.hero.badge}
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          </motion.div>

          <motion.h1
            variants={fadeUpChild}
            className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            {t.hero.h1}
            <br />
            <span className="gradient-text">{t.hero.h1Gradient}</span>
          </motion.h1>

          <motion.p
            variants={fadeUpChild}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            variants={fadeUpChild}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-brand-500/40 sm:w-auto"
            >
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-200 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              {t.hero.ctaSecondary}
            </Link>
          </motion.div>

          <motion.p variants={fadeUpChild} className="mt-6 text-xs text-gray-500">
            {t.hero.noCard}
          </motion.p>
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          className="relative mx-auto mt-16 max-w-5xl px-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        >
          <div className="relative mx-auto max-w-4xl">
            <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-3xl bg-brand-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/50">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-white/8 bg-gray-950 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="mx-auto max-w-xs rounded-md bg-gray-800 px-3 py-1 text-center text-xs text-gray-500">
                    app.grapplingflow.com/app
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
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${i === 0 ? "bg-brand-500/15 text-brand-400 font-medium" : "text-gray-400"}`}>
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
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">Upcoming Sessions</div>
                      {[["Mon", "Fundamentals", "18:00"], ["Wed", "Advanced", "19:30"], ["Fri", "Open Mat", "20:00"]].map(([d, c, ti]) => (
                        <div key={c} className="flex items-center gap-2 border-b border-white/5 py-1 last:border-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-500/20 text-[9px] font-bold text-brand-400">{d}</div>
                          <div className="flex-1">
                            <div className="text-[10px] font-medium text-gray-300">{c}</div>
                            <div className="text-[9px] text-gray-600">{ti}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-white/8 bg-gray-800/60 p-3">
                      <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">At-Risk Students</div>
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
        </motion.div>
      </div>
    </section>
  )
}

// ─── Student Portal CTA ─────────────────────────────────────────────────────
// Dedicated entry-point for STUDENTS (not academy owners). Sits right under
// the hero so students arriving from a WhatsApp link or word-of-mouth can
// hop into /aluno without scrolling through marketing copy.

function StudentPortal({ t }: { t: LandingMessages }) {
  return (
    <section className="relative overflow-hidden border-y border-white/8 bg-gradient-to-br from-cyan-brand/10 via-gray-950 to-brand-500/10 px-6 py-14">
      {/* Subtle glow accents */}
      <div aria-hidden className="pointer-events-none absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-brand/20 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brand-500/15 blur-[100px]" />

      <motion.div
        className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gray-900/60 p-8 backdrop-blur-xl sm:flex-row sm:gap-8 sm:p-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-brand/15 text-cyan-300 shadow-lg shadow-cyan-brand/10 ring-1 ring-cyan-brand/30">
          <GraduationCap className="h-7 w-7" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {t.studentPortal.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400 sm:text-base">
            {t.studentPortal.subtitle}
          </p>
          <p className="mt-3 text-xs text-gray-600">{t.studentPortal.footnote}</p>
        </div>

        <Link
          href="/login?role=student"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-brand px-6 py-3 text-sm font-semibold text-gray-950 shadow-lg shadow-cyan-brand/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-brand/40"
        >
          {t.studentPortal.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  )
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function Stats({ t }: { t: LandingMessages }) {
  const stats = [
    { value: "500+", label: t.stats.academies },
    { value: "40k+", label: t.stats.members },
    { value: "99.9%", label: t.stats.uptime },
    { value: "< 2s",  label: t.stats.pageLoad },
  ]
  return (
    <section className="border-y border-white/8 bg-gray-900/60 py-12 backdrop-blur">
      <motion.div
        className="mx-auto max-w-5xl px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
      >
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUpChild} className="text-center">
              <div className="text-3xl font-black text-white sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────

function Features({ t }: { t: LandingMessages }) {
  return (
    <section id="features" className="bg-gray-950 bg-grid-dark px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
            {t.features.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.features.h2}</h2>
          <p className="mt-4 text-gray-400">{t.features.subtitle}</p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {t.features.items.map((f, i) => {
            const meta = FEATURE_META[i]!
            const Icon = meta.icon
            return (
              <motion.div
                key={f.title}
                variants={fadeUpChild}
                className={`group relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20 ${meta.border}`}
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${meta.bg}`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorks({ t }: { t: LandingMessages }) {
  return (
    <section className="bg-gray-900/40 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            {t.howItWorks.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.howItWorks.h2}</h2>
          <p className="mt-4 text-gray-400">{t.howItWorks.tagline}</p>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-8 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {t.howItWorks.steps.map((s, i) => {
            const Icon = STEP_ICONS[i]!
            return (
              <motion.div key={s.title} variants={fadeUpChild}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-600">0{i + 1}</span>
                </div>
                <h3 className="mb-2 font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{s.body}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Testimonial ─────────────────────────────────────────────────────────────

function Testimonial({ t }: { t: LandingMessages }) {
  return (
    <section className="border-y border-white/8 bg-gray-900/40 px-6 py-20">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {t.testimonials.map((item, idx) => (
          <motion.div
            key={idx}
            className="rounded-2xl border border-white/8 bg-gray-900/60 p-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <div className="mb-4 flex justify-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-lg font-medium leading-relaxed text-white">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <div className="mt-5">
              <p className="font-semibold text-white">{item.author}</p>
              <p className="text-sm text-gray-500">{item.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Pricing (3-tier) ────────────────────────────────────────────────────────

function PricingCard({
  plan,
  planMsg,
  currency,
  isPopular,
  isMiddle,
}: {
  plan: PlanPricing
  planMsg: PlanMessage
  currency: CurrencyInfo
  isPopular: boolean
  isMiddle: boolean
}) {
  return (
    <motion.div
      variants={fadeUpChild}
      className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
        isPopular
          ? "border-brand-500/40 bg-gray-900 glow-brand scale-[1.02] lg:scale-105 z-10"
          : "border-white/8 bg-gray-900/60 hover:border-white/15"
      } ${isMiddle ? "" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand-500/30">
            <Star className="h-3 w-3 fill-current" /> Most Popular
          </span>
        </div>
      )}

      <div className={isPopular ? "mt-2" : ""}>
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{planMsg.description}</p>
      </div>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-4xl font-black text-white">
          {currency.symbol}{plan.price}
        </span>
        <span className="mb-1 text-gray-400">{currency.period}</span>
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {planMsg.features.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check className="h-3 w-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <Link
        href="/login"
        className={`mt-8 block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${
          isPopular
            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 hover:bg-brand-400"
            : "border border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/5 hover:text-white"
        }`}
      >
        {planMsg.cta}
      </Link>
    </motion.div>
  )
}

function Pricing({ t, currency }: { t: LandingMessages; currency: CurrencyInfo }) {
  return (
    <section id="pricing" className="bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            {t.pricing.tag}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.pricing.h2}</h2>
          <p className="mt-4 text-gray-400">{t.pricing.tagline}</p>
        </motion.div>

        <motion.div
          className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3 lg:items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          {currency.plans.map((plan, i) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              planMsg={t.pricing.plans[i]!}
              currency={currency}
              isPopular={!!plan.popular}
              isMiddle={i === 1}
            />
          ))}
        </motion.div>

        <motion.p
          className="mt-8 text-center text-sm text-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {t.pricing.noCard}
        </motion.p>
      </div>
    </section>
  )
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA({ t }: { t: LandingMessages }) {
  return (
    <section className="relative overflow-hidden bg-gray-950 px-6 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[100px]" />
      </div>
      <motion.div
        className="relative mx-auto max-w-3xl text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
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
      </motion.div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({ t }: { t: LandingMessages }) {
  return (
    <footer className="border-t border-white/8 bg-gray-950 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/kumologo.png" alt="Kumo" width={24} height={24} className="rounded-md" />
          <span className="text-sm font-semibold text-white">Kumo</span>
        </div>
        <p className="text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Kumo &middot; {t.footer.tagline}
        </p>
        <Link href="/login" className="text-sm text-gray-500 transition-colors hover:text-white">
          {t.footer.signIn}
        </Link>
      </div>
    </footer>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AnimatedSections({
  t,
  locale,
  currency,
}: {
  t: LandingMessages
  locale: Locale
  currency: CurrencyInfo
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav t={t} locale={locale} />
      <main>
        <Hero t={t} />
        <StudentPortal t={t} />
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
