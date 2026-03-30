# BJJFlow — Next.js App Router Project Structure

> Sources of truth: ARCHITECTURE.md, ACCESS_MODEL.md, SCHEMA_REVISION.md,
> RLS_MODEL.md, 00001_schema.sql, 00002_rls.sql
>
> This document defines the final project structure before implementation.

---

## 1. Complete Folder Tree

```
bjjflow/
│
├── .env.local                              # Secrets (never committed)
├── .env.example                            # Template for onboarding devs
├── .eslintrc.cjs
├── .prettierrc
├── next.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                            # Auth + tenant + role gate
├── drizzle.config.ts                       # Drizzle ORM config
│
├── supabase/
│   ├── config.toml                         # Supabase local dev config
│   ├── seed.sql                            # Dev seed data
│   └── migrations/
│       ├── 00001_schema.sql                # Tables, indexes, triggers
│       └── 00002_rls.sql                   # RLS policies
│
├── src/
│   │
│   ├── app/                                # Next.js App Router
│   │   ├── layout.tsx                      # Root layout (html, body, fonts)
│   │   ├── not-found.tsx                   # Global 404
│   │   ├── error.tsx                       # Global error boundary
│   │   ├── global-error.tsx                # Root error boundary
│   │   │
│   │   ├── (marketing)/                    # ── PUBLIC, no auth ──────────
│   │   │   ├── layout.tsx                  # Marketing nav + footer
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx                # Plan comparison (BRL + EUR)
│   │   │   ├── features/
│   │   │   │   └── page.tsx                # Feature showcase
│   │   │   └── contact/
│   │   │       └── page.tsx                # Contact form
│   │   │
│   │   ├── (auth)/                         # ── PUBLIC, redirect if authed ─
│   │   │   ├── layout.tsx                  # Centered card layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx                # Email/password + magic link
│   │   │   ├── signup/
│   │   │   │   └── page.tsx                # Owner registration
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx                # Reset request form
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx                # New password form (token)
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx                # Waiting screen + resend
│   │   │   ├── invite/
│   │   │   │   └── page.tsx                # Invite acceptance (token)
│   │   │   └── callback/
│   │   │       └── route.ts                # OAuth callback handler
│   │   │
│   │   ├── (onboarding)/                   # ── AUTHED, no academy yet ─────
│   │   │   ├── layout.tsx                  # Minimal chrome, progress steps
│   │   │   ├── setup/
│   │   │   │   └── page.tsx                # Academy name, slug, timezone
│   │   │   ├── plan/
│   │   │   │   └── page.tsx                # Stripe Checkout (plan select)
│   │   │   └── complete/
│   │   │       └── page.tsx                # Post-checkout redirect handler
│   │   │
│   │   ├── (dashboard)/                    # ── AUTHED + ACADEMY + MEMBER ──
│   │   │   ├── layout.tsx                  # Sidebar + header + providers
│   │   │   ├── page.tsx                    # Dashboard home (stats, feed)
│   │   │   │
│   │   │   ├── schedule/                   # ── Schedule management ────────
│   │   │   │   ├── page.tsx                # Weekly calendar view
│   │   │   │   ├── [classId]/
│   │   │   │   │   ├── page.tsx            # Class detail + session list
│   │   │   │   │   └── [sessionId]/
│   │   │   │   │       └── page.tsx        # Session: attendance + notes
│   │   │   │   └── new/
│   │   │   │       └── page.tsx            # Create class form
│   │   │   │
│   │   │   ├── members/                    # ── Member management ──────────
│   │   │   │   ├── page.tsx                # Members list + filters
│   │   │   │   ├── [memberId]/
│   │   │   │   │   └── page.tsx            # Profile, history, belt, plan
│   │   │   │   ├── invite/
│   │   │   │   │   └── page.tsx            # Send invite form
│   │   │   │   └── new/
│   │   │   │       └── page.tsx            # Create managed profile
│   │   │   │
│   │   │   ├── curriculum/                 # ── Technique library ──────────
│   │   │   │   ├── page.tsx                # Browse by position/belt
│   │   │   │   ├── [techniqueId]/
│   │   │   │   │   └── page.tsx            # Technique detail + media
│   │   │   │   └── new/
│   │   │   │       └── page.tsx            # Create technique form
│   │   │   │
│   │   │   ├── attendance/                 # ── Attendance reports ─────────
│   │   │   │   └── page.tsx                # Attendance analytics
│   │   │   │
│   │   │   ├── billing/                    # ── Admin only ─────────────────
│   │   │   │   ├── page.tsx                # Subscription + payment history
│   │   │   │   └── plans/
│   │   │   │       └── page.tsx            # Student plan management
│   │   │   │
│   │   │   ├── automations/                # ── Admin only ─────────────────
│   │   │   │   ├── page.tsx                # Automation list
│   │   │   │   ├── [automationId]/
│   │   │   │   │   └── page.tsx            # Automation detail + run history
│   │   │   │   └── new/
│   │   │   │       └── page.tsx            # Create automation wizard
│   │   │   │
│   │   │   ├── insights/                   # ── AI insights ───────────────
│   │   │   │   └── page.tsx                # Insights feed + actions
│   │   │   │
│   │   │   └── settings/                   # ── Admin only ─────────────────
│   │   │       ├── page.tsx                # General academy settings
│   │   │       ├── permissions/
│   │   │       │   └── page.tsx            # Permission toggles
│   │   │       ├── audit-log/
│   │   │       │   └── page.tsx            # Audit trail viewer
│   │   │       └── danger-zone/
│   │   │           └── page.tsx            # Transfer, export, delete
│   │   │
│   │   ├── (status)/                       # ── Blocked states ─────────────
│   │   │   ├── suspended/
│   │   │   │   └── page.tsx                # Academy suspended (read-only)
│   │   │   ├── member-suspended/
│   │   │   │   └── page.tsx                # Member suspended by admin
│   │   │   └── reactivate/
│   │   │       └── page.tsx                # Cancelled, export offered
│   │   │
│   │   └── api/                            # ── API routes ─────────────────
│   │       ├── webhooks/
│   │       │   └── stripe/
│   │       │       └── route.ts            # Stripe webhook handler
│   │       ├── cron/
│   │       │   ├── subscription-check/
│   │       │   │   └── route.ts            # Daily: check overdue plans
│   │       │   └── invite-cleanup/
│   │       │       └── route.ts            # Daily: expire old invites
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts            # tRPC HTTP handler
│   │
│   ├── server/                             # ── SERVER-ONLY ────────────────
│   │   │                                   # "server-only" package enforced
│   │   │
│   │   ├── auth/                           # Auth utilities
│   │   │   ├── session.ts                  # getSession(), requireSession()
│   │   │   ├── member.ts                   # getMember(), requireMember()
│   │   │   ├── guards.ts                   # requireRole(), requireAdmin()
│   │   │   └── switch-academy.ts           # switchAcademy() server action
│   │   │
│   │   ├── supabase/                       # Supabase clients
│   │   │   ├── server.ts                   # Authenticated client (per-request)
│   │   │   ├── admin.ts                    # Service role client (DANGEROUS)
│   │   │   └── middleware.ts               # Middleware-specific client
│   │   │
│   │   ├── db/                             # Database layer
│   │   │   ├── schema.ts                   # Drizzle schema (generated or manual)
│   │   │   ├── client.ts                   # Drizzle client instance
│   │   │   └── queries/                    # Reusable query functions
│   │   │       ├── academies.ts            # getAcademyBySlug, getAcademyById
│   │   │       ├── members.ts              # getMembersByAcademy, getMemberById
│   │   │       ├── classes.ts              # getClasses, getClassSessions
│   │   │       ├── attendance.ts           # getAttendance, checkIn
│   │   │       ├── techniques.ts           # getTechniques, getByPosition
│   │   │       ├── student-plans.ts        # getPlans, updatePlanStatus
│   │   │       ├── invites.ts              # createInvite, acceptInvite
│   │   │       ├── notifications.ts        # getUnread, markRead
│   │   │       ├── automations.ts          # getAutomations, runAutomation
│   │   │       ├── ai-insights.ts          # getInsights, dismissInsight
│   │   │       └── audit-log.ts            # logAction (service role only)
│   │   │
│   │   ├── trpc/                           # tRPC API layer
│   │   │   ├── init.ts                     # tRPC instance + context factory
│   │   │   ├── root.ts                     # Root router (merges all)
│   │   │   ├── procedures.ts               # Procedure middleware chain
│   │   │   │                               #   publicProcedure
│   │   │   │                               #   protectedProcedure
│   │   │   │                               #   instructorProcedure
│   │   │   │                               #   adminProcedure
│   │   │   └── routers/                    # Domain routers
│   │   │       ├── academy.ts              # Academy settings, switch
│   │   │       ├── member.ts               # CRUD, role change, promotion
│   │   │       ├── class.ts                # CRUD, session generation
│   │   │       ├── attendance.ts           # Check-in, bulk, history
│   │   │       ├── curriculum.ts           # Techniques, media
│   │   │       ├── billing.ts              # Subscription read, portal URL
│   │   │       ├── student-plan.ts         # Student plan CRUD
│   │   │       ├── invite.ts               # Create, revoke, resend
│   │   │       ├── notification.ts         # List, mark read, prefs
│   │   │       ├── automation.ts           # CRUD, toggle, run history
│   │   │       ├── insight.ts              # List, dismiss, action
│   │   │       └── audit.ts               # Read-only audit log
│   │   │
│   │   ├── stripe/                         # Stripe integration
│   │   │   ├── client.ts                   # Stripe SDK init
│   │   │   ├── plans.ts                    # Plan definitions (BRL + EUR)
│   │   │   ├── checkout.ts                 # Create checkout session
│   │   │   ├── portal.ts                   # Customer portal session
│   │   │   └── webhooks.ts                 # Event handlers by type
│   │   │
│   │   ├── email/                          # Transactional email
│   │   │   ├── client.ts                   # Resend SDK init
│   │   │   └── templates/                  # React Email templates
│   │   │       ├── invite.tsx
│   │   │       ├── activation.tsx
│   │   │       ├── welcome.tsx
│   │   │       ├── class-reminder.tsx
│   │   │       ├── payment-failed.tsx
│   │   │       └── ownership-transfer.tsx
│   │   │
│   │   ├── automation/                     # Automation engine
│   │   │   ├── engine.ts                   # Run dispatcher
│   │   │   ├── triggers.ts                 # Trigger evaluation
│   │   │   └── actions.ts                  # Action executors
│   │   │
│   │   └── ai/                             # AI insights pipeline
│   │       ├── pipeline.ts                 # Insight generation coordinator
│   │       ├── analyzers/                  # Per-insight-type analyzers
│   │       │   ├── churn-risk.ts
│   │       │   ├── promotion-ready.ts
│   │       │   └── class-optimization.ts
│   │       └── types.ts                    # AI-specific types
│   │
│   ├── lib/                                # ── SHARED (server + client) ───
│   │   │
│   │   ├── supabase/                       # Client-side Supabase
│   │   │   └── client.ts                   # Browser Supabase client
│   │   │
│   │   ├── trpc/                           # tRPC client setup
│   │   │   ├── client.ts                   # React Query + tRPC client
│   │   │   └── server.ts                   # Server-side tRPC caller
│   │   │
│   │   ├── validations/                    # Zod schemas (shared)
│   │   │   ├── academy.ts                  # Academy create/update
│   │   │   ├── member.ts                   # Member create/update/invite
│   │   │   ├── class.ts                    # Class create/update
│   │   │   ├── attendance.ts               # Check-in, bulk check-in
│   │   │   ├── technique.ts                # Technique create/update
│   │   │   ├── student-plan.ts             # Plan create/update
│   │   │   ├── automation.ts               # Automation create/update
│   │   │   └── auth.ts                     # Login, signup, reset
│   │   │
│   │   ├── constants/                      # App-wide constants
│   │   │   ├── roles.ts                    # ROLES enum + hierarchy
│   │   │   ├── plans.ts                    # Plan names, limits
│   │   │   ├── belts.ts                    # Belt system (IBJJF order)
│   │   │   ├── routes.ts                   # Route path constants
│   │   │   └── permissions.ts              # Permission map by role
│   │   │
│   │   ├── i18n/                           # Internationalization
│   │   │   ├── config.ts                   # next-intl config
│   │   │   ├── pt-BR.json                  # Portuguese (Brazil)
│   │   │   └── en.json                     # English
│   │   │
│   │   └── utils/                          # Pure utility functions
│   │       ├── date.ts                     # Timezone-aware formatters
│   │       ├── currency.ts                 # BRL/EUR formatting
│   │       ├── slug.ts                     # Slug generation + validation
│   │       └── cn.ts                       # Tailwind class merge
│   │
│   ├── types/                              # ── TYPESCRIPT TYPES ───────────
│   │   ├── database.ts                     # Generated: Supabase DB types
│   │   ├── domain.ts                       # Business domain types
│   │   ├── auth.ts                         # Session, JWT, member context
│   │   ├── stripe.ts                       # Stripe event/plan types
│   │   └── trpc.ts                         # tRPC router type export
│   │
│   ├── hooks/                              # ── REACT HOOKS ───────────────
│   │   ├── use-tenant.ts                   # Active academy from context
│   │   ├── use-member.ts                   # Current member from context
│   │   ├── use-role.ts                     # Role + permission helpers
│   │   ├── use-realtime.ts                 # Supabase Realtime wrapper
│   │   └── use-debounce.ts                 # Input debounce
│   │
│   └── components/                         # ── UI COMPONENTS ─────────────
│       │
│       ├── ui/                             # shadcn/ui primitives
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   ├── dialog.tsx
│       │   ├── table.tsx
│       │   ├── card.tsx
│       │   ├── badge.tsx
│       │   ├── dropdown-menu.tsx
│       │   ├── calendar.tsx
│       │   ├── toast.tsx
│       │   └── ... (shadcn components)
│       │
│       ├── providers/                      # Context providers
│       │   ├── tenant-provider.tsx          # Academy context
│       │   ├── member-provider.tsx          # Member + role context
│       │   ├── trpc-provider.tsx            # tRPC + React Query
│       │   └── theme-provider.tsx           # Light/dark mode
│       │
│       ├── layouts/                        # Layout building blocks
│       │   ├── sidebar.tsx                  # Dashboard sidebar (role-aware)
│       │   ├── header.tsx                   # Dashboard header
│       │   ├── academy-switcher.tsx         # Multi-academy dropdown
│       │   ├── mobile-nav.tsx              # Responsive navigation
│       │   └── onboarding-stepper.tsx       # Onboarding progress
│       │
│       ├── forms/                          # Form components
│       │   ├── academy-setup-form.tsx
│       │   ├── member-form.tsx
│       │   ├── class-form.tsx
│       │   ├── technique-form.tsx
│       │   ├── student-plan-form.tsx
│       │   ├── automation-form.tsx
│       │   ├── invite-form.tsx
│       │   ├── login-form.tsx
│       │   └── signup-form.tsx
│       │
│       ├── data-tables/                    # Table components
│       │   ├── members-table.tsx
│       │   ├── attendance-table.tsx
│       │   ├── payments-table.tsx
│       │   ├── invites-table.tsx
│       │   └── audit-log-table.tsx
│       │
│       ├── cards/                          # Card components
│       │   ├── stat-card.tsx               # Dashboard stat
│       │   ├── insight-card.tsx            # AI insight
│       │   ├── member-card.tsx             # Member summary
│       │   └── class-card.tsx              # Class summary
│       │
│       ├── schedule/                       # Schedule-specific
│       │   ├── week-calendar.tsx
│       │   ├── session-detail.tsx
│       │   └── attendance-roster.tsx
│       │
│       ├── curriculum/                     # Curriculum-specific
│       │   ├── technique-browser.tsx
│       │   ├── technique-detail.tsx
│       │   └── media-player.tsx
│       │
│       └── shared/                         # Cross-cutting
│           ├── role-gate.tsx               # Render children by role
│           ├── belt-badge.tsx              # Belt rank display
│           ├── avatar.tsx                  # Member avatar
│           ├── empty-state.tsx             # No data placeholder
│           ├── loading-skeleton.tsx         # Loading states
│           ├── confirm-dialog.tsx          # Destructive action confirm
│           └── error-boundary.tsx          # Component error catch
│
├── tests/
│   ├── e2e/                                # Playwright E2E
│   │   ├── auth.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── rls-isolation.spec.ts           # Cross-tenant RLS tests
│   │   └── ...
│   ├── integration/                        # API + DB integration
│   │   ├── trpc/
│   │   │   ├── member.test.ts
│   │   │   └── billing.test.ts
│   │   └── webhooks/
│   │       └── stripe.test.ts
│   └── unit/                               # Pure function tests
│       ├── validations/
│       └── utils/
│
└── public/                                 # Static assets
    ├── favicon.ico
    ├── og-image.png
    └── icons/
```

