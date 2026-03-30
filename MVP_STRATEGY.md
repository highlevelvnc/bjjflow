# BJJFlow — MVP Strategy

> Ship fast. Charge money. Beat the competition.
> This document defines what to build, in what order, and why.

---

## The One-Line MVP Thesis

**A BJJ academy owner signs up, creates classes, adds students, takes
attendance, and sees who's about to quit — in under 5 minutes.**

That sentence contains the entire MVP. Everything below is in service of it.

---

## 1. MVP Features (v1.0 — 6-8 weeks)

### CORE: What ships on launch day

```
FEATURE                          │ WHY IT'S IN MVP                       │ TABLES USED
─────────────────────────────────┼───────────────────────────────────────┼──────────────────
1. Owner signup + academy create │ No academy = no product               │ academies, members
2. Stripe subscription (BRL+EUR) │ No payment = no revenue               │ subscriptions, payments
3. Academy dashboard (home)      │ First thing user sees after signup    │ academies, members
4. Member management (CRUD)      │ Students are the core asset           │ members
5. Managed profiles (no login)   │ 80% of BR academies manage on paper  │ members (user_id=NULL)
6. Class template creation       │ Schedule is what students see first   │ classes
7. Weekly schedule view          │ The daily heartbeat of any academy    │ classes, class_sessions
8. Attendance taking (bulk)      │ Replaces the paper sign-in sheet     │ attendance, class_sessions
9. Belt rank tracking            │ Cultural necessity — BJJ identity     │ members, member_belt_history
10. Invite instructor            │ Multi-user = stickiness               │ invites, members
11. Basic role enforcement       │ Admin vs instructor vs student        │ members (role column)
12. Academy settings (basic)     │ Name, logo, timezone, permissions     │ academies
13. Middleware auth + tenant gate│ Security foundation                   │ —
14. RLS fully deployed           │ Non-negotiable for multi-tenant       │ All tables
```

### FEATURE DETAILS

```
1. OWNER SIGNUP + ACADEMY CREATION
   - Email/password signup → email verification
   - Onboarding wizard: academy name, slug, timezone, country
   - Stripe Checkout → webhook creates academy + first admin member
   - 14-day free trial (no credit card required? DECISION BELOW)

   DECISION: Require credit card upfront.
   WHY: Higher-intent signups. Lower churn. Simpler webhook flow.
   Brazilian market norm: free trial WITH card is standard for SaaS.

2. STRIPE SUBSCRIPTION
   - 2 plans at launch: Starter (50 members) + Growth (200 members)
   - BRL pricing for Brazil, EUR for Europe
   - Stripe Customer Portal for plan changes and cancellations
   - Webhook handlers: checkout.completed, invoice.paid, invoice.failed,
     subscription.updated, subscription.deleted

   SKIP FOR MVP: Pro plan, Enterprise plan, annual billing.
   WHY: 2 plans is enough. Annual billing adds complexity for <1% of early users.

3. MEMBER MANAGEMENT
   - Admin creates members (managed profiles — no auth account needed)
   - Fields: name, email, phone, belt rank, stripes
   - Member list with search and filter by belt/status
   - Member detail page with attendance history
   - Admin can edit role, belt, status

   SKIP FOR MVP: Student self-registration, portal access, profile photos.
   WHY: Most BR academies add students manually. Self-service is Phase 2.

4. CLASS TEMPLATES + SCHEDULE
   - Admin/instructor creates class templates (name, day, time, type, gi/nogi)
   - Weekly calendar view showing all classes
   - Auto-generation of class_sessions for the current week
   - Cancel individual sessions

   SKIP FOR MVP: Recurring session auto-generation beyond 1 week,
   room assignment, belt-level restrictions, max capacity enforcement.

5. ATTENDANCE (THE KILLER FEATURE)
   - Instructor opens today's session → sees full member roster
   - Tap to mark present (bulk check-in)
   - Attendance count shown in real-time
   - Attendance history per member (visible on member detail page)
   - Monthly attendance summary on dashboard

   SKIP FOR MVP: Student self check-in, QR codes, geolocation,
   attendance streaks, student feedback/rating.

6. BELT RANK TRACKING
   - Admin/instructor promotes a member (belt + stripes)
   - Auto-history via trigger (member_belt_history)
   - Belt displayed on member card with correct color

7. INVITE INSTRUCTOR
   - Admin sends email invite (role=instructor)
   - Instructor clicks link → creates account → joins academy
   - Instructor can take attendance and manage classes

   SKIP FOR MVP: Student invitations, activation invites, magic link login.
```

---

