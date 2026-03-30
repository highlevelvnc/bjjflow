# BJJFlow - System Architecture

## 1. High-Level Architecture

```
                         ┌─────────────────────────────┐
                         │        CDN (Vercel Edge)     │
                         │   Static Assets + Edge SSR   │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │     Next.js App (Vercel)      │
                         │                               │
                         │  ┌─────────┐  ┌────────────┐ │
                         │  │  Pages  │  │ API Routes │ │
                         │  │  (RSC)  │  │ /api/*     │ │
                         │  └─────────┘  └─────┬──────┘ │
                         │                     │        │
                         └─────────────────────┼────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
         ┌──────────▼──────────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐
         │      Supabase       │   │       Stripe        │   │   External Services │
         │                     │   │                     │   │                     │
         │  - Auth (GoTrue)    │   │  - Subscriptions    │   │  - Resend (email)   │
         │  - PostgreSQL       │   │  - Checkout         │   │  - Uploadthing      │
         │  - RLS Policies     │   │  - Customer Portal  │   │    (media storage)  │
         │  - Realtime         │   │  - Webhooks         │   │  - PostHog          │
         │  - Edge Functions   │   │  - Multi-currency   │   │    (analytics)      │
         │  - Storage          │   │    (BRL + EUR)      │   │  - Sentry (errors)  │
         └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Core Principle: Database-Level Isolation

Every query is scoped by `academy_id`. Row Level Security (RLS) enforces this
at the PostgreSQL level, making it impossible for one tenant to access another's
data even if application code has a bug.

---

## 2. Multi-Tenant Strategy (Detailed)

### 2.1 Tenancy Model: Shared Database, Shared Schema, RLS-Isolated

We use a **single PostgreSQL database** with a **shared schema** where every
tenant table includes an `academy_id` column. This is the optimal balance of:

- **Cost efficiency** (single DB instance)
- **Operational simplicity** (one migration path)
- **Strong isolation** (RLS at the Postgres level)
- **Scale readiness** (can shard later by academy_id ranges)

```
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Instance                      │
│                                                             │
│  ┌─────────────┐  Every table has academy_id column         │
│  │  academies  │◄─────────────────────────────────┐        │
│  └──────┬──────┘                                   │        │
│         │                                          │        │
│  ┌──────▼──────┐  ┌──────────────┐  ┌─────────────┤        │
│  │   members   │  │   classes    │  │  payments   │        │
│  │ academy_id  │  │ academy_id   │  │ academy_id  │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
│                                                             │
│  RLS Policy on EVERY table:                                 │
│  academy_id = get_current_academy_id()                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Academy Identification

Each academy gets a **slug** used for subdomain or path routing:

| Strategy | URL | Pros | Cons |
|---|---|---|---|
| **Subdomain** (primary) | `gracie-barra.bjjflow.com` | Clean, professional | DNS/SSL complexity |
| **Path fallback** | `bjjflow.com/app/gracie-barra` | Simple setup | Less clean |
| **Custom domain** (premium) | `app.gracie-barra.com` | White-label | CNAME + SSL management |

**Resolution flow:**

```
Request → Extract slug from hostname/path
        → Lookup academy by slug (cached 5min)
        → Set academy_id in Supabase JWT custom claim
        → All subsequent queries auto-filtered by RLS
```

### 2.3 RLS Implementation

```sql
-- Helper function: extract academy_id from JWT
CREATE OR REPLACE FUNCTION get_current_academy_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Example RLS policy (applied to EVERY tenant table)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON members
  FOR ALL
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());

-- Service role bypass for webhooks/cron (no RLS)
-- Used ONLY in server-side API routes with supabaseAdmin client
```

### 2.4 Academy Lifecycle

```
Academy Creation:
  1. Owner signs up → Supabase Auth creates user
  2. Stripe Customer created → linked to user
  3. Stripe Checkout → selects plan (BR or EU pricing)
  4. Webhook: checkout.session.completed
     → Insert into academies table
     → Insert into subscriptions table
     → Set academy_id in user's app_metadata
     → Create default data (belt ranks, class templates)
  5. Redirect to onboarding wizard

Academy Suspension:
  - Stripe webhook: invoice.payment_failed (after retries)
  - Set academy.status = 'past_due'
  - After 30 days: status = 'suspended' → read-only mode
  - After 90 days: status = 'cancelled' → data export offered

Academy Deletion:
  - Soft delete: status = 'deleted', data retained 30 days
  - Hard delete: cascade delete all tenant data + Stripe cleanup
```