---

## 2. Route Groups

```
GROUP             │ AUTH    │ ACADEMY │ ROLE     │ PURPOSE
──────────────────┼─────────┼─────────┼──────────┼─────────────────────────────
(marketing)       │ None    │ None    │ None     │ Public landing, pricing
(auth)            │ None*   │ None    │ None     │ Login, signup, invite, reset
(onboarding)      │ Authed  │ None    │ None     │ Academy setup, plan select
(dashboard)       │ Authed  │ Active  │ Varies   │ Main app (role-gated)
(status)          │ Authed  │ Any     │ Any      │ Suspended, cancelled pages
api/webhooks      │ None**  │ None    │ None     │ Stripe signature validation
api/cron          │ None*** │ None    │ None     │ CRON_SECRET header validation
api/trpc          │ Authed  │ Active  │ Varies   │ tRPC handler

  * (auth) redirects to /dashboard if user already has a session
  ** Webhooks validate via Stripe signature, not user auth
  *** Cron routes validate via CRON_SECRET env var in Authorization header
```

### Route → Role Mapping

```
ROUTE                          │ MINIMUM ROLE
───────────────────────────────┼─────────────────
/dashboard                     │ student
/schedule (read)               │ student
/schedule/new, /schedule/edit  │ instructor
/members (list)                │ instructor
/members/new (managed profile) │ admin (or instructor if setting on)
/members/invite                │ admin
/members/[id] (view)           │ instructor
/curriculum (read)             │ student
/curriculum/new, /edit         │ instructor
/attendance                    │ instructor
/billing                       │ admin
/billing/plans                 │ admin
/automations                   │ admin
/insights                      │ admin (instructor sees class-level)
/settings                      │ admin
/settings/permissions          │ admin
/settings/audit-log            │ admin
/settings/danger-zone          │ admin
```