## 2. Phase 2 Features (v1.1 — weeks 9-14)

```
FEATURE                          │ WHY PHASE 2
─────────────────────────────────┼───────────────────────────────────────
Student portal access            │ Students logging in = engagement
Student self check-in            │ Reduces instructor overhead
Invite students (full accounts)  │ Extends from instructor invites
Activation invites (Path C)      │ Managed → full account transition
Magic link login                 │ Critical for students (no passwords)
Student plan management          │ Track who's paying, who's overdue
  (external payment tracking)    │
Curriculum (technique library)   │ Retention feature — students love it
Notifications (in-app)           │ Re-engagement + payment reminders
Academy switcher (multi-academy) │ Instructors at multiple gyms
Attendance streaks               │ Gamification → retention
Mobile-responsive polish         │ 90% of BJJ users are on mobile
```

### WHY STUDENT PORTAL IS PHASE 2, NOT MVP

Students don't sign up for BJJ software. Academy OWNERS do.
The owner's pain is: "I don't know who's coming to class."
That's an attendance problem, not a student portal problem.

Student portal adds value AFTER the owner is paying and committed.
It's a retention feature, not an acquisition feature.

---

## 3. Phase 3 Features (v1.2 — weeks 15-22)

```
FEATURE                          │ WHY PHASE 3
─────────────────────────────────┼───────────────────────────────────────
Automations engine               │ High dev cost, low MVP leverage
AI insights (churn risk,         │ Differentiator, but needs data first
  promotion readiness)           │
Audit log viewer                 │ Compliance, not acquisition
Ownership transfer               │ Rare edge case in year 1
QR code check-in                 │ Cool but not essential
WhatsApp notifications           │ Brazil-critical but complex integration
Advanced reporting               │ Charts, exports, comparisons
Google OAuth                     │ Convenience, not necessity
Custom domains                   │ Enterprise feature
Student self-service billing     │ Stripe Connect complexity
```

---

## 4. What to Postpone (Not in Phase 1-3)

```
FEATURE                          │ WHY POSTPONE
─────────────────────────────────┼───────────────────────────────────────
Stripe Connect (academy charges  │ Regulatory complexity (PCI, country
  students via Stripe)           │   rules). External tracking is fine.
Enterprise plan                  │ No enterprise customers in month 1.
Inter-academy features           │ Tournaments need a separate schema.
  (tournaments, rankings)        │   Zero demand until 50+ academies.
Native mobile app                │ Responsive web is sufficient.
                                 │   PWA if needed.
Video hosting for curriculum     │ Use YouTube/Vimeo embeds. No
                                 │   transcoding pipeline in year 1.
Multi-language UI (i18n)         │ Ship in PT-BR first. Add EN when
                                 │   EU expansion actually starts.
Geolocation check-in             │ Privacy concerns, GPS complexity.
                                 │   QR is simpler and comes first.
NFC check-in / kiosk mode       │ Hardware dependency. Not SaaS.
Real-time Supabase subscriptions │ Server-fetched data is fine for MVP.
                                 │   Realtime is a polish feature.
```

---

## 5. What Creates the Strongest Sales Argument

```
THE PITCH (30 seconds, to a BJJ academy owner):

  "You know how you have no idea which students are about to quit?
   BJJFlow shows you. It tracks attendance automatically, spots
   students who are fading, and tells you BEFORE they cancel.

   Plus: your instructors take attendance from their phone in
   10 seconds. No more paper sheets. No more spreadsheets.

   R$ 97/month. Try it free for 14 days."

THE 5 FEATURES THAT SELL:

  1. ATTENDANCE TRACKING → replaces paper/spreadsheets
     "See exactly who came to every class, instantly."

  2. CHURN RISK DETECTION → the AI insight, even if manual at first
     "Know which students are about to leave."

  3. BELT MANAGEMENT → cultural necessity
     "Track every promotion, every stripe, every milestone."

  4. INSTRUCTOR ACCESS → multi-user from day 1
     "Your instructors take attendance from their own phone."

  5. WORKS IN 5 MINUTES → zero friction onboarding
     "Sign up, add your students, create your schedule. Done."

THE ANTI-PITCH (what competitors get wrong):
  - Too complex (gym management software with 200 features)
  - Not BJJ-specific (belt ranks, gi/nogi, attendance culture)
  - English-only (Brazilian market is the largest BJJ market)
  - Require students to download an app (owners want simplicity)
```

---

## 6. What Is Technically Highest Risk

