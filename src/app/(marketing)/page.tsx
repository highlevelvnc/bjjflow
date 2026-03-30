import type { Metadata } from "next"
import Link from "next/link"
import {
  Users, CalendarDays, CheckSquare,
  ArrowRight, Shield, Zap, BarChart3, ChevronRight,
  Star, Clock, Globe,
} from "lucide-react"

export const metadata: Metadata = {
  title: "BJJFlow — The Command Center for BJJ Academies",
  description:
    "Member management, session scheduling, and attendance analytics — one platform purpose-built for Brazilian Jiu-Jitsu academies.",
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    title: "Member Management",
    description:
      "Every student, every belt, every stripe — tracked in one place. Managed profiles, portal invites, and instant role assignment.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/30",
  },
  {
    icon: CalendarDays,
    title: "Session Scheduling",
    description:
      "Create class templates and generate weeks of sessions in one click. Set instructors, gi types, capacity limits, and belt requirements.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "group-hover:border-indigo-500/30",
  },
  {
    icon: CheckSquare,
    title: "Attendance Tracking",
    description:
      "Take attendance in seconds from any device. Tap to mark present, tap again to unmark. Real-time counts, zero friction.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "group-hover:border-cyan-500/30",
  },
  {
    icon: BarChart3,
    title: "Retention Analytics",
    description:
      "Automatically surface students at risk of dropping out based on attendance patterns. Act before they disappear.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/30",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Security",
    description:
      "Each academy is fully isolated. Row-level security, JWT-scoped access, and zero cross-tenant data exposure.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "group-hover:border-orange-500/30",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "No onboarding calls. No complex imports. Your academy is running in under 10 minutes, start to finish.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "group-hover:border-yellow-500/30",
  },
]