---

## 3. Middleware Responsibilities

```
middleware.ts
─────────────
Runs on EVERY request except static assets (_next/static, favicon).
Runs at the Vercel Edge Runtime.

DECISION TREE:

  ┌─ Is it a public route? (/marketing, /pricing, /api/webhooks, /api/cron)
  │  YES → pass through
  │
  ├─ Is it an auth route? (/login, /signup, /invite, /reset, /callback)
  │  YES → if already authenticated with academy → redirect /dashboard
  │         if authenticated without academy → redirect /onboarding/setup
  │         else → pass through
  │
  ├─ Refresh Supabase session (cookies)
  │  FAIL → redirect /login
  │
  ├─ Is email verified?
  │  NO → redirect /verify-email
  │
  ├─ Does JWT have academy_id in app_metadata?
  │  NO → redirect /onboarding/setup (unless already on /onboarding/*)
  │
  ├─ Is it an onboarding route?
  │  YES → if HAS academy → redirect /dashboard
  │         else → pass through
  │
  ├─ Lookup academy status (cached 5min, cache-bust on changes)
  │  'deleted'   → redirect /status/reactivate (or 404)
  │  'cancelled' → redirect /status/reactivate
  │  'suspended' → redirect /status/suspended
  │  'past_due'  → pass through (banner shown in layout)
  │
  ├─ Lookup member record (cached 5min)
  │  NOT FOUND     → clear academy context, redirect /onboarding
  │  'suspended'   → redirect /status/member-suspended
  │  'inactive'    → set X-Academy-Readonly header
  │
  ├─ Check route-level role requirement
  │  FAIL → redirect /dashboard (soft 403)
  │
  └─ Pass through. Set response headers:
       X-BJJFlow-Academy-Id: {academyId}
       X-BJJFlow-Member-Id: {memberId}
       X-BJJFlow-Role: {role}
       X-BJJFlow-Academy-Status: {status}

WHAT MIDDLEWARE DOES NOT DO:
  - Does not make heavy DB queries (uses cached lookups)
  - Does not use service role (reads JWT only + lightweight cache)
  - Does not enforce row-level permissions (that's RLS + tRPC)
  - Does not check subscription plan limits (that's app layer)
```