```
RISK                             │ IMPACT    │ MITIGATION
─────────────────────────────────┼───────────┼─────────────────────────────
1. Stripe webhook reliability    │ CRITICAL  │ Idempotent handlers, retry
   (academy creation depends on  │           │ logic, webhook event logging,
   checkout.session.completed)   │           │ manual recovery endpoint

2. RLS policy bugs               │ CRITICAL  │ Integration tests that sign in
   (cross-tenant data leak)      │           │ as user A, query user B's data,
                                 │           │ assert 0 rows. Run in CI.

3. JWT app_metadata sync         │ HIGH      │ Force session refresh after
   (stale academy_id after       │           │ academy switch. Middleware
   switch or role change)        │           │ validates membership on every
                                 │           │ request (cached 5min).

4. Middleware caching staleness   │ HIGH      │ Short TTL (5min). Cache-bust
   (academy suspended but user   │           │ on status change via Stripe
   still has access)             │           │ webhook (clear cache key).

5. Supabase rate limits          │ MEDIUM    │ Connection pooling (Supavisor).
   (free/pro tier limits)        │           │ Monitor from day 1. Upgrade
                                 │           │ Supabase plan if needed.

6. Email deliverability          │ MEDIUM    │ Use Resend (good reputation).
   (invite emails land in spam)  │           │ Set up SPF/DKIM/DMARC on
                                 │           │ bjjflow.com domain.

7. Managed profile → full account│ MEDIUM    │ Defer to Phase 2. The
   transition (Path C)           │           │ activation flow is complex.
                                 │           │ MVP only has Path B (managed).

8. Multi-timezone class sessions │ LOW       │ Store all times in UTC.
   (session at 7pm São Paulo     │           │ Display in academy.timezone.
   vs 7pm Lisbon)                │           │ All date/time functions go
                                 │           │ through lib/utils/date.ts.
```

---

## 7. What Should Be Mocked, Simplified, or Manually Operated

```
FEATURE                     │ MVP APPROACH              │ REAL IMPLEMENTATION
────────────────────────────┼───────────────────────────┼─────────────────────
Churn risk detection        │ SIMPLE RULE:              │ Phase 3: ML model
                            │ "< 3 classes in 30 days   │ with confidence score
                            │  when average was 8+"     │ and historical data.
                            │ Show as a dashboard card. │
                            │                           │
Student plan billing        │ MANUAL:                   │ Phase 2: In-app plan
                            │ Admin tracks payment      │ CRUD with overdue
                            │ status in a notes field   │ detection + cron.
                            │ on the member profile.    │
                            │                           │
Automations                 │ NOT BUILT:                │ Phase 3: Full engine
                            │ Admin sends reminders     │ with triggers, actions,
                            │ manually via WhatsApp.    │ and scheduling.
                            │                           │
AI insights                 │ HARD-CODED QUERIES:       │ Phase 3: AI pipeline
                            │ "Top 5 members at risk"   │ with analyzers and
                            │ "Busiest class this week" │ insight cards.
                            │ SQL queries on dashboard. │
                            │                           │
Notifications               │ NOT BUILT:                │ Phase 2: In-app
                            │ Insights shown directly   │ notification system
                            │ on dashboard home page.   │ with email delivery.
                            │                           │
Session auto-generation     │ MANUAL:                   │ Phase 2: Cron job
                            │ Admin clicks "Generate    │ auto-generates next
                            │ this week's sessions"     │ 4 weeks on rolling
                            │ button on schedule page.  │ basis.
                            │                           │
Audit log                   │ DATABASE ONLY:            │ Phase 3: UI viewer
                            │ audit_log table is written│ with filters and
                            │ by server code, but no    │ export.
                            │ UI to view it yet.        │
                            │                           │
Multi-academy               │ SINGLE ACADEMY:           │ Phase 2: Academy
                            │ JWT has one academy_id.   │ switcher. User can
                            │ No switcher UI. If user   │ belong to multiple.
                            │ has multiple, they see    │
                            │ the most recent one.      │
                            │                           │
Email templates             │ PLAIN TEXT:               │ Phase 2: React Email
                            │ Simple text emails via    │ with branded HTML
                            │ Resend. No fancy HTML.    │ templates.
```

---

## 8. What Must Absolutely Be in v1