### 2.5 Data Isolation Verification

```sql
-- Audit query: find any rows without academy_id (run in CI)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name NOT IN ('schema_migrations', 'spatial_ref_sys')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'academy_id'
    ) THEN
      RAISE WARNING 'Table % missing academy_id column', tbl;
    END IF;
  END LOOP;
END $$;
```

---

## 3. Folder Structure (Next.js App Router)

```
bjjflow/
├── .env.local                          # Local secrets (never committed)
├── .env.example                        # Template for team
├── next.config.ts
├── middleware.ts                        # Tenant resolution + auth guard
├── supabase/
│   ├── migrations/                     # Sequential SQL migrations
│   │   ├── 00001_create_academies.sql
│   │   ├── 00002_create_members.sql
│   │   ├── 00003_create_classes.sql
│   │   ├── 00004_create_payments.sql
│   │   ├── 00005_create_curriculum.sql
│   │   └── 00006_rls_policies.sql
│   ├── seed.sql                        # Dev seed data
│   └── config.toml
│
├── src/
│   ├── app/
│   │   ├── (marketing)/                # Public marketing site
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/                     # Auth pages (no tenant context)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (onboarding)/               # Post-signup academy setup
│   │   │   ├── setup/page.tsx          # Academy name, slug, timezone
│   │   │   ├── plan/page.tsx           # Stripe checkout
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                # Authenticated tenant app
│   │   │   ├── layout.tsx              # Sidebar + tenant context provider
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   │
│   │   │   ├── schedule/               # Class schedule management
│   │   │   │   ├── page.tsx            # Weekly calendar view
│   │   │   │   └── [classId]/page.tsx  # Class detail + attendance
│   │   │   │
│   │   │   ├── members/                # Student/instructor management
│   │   │   │   ├── page.tsx            # Members list
│   │   │   │   ├── [memberId]/page.tsx # Profile + history
│   │   │   │   └── invite/page.tsx     # Invite flow
│   │   │   │
│   │   │   ├── curriculum/             # Technique library
│   │   │   │   ├── page.tsx            # Browse by belt/position
│   │   │   │   └── [techniqueId]/page.tsx
│   │   │   │
│   │   │   ├── billing/                # Stripe portal + history
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/               # Academy settings
│   │   │       ├── page.tsx            # General
│   │   │       ├── roles/page.tsx      # Role management
│   │   │       └── integrations/page.tsx
│   │   │
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── stripe/route.ts     # Stripe webhook handler
│   │       ├── cron/
│   │       │   └── subscription-check/route.ts
│   │       └── trpc/[trpc]/route.ts    # tRPC API handler
│   │
│   ├── server/                         # Server-only code
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle schema definitions
│   │   │   ├── index.ts               # DB client
│   │   │   └── queries/               # Reusable query functions
│   │   │       ├── academies.ts
│   │   │       ├── members.ts
│   │   │       ├── classes.ts
│   │   │       └── payments.ts
│   │   ├── trpc/
│   │   │   ├── root.ts                # tRPC root router
│   │   │   ├── trpc.ts                # tRPC init + context
│   │   │   └── routers/
│   │   │       ├── academy.ts
│   │   │       ├── member.ts
│   │   │       ├── class.ts
│   │   │       ├── curriculum.ts
│   │   │       └── billing.ts
│   │   ├── stripe/
│   │   │   ├── client.ts              # Stripe SDK init
│   │   │   ├── plans.ts               # Plan definitions (BR + EU)
│   │   │   ├── webhooks.ts            # Webhook event handlers
│   │   │   └── portal.ts              # Customer portal helpers
│   │   └── auth/
│   │       ├── supabase-server.ts      # Server-side Supabase client
│   │       ├── supabase-admin.ts       # Admin client (bypasses RLS)
│   │       └── permissions.ts          # Role-based access checks
│   │
│   ├── lib/                            # Shared utilities
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   └── middleware.ts           # Middleware Supabase client
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── i18n/
│   │       ├── config.ts
│   │       ├── pt-BR.json
│   │       └── en.json
│   │
│   ├── components/
│   │   ├── ui/                         # Primitives (shadcn/ui)
│   │   ├── forms/                      # Form components
│   │   ├── dashboard/                  # Dashboard-specific
│   │   │   ├── sidebar.tsx
│   │   │   ├── class-calendar.tsx
│   │   │   └── member-table.tsx
│   │   └── providers/
│   │       ├── tenant-provider.tsx     # Academy context
│   │       ├── trpc-provider.tsx
│   │       └── theme-provider.tsx
│   │
│   ├── hooks/
│   │   ├── use-tenant.ts              # Current academy context
│   │   ├── use-role.ts                # Current user's role
│   │   └── use-realtime.ts            # Supabase realtime wrapper
│   │
│   └── types/
│       ├── database.ts                 # Generated from Supabase
│       ├── stripe.ts
│       └── domain.ts                   # Business domain types
│
├── packages/                           # Future: shared packages
│   └── emails/                         # React Email templates
│       ├── welcome.tsx
│       ├── class-reminder.tsx
│       └── payment-failed.tsx
│
└── tests/
    ├── e2e/                            # Playwright
    ├── integration/                    # API + DB tests
    └── unit/
```