---

## 4. Server vs Client Component Strategy

```
RULE: Server Components by default. Client Components only when needed.

SERVER COMPONENTS (default — no "use client"):
  - Page components (page.tsx) → data fetching at the route level
  - Layout components (layout.tsx) → session validation, providers
  - Data-display components → tables, cards, lists that show DB data
  - Form wrappers → server actions for form submission

  WHY: Server components have direct access to:
    - Supabase server client (reads session from cookies)
    - tRPC server-side caller (no HTTP roundtrip)
    - Environment variables
    - Full Node.js APIs

CLIENT COMPONENTS (marked with "use client"):
  - Interactive UI → forms with client-side validation, modals, dropdowns
  - Real-time features → Supabase Realtime subscriptions
  - Browser APIs → geolocation (check-in), clipboard, file upload
  - State management → academy switcher, notification bell, toasts
  - Hooks consumers → any component using React hooks

PATTERN FOR DATA + INTERACTIVITY:

  // page.tsx (server component — fetches data)
  export default async function MembersPage() {
    const { member } = await requireRole('instructor')
    const members = await trpc.member.list()
    return <MembersTable data={members} currentRole={member.role} />
  }

  // members-table.tsx (client component — handles interactions)
  "use client"
  export function MembersTable({ data, currentRole }) {
    // sorting, filtering, row actions — all client-side
  }

NEVER DO:
  - Import server/supabase/admin.ts from a client component
  - Import server/ anything from a client component (enforced by
    "server-only" package on all server/ files)
  - Fetch data in client components when a server component parent
    can pass it as props
  - Use useEffect for data that can be a server component
```

