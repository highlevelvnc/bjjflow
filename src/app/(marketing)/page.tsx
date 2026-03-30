import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "BJJFlow — Jiu-Jitsu Academy Management",
  description:
    "The complete management platform for Brazilian Jiu-Jitsu academies. Track members, schedule sessions, and keep your team on the mats.",
}

// ─── Icons (inline SVG — no extra dep) ──────────────────────────────────────

function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconCheckSquare() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <IconUsers />,
    title: "Member Management",
    description:
      "Manage every student and instructor in one place. Track belt rank, stripes, attendance history, and portal access. Invite instructors with a single link.",
  },
  {
    icon: <IconCalendar />,
    title: "Class Scheduling",
    description:
      "Create class templates and generate weeks of sessions instantly. Set default instructors, gi types, capacity limits, and belt requirements per class.",
  },
  {
    icon: <IconCheckSquare />,
    title: "Attendance Tracking",
    description:
      "Take attendance in seconds — tap to mark present, tap again to unmark. Real-time count updates. Works for scheduled and in-progress sessions.",
  },
  {
    icon: <IconTrendingUp />,
    title: "Retention Insights",
    description:
      "Automatically surface students at risk of dropping out based on their attendance rate. Act before they disappear — not after.",
  },
]

const STEPS = [
  { n: "01", title: "Set up your academy", body: "Create your academy profile, add classes, and invite your instructors — takes under 10 minutes." },
  { n: "02", title: "Add your students", body: "Import existing members manually or let them sign up with an invite link. Belt ranks and stripes sync automatically." },
  { n: "03", title: "Run your academy", body: "Generate sessions, take attendance from any device, and watch your retention data build over time." },
]

const PRICING_ITEMS = [
  "Unlimited members",
  "Unlimited sessions",
  "Attendance tracking",
  "At-risk alerts",
  "Instructor invites",
  "Multi-device access",
]

// ─── Components ──────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <span className="text-sm font-semibold tracking-tight text-white">BJJFlow</span>
        <nav className="flex items-center gap-6">
          <Link href="#features" className="hidden text-sm text-gray-400 hover:text-white sm:block transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="hidden text-sm text-gray-400 hover:text-white sm:block transition-colors">
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-white px-3.5 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-950 px-6 py-24 sm:py-32">
      {/* Subtle gradient orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-gray-300">Built for BJJ academies</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Run your academy{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            without the chaos
          </span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-gray-400 sm:text-xl">
          BJJFlow gives jiu-jitsu academies one clean system for member management,
          session scheduling, and attendance tracking — so you can focus on coaching,
          not spreadsheets.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors sm:w-auto"
          >
            Start free trial
          </Link>
          <Link
            href="#features"
            className="w-full rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-white/30 hover:text-white transition-colors sm:w-auto"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-gray-600">
          No credit card required · Set up in under 10 minutes
        </p>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything your academy needs
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            One platform that covers the full lifecycle — from onboarding a new white belt
            to tracking which students haven&apos;t shown up in three weeks.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {f.icon}
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="bg-gray-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            No onboarding calls, no complex imports. Just a clean setup flow.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="mb-4 text-4xl font-black text-gray-100">{s.n}</div>
              <h3 className="mb-2 font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            One plan. Everything included. No per-student fees.
          </p>
        </div>

        <div className="mt-16 mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl">
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold text-gray-900">$49</span>
              <span className="mb-2 text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">per academy · billed monthly</p>

            <ul className="mt-8 space-y-3">
              {PRICING_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <IconCheck />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-8 block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Start your free trial
            </Link>
            <p className="mt-3 text-center text-xs text-gray-400">14-day free trial · No credit card required</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your academy deserves better tools
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Stop managing your team in spreadsheets and WhatsApp groups.
          BJJFlow is purpose-built for how BJJ academies actually work.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors sm:w-auto"
          >
            Get started for free
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-white/30 hover:text-white transition-colors sm:w-auto"
          >
            Sign in to your academy
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-sm font-semibold text-gray-900">BJJFlow</span>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} BJJFlow. Built for the jiu-jitsu community.
        </p>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Sign in →
        </Link>
      </div>
    </footer>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