```
NON-NEGOTIABLE (if this is missing, do not ship):

  ✅ Stripe payment working end-to-end
     Without revenue collection, the product is a demo.

  ✅ RLS deployed on every table
     A multi-tenant SaaS without tenant isolation is a lawsuit.

  ✅ Middleware auth chain complete
     Unauthenticated access to the dashboard = security incident.

  ✅ Academy creation via Stripe webhook
     No orphan academies. No free rides. Stripe is the gate.

  ✅ Member CRUD with managed profiles
     The entire product is about managing students.

  ✅ Attendance taking (instructor bulk check-in)
     This is THE feature that replaces the paper sheet.
     If attendance doesn't work, nothing else matters.

  ✅ Belt rank with auto-history
     BJJ without belts is not BJJ software.

  ✅ At least one non-admin role (instructor)
     Multi-user is what makes this SaaS, not a spreadsheet.

  ✅ Schedule view (read-only for students is fine)
     Students need to know when classes are.

  ✅ Academy suspension on payment failure
     If someone stops paying, they stop using. Non-negotiable.
```

---

## 9. What Must Absolutely NOT Be in v1

```
DO NOT BUILD THESE FOR LAUNCH:

  ❌ Automations engine
     High complexity, low leverage at launch. Zero academies have
     enough data for meaningful automation in month 1.

  ❌ Full AI insights pipeline
     Needs 30+ days of attendance data to be useful. Replace with
     simple SQL dashboard cards.

  ❌ Student self-service portal
     Owner buys the product, not students. Owner needs attendance.
     Students can wait for Phase 2.

  ❌ Student self check-in (app, QR, geo)
     Instructor bulk check-in is simpler and sufficient.
     Self check-in adds UX complexity and geolocation headaches.

  ❌ Stripe Connect (student billing via Stripe)
     Regulatory minefield. External payment tracking via notes field.

  ❌ Curriculum / technique library
     Nice retention feature, but zero impact on acquisition.

  ❌ Notifications system
     No in-app notifications. Dashboard cards are enough.

  ❌ Ownership transfer flow
     Zero customers need this in month 1. Build when asked.

  ❌ Custom domains
     Enterprise feature. No enterprise customers at launch.

  ❌ Internationalization (i18n)
     Ship in PT-BR ONLY. The largest BJJ market is Brazil.
     English comes when EU expansion begins (Phase 3+).

  ❌ Supabase Realtime
     Server-fetched data with page refreshes is fine for MVP.
     Real-time attendance updates are a nice-to-have.

  ❌ Full audit log UI
     Write audit entries server-side (the code costs nothing).
     The viewer UI can wait until compliance is a real concern.
```

---

## 10. Recommended Build Order for MVP