---

## 5. Lib Folder Structure

```
src/lib/ — Code that is safe to import from BOTH server and client.

lib/
├── supabase/
│   └── client.ts              # createBrowserClient() for client components
│                               # Uses NEXT_PUBLIC_SUPABASE_URL and
│                               # NEXT_PUBLIC_SUPABASE_ANON_KEY only
│
├── trpc/
│   ├── client.ts              # createTRPCClient + React Query provider
│   │                           # Used by client components to call tRPC
│   └── server.ts              # createCallerFactory for server components
│                               # Used by page.tsx to call tRPC without HTTP
│
├── validations/               # Zod schemas shared between client + server
│   ├── academy.ts             # academyCreateSchema, academyUpdateSchema
│   ├── member.ts              # memberCreateSchema, inviteSchema, etc.
│   ├── class.ts               # classCreateSchema, sessionSchema
│   ├── attendance.ts          # checkInSchema, bulkCheckInSchema
│   ├── technique.ts           # techniqueCreateSchema
│   ├── student-plan.ts        # planCreateSchema, planUpdateSchema
│   ├── automation.ts          # automationCreateSchema
│   └── auth.ts                # loginSchema, signupSchema, resetSchema
│
├── constants/                 # Pure values, no side effects
│   ├── roles.ts               # export const ROLES = ['admin','instructor','student'] as const
│   │                           # export type Role = typeof ROLES[number]
│   │                           # export const ROLE_HIERARCHY = { admin: 3, instructor: 2, student: 1 }
│   ├── plans.ts               # Plan names, limits, Stripe price IDs
│   ├── belts.ts               # Belt order, colors, display names
│   ├── routes.ts              # Route paths + role requirements
│   └── permissions.ts         # PERMISSION_MAP: { [action]: Role[] }
│
├── i18n/                      # next-intl or similar
│   ├── config.ts              # Locale setup
│   ├── pt-BR.json             # Portuguese (primary)
│   └── en.json                # English (secondary)
│
└── utils/                     # Pure functions, no dependencies on React/Next
    ├── date.ts                # formatDate(date, timezone, locale)
    ├── currency.ts            # formatCurrency(cents, currency)
    ├── slug.ts                # generateSlug(name), validateSlug(slug)
    └── cn.ts                  # cn(...classes) — Tailwind merge
```

---

## 6. Services / Repositories / Queries Organization

```
ARCHITECTURE PRINCIPLE:
  Pages → tRPC routers → query functions → Supabase client → DB (via RLS)

There are NO "service" or "repository" classes. This is a functional
architecture. Each layer is a set of functions.

LAYER 1: tRPC ROUTERS (src/server/trpc/routers/)
  - Define API contract (input schemas, output shapes)
  - Apply procedure-level auth middleware (protectedProcedure, adminProcedure)
  - Call query functions
  - Return typed results

LAYER 2: QUERY FUNCTIONS (src/server/db/queries/)
  - Reusable database operations
  - Accept parameters, return typed data
  - Use Supabase client (authenticated or admin)
  - Do NOT check permissions (that's the tRPC layer's job)
  - CAN be called from tRPC routers, server actions, or cron jobs

LAYER 3: SUPABASE CLIENTS (src/server/supabase/)
  - server.ts → per-request authenticated client (respects RLS)
  - admin.ts → service role client (bypasses RLS, server-only)
  - middleware.ts → lightweight client for middleware session refresh

WHY NOT DRIZZLE-FIRST:
  We use Supabase's client library (not raw Drizzle) for queries
  because:
    - Automatic RLS enforcement via JWT
    - Realtime integration
    - Storage integration
    - Auth helpers
  Drizzle is available for complex queries where the Supabase
  client is insufficient (aggregations, CTEs, complex JOINs).
  The Drizzle schema (src/server/db/schema.ts) serves as the
  type-safe schema definition for those cases.

SERVER ACTIONS (used sparingly):
  Server actions live IN the page file or in a co-located actions.ts.
  They are used for:
    - Form submissions that don't need tRPC (simple one-offs)
    - Academy switch (needs to update JWT, then redirect)
    - Sensitive operations that benefit from being co-located
  Server actions still call query functions — they don't access DB directly.
```

---

## 7. Validation and Schema Organization

```
PRINCIPLE: One Zod schema per domain, shared between client and server.

FILE STRUCTURE (src/lib/validations/):

  member.ts:
    memberCreateSchema      — admin creates managed profile
    memberUpdateSchema      — edit profile fields
    memberInviteSchema      — invite a member (email + role)
    memberActivateSchema    — activate managed profile
    memberRoleChangeSchema  — change role (admin only)
    memberBeltPromoteSchema — promote belt (admin/instructor)

WHERE SCHEMAS ARE USED:

  CLIENT:
    - React Hook Form resolver: zodResolver(memberCreateSchema)
    - Pre-submit validation before API call
    - Display inline errors

  SERVER:
    - tRPC input: .input(memberCreateSchema) on procedures
    - Server actions: schema.parse(formData) before DB write
    - Webhook handlers: validate payload shape

RULE: Schemas define the DATA SHAPE only. They do not check permissions.
  Permission checks happen in tRPC procedure middleware or server guards.

EXAMPLE:
  memberRoleChangeSchema = z.object({
    memberId: z.string().uuid(),
    newRole: z.enum(['admin', 'instructor', 'student']),
  })
  // This schema does NOT check if the caller is admin.
  // The adminProcedure middleware handles that.
```