const STATS = [
  { value: "500+", label: "Academies worldwide" },
  { value: "40k+", label: "Members tracked" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 2s", label: "Avg page load" },
]

const STEPS = [
  {
    n: "01",
    icon: Globe,
    title: "Create your academy",
    body: "Set up your profile, configure your timezone and plan. Done in under 2 minutes.",
  },
  {
    n: "02",
    icon: Users,
    title: "Add classes & members",
    body: "Create recurring class templates, add your students and instructors. Belt ranks included.",
  },
  {
    n: "03",
    icon: BarChart3,
    title: "Track everything",
    body: "Generate sessions, take attendance from any device, watch retention data build over time.",
  },
]

const PRICING_FEATURES = [
  "Unlimited members",
  "Unlimited sessions & classes",
  "Live attendance tracking",
  "At-risk student alerts",
  "Instructor portal invites",
  "Multi-device access",
  "Row-level data security",
  "Priority support",
]

// ─── Dashboard Preview Mockup ─────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Browser chrome */}
      <div className="rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/50 overflow-hidden">
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
          {/* Sidebar */}
          <div className="w-44 shrink-0 border-r border-white/8 bg-gray-950 p-3 flex flex-col gap-1">
            <div className="mb-3 px-2 pt-1">
              <div className="text-xs font-semibold text-white">Alliance SP</div>
              <div className="text-[10px] text-gray-500">pro plan</div>
            </div>
            {["Dashboard","Members","Classes","Sessions"].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  i === 0
                    ? "bg-brand-500/15 text-brand-400 font-medium"
                    : "text-gray-400"
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-brand-400" : "bg-gray-600"}`} />
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-gray-900/50 p-4 overflow-hidden">
            <div className="mb-4">
              <div className="text-sm font-semibold text-white">Dashboard</div>
              <div className="text-xs text-gray-500">Alliance SP · Pro plan</div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[["48","Members"],["32","Students"],["12","Instructors"],["4","Admins"]].map(([n, l]) => (
                <div key={l} className="rounded-lg border border-white/8 bg-gray-800/60 p-2">
                  <div className="text-[10px] text-gray-500">{l}</div>
                  <div className="text-lg font-bold text-white">{n}</div>
                </div>
              ))}
            </div>

            {/* Two panels */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/8 bg-gray-800/60 p-3">
                <div className="mb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  Upcoming Sessions
                </div>
                {[["Mon","Fundamentals","18:00"],["Wed","Advanced","19:30"],["Fri","Open Mat","20:00"]].map(([d, c, t]) => (
                  <div key={c} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                    <div className="h-6 w-6 rounded bg-brand-500/20 flex items-center justify-center text-[9px] font-bold text-brand-400">{d}</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-gray-300">{c}</div>
                      <div className="text-[9px] text-gray-600">{t}</div>
                    </div>
                    <div className="text-[9px] text-emerald-400">●</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-white/8 bg-gray-800/60 p-3">
                <div className="mb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  At-Risk Students
                </div>
                {[["João S.","Purple","28%"],["Ana L.","Blue","31%"],["Carlos M.","White","18%"]].map(([n, b, r]) => (
                  <div key={n} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                    <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center text-[8px] font-bold text-red-400">{r}</div>
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

      {/* Glow under the preview */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950 to-transparent"
      />
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Nav() {
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
          <Link href="#features" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors sm:block">
            Features
          </Link>
          <Link href="#pricing" className="hidden rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors sm:block">
            Pricing
          </Link>
          <div className="mx-2 hidden h-4 w-px bg-white/10 sm:block" />
          <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-500/25 hover:bg-brand-400 transition-colors"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-950 bg-grid-dark px-6 pb-8 pt-20 sm:pt-28">
      {/* Gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[80px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
          Built for the modern BJJ academy
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
          The command center
          <br />
          <span className="gradient-text">for BJJ academies</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Member management, session scheduling, and attendance analytics —
          one platform purpose-built for Brazilian Jiu-Jitsu. No spreadsheets.
          No WhatsApp groups. Just clarity.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400 transition-all hover:shadow-brand-500/40 hover:-translate-y-0.5 sm:w-auto"
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors sm:w-auto"
          >
            Explore features
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-600">
          No credit card required · 14-day free trial · Setup in under 10 min
        </p>
      </div>

      {/* Dashboard preview */}
      <div className="relative mx-auto mt-16 max-w-5xl px-4">
        <DashboardPreview />
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="border-y border-white/8 bg-gray-900/60 py-12 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s) => (
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

function Features() {
  return (
    <section id="features" className="bg-gray-950 px-6 py-24 bg-grid-dark">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
            Platform features
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything your academy needs
          </h2>
          <p className="mt-4 text-gray-400">
            From white belt to black belt — we track every step of the journey.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-white/8 bg-white/3 p-6 transition-all duration-300 hover:bg-white/6 ${f.border} hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5`}
              >
                {/* Icon */}
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                  <Icon className={`h-5 w-5 ${f.color}`} />
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

function HowItWorks() {
  return (
    <section className="bg-gray-900/40 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            How it works
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-gray-400">Three steps. No training required.</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.n} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-600">{s.n}</span>
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

function Pricing() {
  return (
    <section id="pricing" className="bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            One plan. Everything included.
          </h2>
          <p className="mt-4 text-gray-400">No per-student fees. No seat limits. No surprises.</p>
        </div>

        <div className="mt-16 mx-auto max-w-sm">
          <div className="relative rounded-2xl border border-brand-500/30 bg-gray-900 p-8 glow-brand-sm">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-brand-500/30">
                <Star className="h-3 w-3 fill-current" /> Most popular
              </span>
            </div>

            {/* Price */}
            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-black text-white">$49</span>
              <span className="mb-1.5 text-gray-400">/month</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">per academy · billed monthly</p>

            {/* Features */}
            <ul className="mt-8 space-y-3">
              {PRICING_FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <CheckSquare className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/login"
              className="mt-8 block w-full rounded-xl bg-brand-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-400 transition-colors"
            >
              Start 14-day free trial
            </Link>
            <p className="mt-3 text-center text-xs text-gray-600">
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Testimonial() {
  return (
    <section className="border-y border-white/8 bg-gray-900/40 px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
          &ldquo;We cut our admin time by 80%. Now I spend that time on the mats,
          not on spreadsheets. BJJFlow is the tool I wished existed when I
          opened my academy.&rdquo;
        </blockquote>
        <div className="mt-6">
          <p className="font-semibold text-white">Professor Marco Lima</p>
          <p className="text-sm text-gray-500">Alliance São Paulo · 4th degree black belt</p>
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-gray-950 px-6 py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Your academy deserves
          <br />
          <span className="gradient-text">better tools</span>
        </h2>
        <p className="mt-6 text-lg text-gray-400">
          Stop managing your team in WhatsApp groups and Google Sheets.
          BJJFlow is purpose-built for how jiu-jitsu academies actually operate.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-400 transition-all hover:-translate-y-0.5 sm:w-auto"
          >
            Get started for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-sm font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors sm:w-auto"
          >
            Sign in to your academy
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 10-min setup</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> 14-day free trial</span>
        </div>
      </div>
    </section>
  )
}

function Footer() {
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
          © {new Date().getFullYear()} BJJFlow · Built for the jiu-jitsu community
        </p>
        <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">
          Sign in →
        </Link>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonial />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