```
WEEK 1: FOUNDATION
═══════════════════
  □ Next.js project scaffolding (App Router, Tailwind, shadcn/ui)
  □ Supabase project creation + local dev setup
  □ Run 00001_schema.sql migration
  □ Run 00002_rls.sql migration
  □ Supabase type generation (database.ts)
  □ Server Supabase clients (server.ts, admin.ts, middleware.ts)
  □ Browser Supabase client (client.ts)
  □ Environment variables setup (.env.local, .env.example)
  □ tRPC setup (init, procedures, root router, API route)
  □ Basic middleware (session refresh, public route bypass)

  DELIVERABLE: Empty app that authenticates and talks to Supabase.

WEEK 2: AUTH + ONBOARDING
═════════════════════════
  □ Signup page (email/password → Supabase Auth)
  □ Login page
  □ Email verification flow
  □ Forgot/reset password
  □ Onboarding: academy setup form (name, slug, timezone, country)
  □ Stripe Checkout integration (create checkout session)
  □ Stripe webhook handler (checkout.session.completed)
    → Creates academy + subscription + first admin member
    → Sets app_metadata.academy_id
  □ Onboarding complete → redirect to dashboard
  □ Middleware: full auth chain (verify → academy → member → role)

  DELIVERABLE: Owner can sign up, pay, and land on an empty dashboard.

WEEK 3: DASHBOARD + MEMBER MANAGEMENT
══════════════════════════════════════
  □ Dashboard layout (sidebar, header, role-aware nav)
  □ Dashboard home page (placeholder stats)
  □ Member list page (table with search, belt filter)
  □ Create member form (managed profile: name, email, phone, belt)
  □ Member detail page (profile, belt, status)
  □ Edit member (role change, belt promotion, status)
  □ Belt promotion with auto-history trigger
  □ tRPC: member router (list, getById, create, update)

  DELIVERABLE: Owner can add students and manage their profiles.

WEEK 4: SCHEDULE + CLASSES
══════════════════════════
  □ Class template creation form
  □ Class list / weekly calendar view
  □ Manual session generation ("Generate this week" button)
  □ Session detail page (shows date, time, instructor)
  □ Cancel session (status = 'cancelled')
  □ tRPC: class router (list, create, update, generateSessions)

  DELIVERABLE: Owner can create classes and see a weekly schedule.

WEEK 5: ATTENDANCE (THE MONEY FEATURE)
═══════════════════════════════════════
  □ Session attendance page (member roster with checkboxes)
  □ Bulk check-in (tap names → save all at once)
  □ Attendance count on session card
  □ Attendance history on member detail page
  □ Monthly attendance summary on dashboard home
  □ "At risk" dashboard card (< 3 classes in 30 days, simple SQL)
  □ tRPC: attendance router (checkIn, bulkCheckIn, history)

  DELIVERABLE: Instructors can take attendance. Dashboard shows insights.

WEEK 6: INSTRUCTOR INVITES + MULTI-USER
════════════════════════════════════════
  □ Invite form (email + role=instructor)
  □ Invite email (plain text via Resend)
  □ Invite acceptance page (/invite?token=...)
  □ Invite → signup/login → member created → redirect to dashboard
  □ Role-based nav (instructor sees schedule + members + attendance)
  □ tRPC: invite router (create, list pending, revoke)
  □ Middleware: role-based route gating

  DELIVERABLE: Academy has admin + instructor. Both can take attendance.

WEEK 7: BILLING + ACADEMY SETTINGS
═══════════════════════════════════
  □ Billing page (current plan, status, next invoice date)
  □ Stripe Customer Portal link ("Manage subscription" button)
  □ Webhook: invoice.paid, invoice.payment_failed
  □ Academy status: past_due → suspended flow
  □ Suspended academy page (read-only mode)
  □ Academy settings page (name, logo upload, timezone, permissions)
  □ tRPC: billing router (getSubscription, createPortalSession)
  □ tRPC: academy router (getSettings, updateSettings)

  DELIVERABLE: Full billing loop. Academy can be suspended and reactivated.

WEEK 8: POLISH + LAUNCH PREP
═════════════════════════════
  □ Dashboard home: real stats (total members, this week attendance,
    active vs inactive, at-risk students)
  □ Mobile responsiveness pass (sidebar → mobile nav)
  □ Loading states (loading.tsx for each route)
  □ Error states (error.tsx for each route)
  □ Empty states ("No classes yet. Create your first class.")
  □ Marketing landing page (pricing, features, signup CTA)
  □ RLS integration tests (cross-tenant isolation verification)
  □ Stripe webhook idempotency verification
  □ Production Supabase project + Vercel deployment
  □ Domain setup (bjjflow.com)
  □ Resend domain verification (SPF/DKIM)

  DELIVERABLE: Production-ready MVP. Ship it.
```

### Build Order Dependency Graph

```
Week 1 (Foundation)
  └── Week 2 (Auth + Onboarding)
        └── Week 3 (Members)
              ├── Week 4 (Schedule)
              │     └── Week 5 (Attendance) ← THE MONEY FEATURE
              └── Week 6 (Invites)
        └── Week 7 (Billing + Settings)
  └── Week 8 (Polish + Launch)

CRITICAL PATH: Weeks 1→2→3→4→5
  If attendance doesn't work by week 5, everything else is irrelevant.
```

---

## Summary: MVP Scorecard

```
METRIC                    │ TARGET
──────────────────────────┼────────────────────────────────
Time to market            │ 8 weeks
Tables used               │ 10 of 22 (45%)
tRPC routers              │ 6 of 12 (50%)
RLS policies deployed     │ 23 of 23 (100%) — non-negotiable
Stripe plans at launch    │ 2 (Starter + Growth)
Target language           │ PT-BR only
Target market             │ Brazilian academies first
Revenue target (month 1)  │ 10 paying academies
Revenue target (month 3)  │ 50 paying academies
Pricing (Starter)         │ R$ 97/mo
Break-even                │ ~30 Starter academies
```

### What We Ship vs What We Don't

```
SHIP:                           │ DON'T SHIP:
────────────────────────────────┼────────────────────────
✅ Owner signup + Stripe         │ ❌ Student portal
✅ Member management             │ ❌ Automations
✅ Managed profiles              │ ❌ AI pipeline
✅ Class schedule                │ ❌ Curriculum library
✅ Instructor attendance         │ ❌ Self check-in
✅ Belt tracking                 │ ❌ Notifications
✅ Instructor invites            │ ❌ Student invites
✅ Basic dashboard stats         │ ❌ Advanced analytics
✅ Stripe billing                │ ❌ Student billing
✅ Suspension flow               │ ❌ Ownership transfer
✅ Full RLS                      │ ❌ Custom domains
✅ Role enforcement              │ ❌ i18n (EN)
✅ Landing page                  │ ❌ Realtime
```