---

## 8. Types Organization

```
src/types/

  database.ts
    Generated from Supabase: npx supabase gen types typescript
    Contains: Database, Tables, Enums interfaces
    NEVER manually edited — regenerated on schema changes.

  domain.ts
    Business domain types derived from database types:
      type Academy = Tables<'academies'>
      type Member = Tables<'members'>
      type MemberWithAcademy = Member & { academy: Academy }
      type ClassWithSessions = Tables<'classes'> & {
        sessions: Tables<'class_sessions'>[]
      }
    These are the types used in components and routers.

  auth.ts
    type SessionContext = {
      userId: string
      academyId: string
      memberId: string
      role: Role
      academyStatus: AcademyStatus
      memberStatus: MemberStatus
    }
    type JWTPayload = { ... }

  stripe.ts
    type StripePlan = { id: string; name: string; ... }
    type StripeWebhookEvent = Stripe.Event
    Stripe SDK types re-exported for convenience.

  trpc.ts
    export type AppRouter = typeof appRouter
    Used by the client-side tRPC setup to get type inference.
```

---

## 9. UI Component Organization

```
src/components/

PRINCIPLE: Components are organized by SCOPE, not by type.

  ui/             → shadcn/ui primitives. Unopinionated. No business logic.
                    Installed via: npx shadcn-ui@latest add button
                    NEVER import from server modules.

  providers/      → React context providers. Wrap the app in layout.tsx.
                    tenant-provider: exposes academy data to children
                    member-provider: exposes member + role to children
                    trpc-provider: React Query + tRPC
                    theme-provider: light/dark mode

  layouts/        → Structural components used by layout.tsx files.
                    sidebar, header, mobile-nav, academy-switcher.
                    These ARE client components (interactive navigation).

  forms/          → Form components using React Hook Form + Zod.
                    Each form is a client component ("use client").
                    Forms receive onSubmit handlers from server parents.
                    Forms do NOT call APIs directly — they call the handler.

  data-tables/    → Table components using @tanstack/react-table.
                    Client components for sorting/filtering/pagination.
                    Receive data as props from server component parents.

  cards/          → Summary/stat cards for dashboards.
                    Can be server or client depending on interactivity.

  schedule/       → Schedule-domain components (calendar, roster).
  curriculum/     → Curriculum-domain components (browser, player).

  shared/         → Cross-cutting utilities:
                    role-gate: conditionally render by role
                    belt-badge: colored belt display
                    confirm-dialog: "Are you sure?" modal
                    empty-state: "No data yet" placeholder

NAMING CONVENTION:
  - Component files: kebab-case (member-card.tsx)
  - Component exports: PascalCase (MemberCard)
  - One component per file (no barrel exports in component dirs)
  - Co-located styles: same file (Tailwind) or .module.css
```

---

## 10. Integration Boundaries

### 10.1 Supabase

```
BOUNDARY: src/server/supabase/ and src/lib/supabase/

  server/supabase/server.ts   — createServerClient() per request
    Used by: tRPC context, server components, server actions
    Auth: reads session from cookies (RLS-enforced)

  server/supabase/admin.ts    — createServiceRoleClient()
    Used by: webhooks, cron, invite acceptance, academy switch
    Auth: service role key (BYPASSES RLS)
    IMPORT GUARD: "server-only" package prevents client import

  server/supabase/middleware.ts — createMiddlewareClient()
    Used by: middleware.ts only
    Auth: refreshes session, reads JWT claims

  lib/supabase/client.ts      — createBrowserClient()
    Used by: client components (Realtime subscriptions only)
    Auth: reads session from cookies (RLS-enforced)
    NEVER used for data fetching (use tRPC instead)

RULE: Client components NEVER query Supabase directly for data.
      They use tRPC hooks. The only client-side Supabase usage is
      Realtime subscriptions (attendance live updates).
```

### 10.2 Stripe

```
BOUNDARY: src/server/stripe/

  client.ts     — Stripe SDK initialization
  plans.ts      — Plan definitions (BRL + EUR prices)
  checkout.ts   — createCheckoutSession(userId, plan, locale)
  portal.ts     — createPortalSession(stripeCustomerId)
  webhooks.ts   — handleWebhookEvent(event) dispatches by event type

FLOW:
  Client → tRPC billing.createCheckout → server/stripe/checkout.ts → Stripe API
  Stripe → api/webhooks/stripe/route.ts → server/stripe/webhooks.ts → DB via admin client

RULE: Stripe secret key lives ONLY in server/stripe/client.ts.
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is the only client-exposed key.
```

### 10.3 Automations

```
BOUNDARY: src/server/automation/

  engine.ts     — evaluateTriggers(), dispatchAction()
  triggers.ts   — Trigger handlers: schedule, event, condition
  actions.ts    — Action executors: notification, email, webhook, etc.

ENTRY POINTS:
  - Cron route: api/cron/subscription-check → calls engine.ts
  - Supabase Edge Function (future): event-driven triggers
  - Manual run: tRPC automation.runNow → calls engine.ts

RULE: Automations always use the admin Supabase client (service role)
      because they run without user context (cron-initiated).
      Every automation run is logged to automation_runs + automation_logs.
```

### 10.4 AI

```
BOUNDARY: src/server/ai/

  pipeline.ts   — Orchestrates insight generation
  analyzers/    — One file per insight type
  types.ts      — InsightInput, InsightOutput, AnalyzerConfig

ENTRY POINTS:
  - Cron route (future): nightly analysis
  - Automation action: create_ai_insight trigger
  - Admin manual: tRPC insight.regenerate

RULE: AI pipeline reads data via admin client (aggregations across
      academy). Writes insights to ai_insights table via admin client.
      All AI output is stored in the DB — never streamed directly
      to the client from an LLM.
```