---

## 4. Auth Flow

### 4.1 Authentication (Supabase Auth)

```
┌──────────────────────────────────────────────────────────────────┐
│                        Auth Flow                                  │
│                                                                  │
│  1. SIGNUP                                                       │
│     User → Supabase Auth (email/password or Google OAuth)        │
│     → Email verification sent                                    │
│     → On verify: redirect to /onboarding/setup                   │
│     → User creates academy (name, slug, timezone)                │
│     → Stripe Checkout → webhook creates subscription             │
│     → Set JWT custom claims: { academy_id, role: 'admin' }      │
│                                                                  │
│  2. LOGIN                                                        │
│     User → Supabase Auth → JWT issued                            │
│     → Middleware reads JWT, extracts academy_id                   │
│     → Resolves tenant, sets context                              │
│     → Redirect to /dashboard                                     │
│                                                                  │
│  3. INVITE (student/instructor joins existing academy)           │
│     Admin generates invite link with token                       │
│     → Invitee clicks link → signup/login                         │
│     → Token validated → user added to academy as member          │
│     → JWT updated with academy_id + assigned role                │
│                                                                  │
│  4. MULTI-ACADEMY (instructor at multiple academies)             │
│     User belongs to N academies via members table                │
│     → Academy switcher in UI                                     │
│     → Switching updates active academy_id in session             │
│     → JWT refreshed with new academy_id claim                    │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Authorization (RBAC)

```
Permission Matrix:
┌──────────────────────┬───────┬────────────┬─────────┐
│ Action               │ Admin │ Instructor │ Student │
├──────────────────────┼───────┼────────────┼─────────┤
│ Manage billing       │  ✅   │     ❌     │   ❌    │
│ Invite members       │  ✅   │     ❌     │   ❌    │
│ Manage roles         │  ✅   │     ❌     │   ❌    │
│ Academy settings     │  ✅   │     ❌     │   ❌    │
│ Create/edit classes  │  ✅   │     ✅     │   ❌    │
│ Take attendance      │  ✅   │     ✅     │   ❌    │
│ Manage curriculum    │  ✅   │     ✅     │   ❌    │
│ View all members     │  ✅   │     ✅     │   ❌    │
│ View schedule        │  ✅   │     ✅     │   ✅    │
│ Check-in to class    │  ✅   │     ✅     │   ✅    │
│ View own profile     │  ✅   │     ✅     │   ✅    │
│ View curriculum      │  ✅   │     ✅     │   ✅    │
└──────────────────────┴───────┴────────────┴─────────┘
```

**Implementation: middleware.ts**

```typescript
// Pseudocode for the middleware chain
export async function middleware(request: NextRequest) {
  // 1. Public routes → pass through
  if (isPublicRoute(request)) return NextResponse.next();

  // 2. Refresh Supabase session (cookie-based)
  const { supabase, response } = createMiddlewareClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // 3. No session → redirect to login
  if (!session) return redirect('/login');

  // 4. No academy_id in claims → redirect to onboarding
  const academyId = session.user.app_metadata.academy_id;
  if (!academyId) return redirect('/onboarding/setup');

  // 5. Check academy status (cached)
  const academy = await getAcademy(academyId); // 5min cache
  if (academy.status === 'suspended') return redirect('/suspended');

  // 6. Role-based route protection
  const role = getMemberRole(session.user.id, academyId);
  if (!hasRouteAccess(request.pathname, role)) {
    return redirect('/dashboard'); // 403 → redirect home
  }

  return response;
}
```

---

## 5. Data Flow

### 5.1 Database Schema (Core Tables)

```sql
-- TENANT
CREATE TABLE academies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,  -- used in URL
  timezone      text NOT NULL DEFAULT 'America/Sao_Paulo',
  locale        text NOT NULL DEFAULT 'pt-BR',
  currency      text NOT NULL DEFAULT 'BRL',  -- BRL or EUR
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('trialing','active','past_due','suspended','cancelled','deleted')),
  stripe_customer_id   text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan          text NOT NULL DEFAULT 'starter',
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- NO RLS on academies (queried by slug before tenant context exists)
-- Protected by: only service role can write, authenticated can read own