---

## 11. Where Academy Context Should Be Resolved

```
THERE IS EXACTLY ONE SOURCE OF TRUTH: JWT app_metadata.academy_id

RESOLUTION CHAIN:

  1. middleware.ts
     → Reads JWT via Supabase middleware client
     → Extracts academy_id from app_metadata
     → Validates academy exists and is active (cached)
     → Validates member exists and is active (cached)
     → Sets response headers (X-BJJFlow-Academy-Id, etc.)
     → Does NOT pass academy_id via URL or cookie

  2. tRPC context (server/trpc/init.ts)
     → Creates Supabase server client (reads JWT from cookies)
     → Extracts session.user.app_metadata.academy_id
     → Queries member record for role
     → Sets ctx.academyId, ctx.memberId, ctx.role
     → EVERY procedure inherits this context

  3. Server components (page.tsx)
     → Call requireRole() from server/auth/guards.ts
     → requireRole() reads session, extracts academy_id, queries member
     → Returns { session, member, academy } for the page to use

  4. Client components (via providers)
     → tenant-provider.tsx receives academy data from layout.tsx
     → member-provider.tsx receives member data from layout.tsx
     → Both are SERVER COMPONENT parents passing to CLIENT children
     → Client components NEVER extract academy_id from JWT directly

WHERE ACADEMY CONTEXT MUST NEVER COME FROM:
  ✗ URL parameters (?academy_id=...)
  ✗ Route segments (/academy/[academyId]/...)
  ✗ Request headers set by the client
  ✗ Cookies set by JavaScript
  ✗ localStorage / sessionStorage
  ✗ tRPC input parameters
```

---

## 12. Where Permission Checks Should Happen

```
PERMISSION CHECK LAYERS (defense in depth):

  LAYER 1: RLS (database)
  ───────────────────────
    WHO:   PostgreSQL, automatic
    WHAT:  Tenant isolation (academy_id), admin-only billing
    WHERE: Every query via authenticated Supabase client
    HOW:   Policies from 00002_rls.sql
    WHEN:  Always. Cannot be bypassed except by service role.

  LAYER 2: tRPC procedure middleware (server)
  ───────────────────────────────────────────
    WHO:   tRPC middleware chain
    WHAT:  Role-based access (admin, instructor, student)
    WHERE: src/server/trpc/procedures.ts
    HOW:   protectedProcedure → instructorProcedure → adminProcedure
    WHEN:  Every tRPC call, before the resolver executes.

    protectedProcedure:   requires authenticated + active academy + active member
    instructorProcedure:  requires role in ['admin', 'instructor']
    adminProcedure:       requires role = 'admin'

  LAYER 3: Resource ownership (server, in resolver)
  ─────────────────────────────────────────────────
    WHO:   Individual tRPC resolvers
    WHAT:  "Can this user modify THIS specific resource?"
    WHERE: Inside each router's mutation resolver
    HOW:   Check created_by, instructor_id, member_id, etc.
    WHEN:  For UPDATE/DELETE operations on specific rows.

    EXAMPLES:
      - Student can update own profile but not others'
      - Instructor can edit classes they created (if setting restricts)
      - Only the member who created a technique can edit it

  LAYER 4: Academy settings (server, in resolver)
  ──────────────────────────────────────────────
    WHO:   Individual tRPC resolvers
    WHAT:  Feature-gated actions
    WHERE: Inside resolvers that check academy.settings
    HOW:   Read allow_student_self_checkin, instructor_can_add_students, etc.
    WHEN:  Before executing actions gated by academy config.

  LAYER 5: Middleware route protection (edge)
  ──────────────────────────────────────────
    WHO:   Next.js middleware
    WHAT:  Route-level access (which pages can this role visit?)
    WHERE: middleware.ts
    HOW:   Route → role mapping from lib/constants/routes.ts
    WHEN:  On every navigation. Redirects unauthorized users.

  LAYER 6: UI visibility (client, UX only)
  ───────────────────────────────────────
    WHO:   React components
    WHAT:  Show/hide UI elements by role
    WHERE: components using <RoleGate> or useRole()
    HOW:   Conditional rendering
    WHEN:  Render time only. THIS IS NOT SECURITY.
    RULE:  Every UI-hidden action MUST also be blocked by Layer 2-4.

CHECK ORDER ON A TYPICAL REQUEST:
  Client clicks "Delete Member"
  → Layer 6: Button was visible (role=admin) ← UX
  → Layer 5: Route /members/[id] is accessible ← middleware
  → Layer 2: adminProcedure checks role ← tRPC
  → Layer 3: Resolver checks memberId != self ← ownership
  → Layer 1: RLS confirms academy_id ← database
  → DELETE executes
```

---

## 13. Recommended Naming Conventions

```
FILES:
  kebab-case for all files: member-form.tsx, use-tenant.ts
  Exception: page.tsx, layout.tsx, route.ts (Next.js conventions)
  Exception: UPPERCASE for root config: README.md, ARCHITECTURE.md

COMPONENTS:
  PascalCase exports: export function MemberForm() {}
  One component per file (no multi-export component files)
  Props type: interface MemberFormProps {} (not type, for declaration merging)

TYPES:
  PascalCase for types/interfaces: type Member = ...
  Suffix with Context for React contexts: type TenantContext = ...
  Suffix with Schema for Zod schemas: const memberCreateSchema = z.object(...)

VARIABLES:
  camelCase: const academyId = ...
  UPPER_SNAKE for constants: const MAX_INVITES_PER_DAY = 20

tRPC:
  Router names: singular noun (member, class, billing)
  Procedure names: verb + noun (list, getById, create, update, delete)
  Full path: trpc.member.list, trpc.class.create

DATABASE COLUMNS:
  snake_case: academy_id, belt_rank, created_at
  (Matches PostgreSQL convention. TypeScript types use camelCase via
  Supabase type generation.)

ROUTES:
  kebab-case: /forgot-password, /audit-log, /danger-zone
  Dynamic segments: [memberId], [classId], [sessionId]

ENVIRONMENT VARIABLES:
  NEXT_PUBLIC_ prefix for client-exposed values
  No prefix for server-only values
  Examples:
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    SUPABASE_SERVICE_ROLE_KEY
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    CRON_SECRET
    RESEND_API_KEY
```

---

## 14. Recommended App Architecture Mistakes to Avoid

```
 1. IMPORTING server/ FROM CLIENT COMPONENTS
    ─────────────────────────────────────────
    Every file in src/server/ must start with:
      import "server-only"
    This causes a build error if any client component imports it.
    The service role key MUST NEVER reach the browser.

 2. FETCHING DATA IN CLIENT COMPONENTS
    ──────────────────────────────────
    Client components should receive data as props from server
    component parents. Use tRPC hooks ONLY when the client needs
    to trigger a mutation or refetch after an action.
    NEVER useEffect + fetch for initial data load.

 3. PUTTING ACADEMY_ID IN THE URL
    ─────────────────────────────
    /academy/[academyId]/members is WRONG. Academy context comes
    from the JWT. URL-based academy_id is a confused deputy vector.
    The URL should be /members. Period.

 4. CREATING GOD COMPONENTS
    ──────────────────────
    A page.tsx that is 500 lines of JSX with inline data fetching,
    permission checks, and form handling. Instead:
      page.tsx → server component, fetches data, passes to children
      children → client components for interaction

 5. DUPLICATING VALIDATION
    ─────────────────────
    Do NOT have one Zod schema on the client and a different one
    on the server. Single source in lib/validations/, imported by
    both React Hook Form and tRPC input().

 6. CHECKING PERMISSIONS ONLY IN MIDDLEWARE
    ──────────────────────────────────────
    Middleware prevents navigation to unauthorized pages. But a
    user can still call the tRPC endpoint directly. EVERY
    mutation must have its own role check in the procedure chain.

 7. USING SUPABASE CLIENT FOR DATA QUERIES IN CLIENT COMPONENTS
    ──────────────────────────────────────────────────────────
    The browser Supabase client should be used ONLY for:
      - Auth state changes (onAuthStateChange)
      - Realtime subscriptions
    All data queries go through tRPC (which calls Supabase server-side).
    This keeps the API surface centralized and type-safe.

 8. HARDCODING ROLES AS STRINGS
    ──────────────────────────
    Do NOT: if (member.role === 'admin')
    DO: if (hasMinRole(member.role, 'admin'))
    Or: if (canPerform(member.role, 'manage_billing'))
    Use the permission map from lib/constants/permissions.ts.

 9. SKIPPING THE LOADING AND ERROR STATES
    ────────────────────────────────────
    Every page.tsx should have a corresponding loading.tsx and
    error.tsx in the same directory. Next.js App Router uses these
    for Suspense boundaries and error catching automatically.

10. MAKING tRPC ROUTERS TOO GRANULAR OR TOO MONOLITHIC
    ──────────────────────────────────────────────────
    BAD: One router per database table (20+ routers).
    BAD: One mega-router for everything.
    GOOD: One router per business domain (12 routers).
    The domain map:
      academy, member, class, attendance, curriculum,
      billing, student-plan, invite, notification,
      automation, insight, audit

11. IGNORING ACADEMY STATUS IN WRITE OPERATIONS
    ──────────────────────────────────────────
    Middleware redirects suspended academies. But if the middleware
    check is cached and stale, a write could slip through.
    tRPC protectedProcedure should ALSO verify academy status
    is in ['active', 'trialing'] before allowing mutations.

12. NOT HANDLING THE "NO ACADEMY YET" STATE
    ─────────────────────────────────────
    A freshly signed-up user who hasn't completed onboarding has
    NO academy_id in their JWT. Every server component that calls
    requireRole() will throw. The onboarding layout must use a
    different auth check (requireSession() only, no academy needed).
```

---

## Appendix: File Count Estimates

```
CATEGORY                │ FILES  │ NOTES
────────────────────────┼────────┼─────────────────────────
app/ pages + layouts     │  ~35   │ Route segments
app/ API routes          │   5    │ webhooks, cron, trpc
server/ auth             │   4    │ Session, member, guards, switch
server/ supabase         │   3    │ server, admin, middleware
server/ db queries       │  11    │ One per domain
server/ trpc routers     │  12    │ One per domain
server/ stripe           │   5    │ Client, plans, checkout, portal, webhooks
server/ email            │   7    │ Client + 6 templates
server/ automation       │   3    │ Engine, triggers, actions
server/ ai               │   5    │ Pipeline + 3 analyzers + types
lib/ validations         │   8    │ One per domain
lib/ constants           │   5    │ Roles, plans, belts, routes, permissions
lib/ utils               │   4    │ Date, currency, slug, cn
lib/ supabase + trpc     │   3    │ Client, trpc client, trpc server
types/                   │   5    │ Database, domain, auth, stripe, trpc
hooks/                   │   5    │ Tenant, member, role, realtime, debounce
components/              │ ~40    │ UI + providers + forms + tables + cards
tests/                   │ ~15    │ E2E + integration + unit
────────────────────────┼────────┼─────────────────────────
TOTAL                   │ ~175   │ Manageable for a 2-4 person team
```