-- MEMBERS (junction: users ↔ academies)
CREATE TABLE members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'student'
                CHECK (role IN ('admin', 'instructor', 'student')),
  display_name  text NOT NULL,
  belt_rank     text NOT NULL DEFAULT 'white',
  stripes       int NOT NULL DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(academy_id, user_id)
);
CREATE INDEX idx_members_academy ON members(academy_id);
CREATE INDEX idx_members_user ON members(user_id);

-- CLASSES
CREATE TABLE classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name          text NOT NULL,           -- "Fundamentals", "Competition"
  description   text,
  instructor_id uuid REFERENCES members(id),
  day_of_week   int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  max_students  int,
  is_recurring  boolean NOT NULL DEFAULT true,
  tags          text[] DEFAULT '{}',     -- ["gi", "no-gi", "kids"]
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_classes_academy ON classes(academy_id);

-- CLASS SESSIONS (individual occurrences)
CREATE TABLE class_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  class_id      uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date          date NOT NULL,
  instructor_id uuid REFERENCES members(id),
  notes         text,
  status        text NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, date)
);
CREATE INDEX idx_sessions_academy_date ON class_sessions(academy_id, date);

-- ATTENDANCE
CREATE TABLE attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id    uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid REFERENCES members(id),  -- instructor or self
  UNIQUE(session_id, member_id)
);
CREATE INDEX idx_attendance_academy ON attendance(academy_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);

-- CURRICULUM
CREATE TABLE techniques (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  position      text,                    -- "guard", "mount", "back"
  category      text,                    -- "sweep", "submission", "pass"
  belt_level    text NOT NULL DEFAULT 'white',
  video_url     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_techniques_academy ON techniques(academy_id);

-- PAYMENTS (academy-level, synced from Stripe)
CREATE TABLE payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  stripe_invoice_id  text UNIQUE,
  amount_cents  int NOT NULL,
  currency      text NOT NULL,
  status        text NOT NULL,           -- mirrors Stripe status
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_academy ON payments(academy_id);

-- INVITES
CREATE TABLE invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'student',
  token         text UNIQUE NOT NULL,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at   timestamptz,
  invited_by    uuid NOT NULL REFERENCES members(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_token ON invites(token);
```

### 5.2 Stripe Integration

```
PLANS:
┌────────────┬──────────────┬──────────────┬───────────────┐
│ Plan       │ BRL (Brazil) │ EUR (Europe) │ Limits        │
├────────────┼──────────────┼──────────────┼───────────────┤
│ Starter    │ R$ 97/mo     │ EUR 29/mo    │ 50 members    │
│ Growth     │ R$ 197/mo    │ EUR 59/mo    │ 200 members   │
│ Pro        │ R$ 397/mo    │ EUR 99/mo    │ Unlimited     │
│ Enterprise │ Custom       │ Custom       │ Custom        │
└────────────┴──────────────┴──────────────┴───────────────┘

Webhook Events Handled:
  checkout.session.completed  → Create academy + subscription record
  invoice.paid                → Record payment, ensure active status
  invoice.payment_failed      → Mark past_due, notify admin
  customer.subscription.updated → Sync plan changes
  customer.subscription.deleted → Mark cancelled
```

### 5.3 Key Data Flows

```
STUDENT CHECK-IN FLOW:
  Student opens app → sees today's schedule
  → Taps "Check In" on current class
  → API: POST /api/trpc/class.checkIn
    → Verify: session exists for today
    → Verify: member is active
    → Verify: class not full (if max_students set)
    → Insert attendance record
    → Realtime: broadcast to instructor's attendance view
  → UI updates with confirmation

INSTRUCTOR ATTENDANCE FLOW:
  Instructor opens class session → sees member list
  → Taps members present → bulk check-in
  → API: POST /api/trpc/class.bulkCheckIn
    → Insert multiple attendance records
    → Optionally add session notes + techniques covered
  → Realtime: students see their attendance updated

ACADEMY ONBOARDING FLOW:
  Signup → Supabase creates auth.user
  → /onboarding/setup: academy name, slug, timezone, locale
  → /onboarding/plan: Stripe Checkout (locale-aware pricing)
  → Stripe webhook → creates academy + subscription + member(admin)
  → Redirect to /dashboard with confetti
  → Onboarding checklist: invite first instructor, create first class
```

---

## 6. Security Considerations

### 6.1 Tenant Isolation (Critical)

| Layer | Mechanism |
|---|---|
| **Database** | RLS on every tenant table. `academy_id = get_current_academy_id()` |
| **Application** | Middleware injects tenant context. No raw queries without academy scope |
| **API** | tRPC context includes `academyId`. Every procedure validates it |
| **Storage** | Supabase Storage buckets scoped by `academy_id/` prefix |
| **Caching** | All cache keys prefixed with `academy:{id}:` |

### 6.2 Authentication Security

- **Password policy**: minimum 8 chars, enforced by Supabase
- **Session management**: HTTP-only cookies, SameSite=Lax, Secure flag
- **JWT**: short-lived access tokens (1 hour), refresh token rotation
- **OAuth**: Google provider for convenience (no password fatigue)
- **Email verification**: required before any academy creation
- **Rate limiting**: Supabase built-in + custom on sensitive endpoints

### 6.3 API Security

```typescript
// Every tRPC procedure wraps with tenant + role check
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' });
  if (!ctx.academyId) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx: { ...ctx, academyId: ctx.academyId, role: ctx.role } });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});

const instructorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['admin', 'instructor'].includes(ctx.role))
    throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});
```

### 6.4 Stripe Webhook Security

```typescript
// Verify webhook signature - CRITICAL
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  // Process with idempotency (Stripe may retry)
  await processWebhookEvent(event);
  return new Response('ok', { status: 200 });
}
```

### 6.5 Data Protection

| Concern | Solution |
|---|---|
| **PII at rest** | Supabase encrypts at rest (AES-256) |
| **PII in transit** | TLS 1.3 everywhere |
| **LGPD (Brazil)** | Data export endpoint, deletion endpoint, consent tracking |
| **GDPR (Europe)** | Same as above + DPA with Supabase |
| **Backup** | Supabase daily backups + point-in-time recovery (Pro plan) |
| **Audit log** | `audit_log` table tracking admin actions with IP + user agent |

### 6.6 Input Validation

- **Zod schemas** on every tRPC input (shared with frontend forms)
- **SQL injection**: impossible with Drizzle ORM parameterized queries + RLS
- **XSS**: React auto-escapes, CSP headers via `next.config.ts`
- **CSRF**: SameSite cookies + Supabase PKCE flow

### 6.7 Rate Limiting & Abuse Prevention

```
Middleware-level:
  - Auth endpoints: 5 req/min per IP
  - API routes: 100 req/min per user
  - Webhooks: Stripe signature validation (no rate limit needed)

Application-level:
  - Invite sending: 20/day per academy
  - Academy creation: 3/day per user (prevent spam)
  - File uploads: 50MB/file, 1GB/academy (Starter plan)
```

### 6.8 Infrastructure Security

- **Environment variables**: Vercel encrypted env vars, never in code
- **Supabase**: service role key ONLY in server-side code, never exposed to client
- **Stripe**: secret key server-only, publishable key client-only
- **Monitoring**: Sentry for errors, PostHog for product analytics
- **Dependency scanning**: `npm audit` in CI, Dependabot enabled

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Multi-tenancy | Shared DB + RLS | Cost-efficient, strong isolation, simple ops |
| API layer | tRPC | End-to-end type safety, great DX with Next.js |
| ORM | Drizzle | Lightweight, type-safe, great Supabase compat |
| Payments | Stripe only | Global reach, multi-currency, reliable webhooks |
| Email | Resend | Developer-friendly, React Email templates |
| i18n | next-intl | PT-BR first, then EN/ES expansion |
| Components | shadcn/ui | Customizable, accessible, no vendor lock-in |
| Deployment | Vercel | Zero-config Next.js, edge functions, preview deploys |
| Realtime | Supabase Realtime | Already in stack, good enough for attendance updates |
