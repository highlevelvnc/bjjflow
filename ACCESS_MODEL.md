# BJJFlow - Authentication, Authorization & Multi-Tenant Access Model

> Production-grade access model. No SQL. No app code.
> This document is the source of truth for all identity, access, and tenancy decisions.

---

## Table of Contents

1. [Authentication Model](#1-authentication-model)
2. [Academy Creation Flow](#2-academy-creation-flow)
3. [Membership and Role Model](#3-membership-and-role-model)
4. [Instructor Invitation Flow](#4-instructor-invitation-flow)
5. [Student Onboarding Flow](#5-student-onboarding-flow)
6. [Authorization Model](#6-authorization-model)
7. [Row-Level Security Strategy](#7-row-level-security-strategy)
8. [Next.js App Router Access Strategy](#8-nextjs-app-router-access-strategy)
9. [Edge Cases](#9-edge-cases)
10. [Security Pitfalls to Avoid](#10-security-pitfalls-to-avoid)
11. [Implementation Order](#11-recommended-auth-implementation-order)
12. [Permission Matrix Summary](#12-permission-matrix-summary)
13. [Top 10 Mistakes to Avoid](#13-top-10-mistakes-to-avoid)

---

## 1. Authentication Model

### 1.1 Identity Boundary

There is a **strict separation** between two identity concepts:

| Concept | Where it lives | What it represents |
|---|---|---|
| **Auth User** | `auth.users` (Supabase-managed) | A human with a verified email and credentials. Global. One per person. |
| **Member** | `public.members` (app-managed) | That human's identity *within a specific academy*. Scoped. One per academy per user. |

A single auth user can have 0..N member records across different academies.
The auth user owns credentials. The member owns role, belt rank, and academy context.

**Rule: Supabase Auth is the ONLY authenticator.** The app never stores passwords,
issues its own tokens, or manages sessions outside Supabase's session system.

### 1.2 Supported Authentication Methods

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION METHODS                            │
│                                                                     │
│  PRIMARY (launch)                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Email + Password                                              │ │
│  │  - Used for: owner signup, invited member signup               │ │
│  │  - Password minimum: 8 characters (Supabase enforced)          │ │
│  │  - Email verification: REQUIRED before any academy access      │ │
│  │  - PKCE flow for SPA safety (no implicit grant)                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Magic Link (passwordless)                                     │ │
│  │  - Used for: student portal activation, convenience login      │ │
│  │  - OTP sent to verified email                                  │ │
│  │  - Token validity: 10 minutes                                  │ │
│  │  - One-time use (consumed on click)                            │ │
│  │  - Ideal for BJJ students who forget passwords constantly      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  SECONDARY (post-launch)                                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Google OAuth                                                  │ │
│  │  - Used for: convenience signup/login                          │ │
│  │  - Supabase handles token exchange                             │ │
│  │  - On first OAuth login: auth.users created, no member yet     │ │
│  │  - On subsequent: session issued, middleware resolves member    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  RECOVERY                                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Password Reset                                                │ │
│  │  - Supabase sends reset email with OTP/link                    │ │
│  │  - Link validity: 1 hour                                       │ │
│  │  - After reset: all existing sessions invalidated              │ │
│  │  - Rate limited: 3 resets per email per hour                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  INVITE ACCEPTANCE (special case)                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Invite Token + Signup/Login                                   │ │
│  │  - Token in URL query param: /invite?token=abc123              │ │
│  │  - If no auth.users exists for that email → signup form shown  │ │
│  │  - If auth.users exists → login form shown, token persisted    │ │
│  │  - On successful auth → token consumed → member created        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 How Supabase Auth Maps to App Identities

```
auth.users                          members
┌──────────────────────┐           ┌─────────────────────────────┐
│ id: uuid             │     ┌────►│ id: uuid                    │
│ email: text          │     │     │ academy_id: uuid → Academy A│
│ app_metadata: {      │     │     │ user_id: uuid ──────────────┤
│   academy_id: uuid ──┼─────┘     │ role: 'admin'               │
│ }                    │           └─────────────────────────────┘
│ raw_user_meta_data: {│
│   full_name: text    │           ┌─────────────────────────────┐
│ }                    │     ┌────►│ id: uuid                    │
│                      │     │     │ academy_id: uuid → Academy B│
│ (The academy_id in   │     │     │ user_id: uuid ──────────────┤
│  app_metadata is the │     │     │ role: 'instructor'          │
│  ACTIVE academy, not │─────┘     └─────────────────────────────┘
│  the only one)       │
└──────────────────────┘           Same auth user, two academies,
                                   two different roles.

CRITICAL DISTINCTION:
  app_metadata.academy_id  = the currently ACTIVE academy
  members table            = ALL academies user belongs to
```

### 1.4 Session Strategy

```
Session Architecture:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  CLIENT (browser)                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cookies (HTTP-only, Secure, SameSite=Lax)               │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  sb-access-token   (JWT, 1 hour TTL)                │ │   │
│  │  │  sb-refresh-token  (opaque, 7 day TTL, rotated)     │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │  The browser NEVER reads these cookies directly.         │   │
│  │  Supabase client auto-refreshes before JWT expiry.       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  JWT PAYLOAD (what the access token contains):                   │
│  {                                                               │
│    "sub": "user-uuid",           // auth.users.id                │
│    "email": "joao@example.com",                                  │
│    "app_metadata": {                                             │
│      "academy_id": "acad-uuid",  // ACTIVE academy               │
│      "provider": "email"                                         │
│    },                                                            │
│    "role": "authenticated",      // Supabase role (always this)  │
│    "exp": 1717027200             // 1 hour from issue             │
│  }                                                               │
│                                                                  │
│  IMPORTANT:                                                      │
│  - The member's ROLE (admin/instructor/student) is NOT in the    │
│    JWT. It is looked up from the members table at request time.  │
│  - Reason: role can change without requiring a re-login.         │
│  - The academy_id IS in the JWT because RLS needs it and it      │
│    changes infrequently (only on academy switch).                │
│                                                                  │
│  SESSION LIFECYCLE:                                              │
│  1. Login → Supabase issues access + refresh tokens as cookies   │
│  2. Each request → middleware reads cookie, validates JWT         │
│  3. JWT near expiry → Supabase client auto-refreshes             │
│  4. Refresh token rotated → old refresh token invalidated        │
│  5. Logout → both cookies cleared, refresh token revoked         │
│  6. Password change → ALL sessions invalidated                   │
│                                                                  │
│  COOKIE VS HEADER:                                               │
│  - Web app: cookies (automatic, HTTP-only, secure)               │
│  - Future mobile app: Authorization header (Bearer token)        │
│  - Server components: read cookie via @supabase/ssr              │
│  - API routes: read cookie via @supabase/ssr                     │
│  - Webhooks: no session (use service role key)                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.5 Token Refresh and Academy Context

When a user switches their active academy, the JWT must be updated:

```
Academy Switch Flow:
  1. User clicks "Switch to Academy B" in the UI
  2. Client calls server action: switchAcademy(academyId)
  3. Server validates:
     a. User has a member record in that academy
     b. Member status is 'active'
     c. Academy status is NOT 'deleted'
  4. Server calls supabaseAdmin.auth.admin.updateUserById(userId, {
       app_metadata: { academy_id: newAcademyId }
     })
  5. Server calls supabase.auth.refreshSession() to issue new JWT
  6. New JWT contains updated academy_id
  7. Client receives new cookies, reloads dashboard
  8. All subsequent RLS queries scope to new academy

IMPORTANT:
  - Step 4 uses admin client (service role) because only admin
    can modify app_metadata. This is a privileged server-side operation.
  - Step 5 forces a JWT refresh so the new academy_id takes effect
    immediately, not after the old JWT expires in ~1 hour.
  - Between step 4 and step 6, there is a brief window where the
    JWT still has the old academy_id. This is acceptable because:
    (a) the window is milliseconds on the server
    (b) the user cannot issue requests during this atomic operation
```

---

## 2. Academy Creation Flow

### 2.1 Owner Signup

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACADEMY CREATION SEQUENCE                         │
│                                                                     │
│  Step 1: OWNER REGISTERS                                            │
│  ───────────────────────                                            │
│  User visits /signup                                                │
│  → Enters: email, password, full name                               │
│  → Supabase creates auth.users record                               │
│  → Email verification sent                                          │
│  → User redirected to /verify-email (waiting screen)                │
│                                                                     │
│  State after step 1:                                                │
│    auth.users: exists, email_confirmed = false                      │
│    members: NONE                                                    │
│    academies: NONE                                                  │
│    app_metadata: { academy_id: null }                               │
│                                                                     │
│  Step 2: EMAIL VERIFIED                                             │
│  ──────────────────────                                             │
│  User clicks verification link                                      │
│  → Supabase sets email_confirmed = true                             │
│  → User redirected to /onboarding/setup                             │
│  → Middleware sees: authenticated=true, academy_id=null             │
│    → allows access ONLY to /onboarding/* routes                     │
│                                                                     │
│  Step 3: ACADEMY SETUP                                              │
│  ────────────────────                                               │
│  User fills out:                                                    │
│    - Academy name: "Gracie Barra Lisbon"                            │
│    - Slug: "gracie-barra-lisbon" (validated unique)                 │
│    - Timezone: "Europe/Lisbon"                                      │
│    - Country: "PT"                                                  │
│    - Currency: "EUR" (auto-detected from country, editable)         │
│    - Locale: "pt-BR" or "en" (selected)                             │
│                                                                     │
│  → Data persisted in temporary server-side state                    │
│    (NOT in the database yet — academy doesn't exist until paid)     │
│  → User redirected to /onboarding/plan                              │
│                                                                     │
│  Step 4: PLAN SELECTION + STRIPE CHECKOUT                           │
│  ────────────────────────────────────────                           │
│  User sees plan options (localized pricing)                         │
│  → Selects plan → clicks "Start Trial" or "Subscribe"              │
│  → Server creates Stripe Checkout Session with:                     │
│      - customer_email: user's email                                 │
│      - metadata: { user_id, academy_slug, academy_name, ... }      │
│      - success_url: /onboarding/complete?session_id={CHECKOUT_ID}   │
│      - mode: 'subscription'                                        │
│      - trial_period_days: 14 (if trial enabled)                     │
│  → User redirected to Stripe Checkout                               │
│  → User completes payment (or starts trial)                         │
│                                                                     │
│  Step 5: WEBHOOK → ACADEMY BOOTSTRAP (server-side, atomic)         │
│  ──────────────────────────────────────────────────────             │
│  Stripe fires: checkout.session.completed                           │
│  → Webhook handler (using supabaseAdmin, bypasses RLS):             │
│                                                                     │
│    BEGIN TRANSACTION                                                │
│      a. Create academy record                                       │
│         → status: 'trialing' or 'active'                            │
│         → stripe_customer_id from Stripe                            │
│         → stripe_subscription_id from Stripe                        │
│         → plan, currency, max_members set per plan                  │
│                                                                     │
│      b. Create subscription record                                  │
│         → mirrors Stripe subscription state                         │
│                                                                     │
│      c. Create first member record                                  │
│         → user_id: from checkout metadata                           │
│         → academy_id: the newly created academy                     │
│         → role: 'admin'  ← ONLY way to get admin role              │
│         → display_name: from user's raw_user_meta_data              │
│         → status: 'active'                                          │
│                                                                     │
│      d. Set app_metadata on auth.users                              │
│         → supabaseAdmin.auth.admin.updateUserById(userId, {         │
│             app_metadata: { academy_id: newAcademyId }              │
│           })                                                        │
│                                                                     │
│      e. Create default academy data                                 │
│         → default belt ranks (IBJJF standard)                      │
│         → sample class templates (optional)                         │
│    COMMIT                                                           │
│                                                                     │
│  Step 6: REDIRECT TO DASHBOARD                                      │
│  ─────────────────────────────                                      │
│  User returns from Stripe to /onboarding/complete                   │
│  → Server refreshes session (new JWT with academy_id)               │
│  → Redirect to /dashboard                                           │
│  → Onboarding checklist shown:                                      │
│      □ Invite your first instructor                                 │
│      □ Create your first class                                      │
│      □ Invite a student                                             │
│      □ Take your first attendance                                   │
│                                                                     │
│  Final state:                                                       │
│    auth.users: email_confirmed=true, app_metadata.academy_id=X      │
│    academies: 1 record, status='trialing'/'active'                  │
│    members: 1 record, role='admin'                                  │
│    subscriptions: 1 record, mirrors Stripe                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Critical Design Decision: No Academy Without Payment

The academy record is created ONLY inside the Stripe webhook, not during the
setup form. This means:

- **No orphan academies** if user abandons checkout
- **No "freemium" account creation spam**
- **Stripe is the source of truth** for subscription state
- Academy ID doesn't exist until payment/trial starts, preventing any
  data leakage or premature RLS context

The temporary setup data (name, slug, timezone) is passed to Stripe as
`metadata` on the Checkout Session, then read back in the webhook.

### 2.3 Slug Reservation

Between step 3 (setup form) and step 5 (webhook), the slug is **not reserved**
in the database. To prevent race conditions:

- Server validates slug uniqueness at form submission time
- Webhook handler attempts INSERT with unique constraint on slug
- If slug collision occurs (extremely rare), webhook handler appends a random
  suffix (e.g., "gracie-barra-lisbon-3f2a") and notifies the owner

---

## 3. Membership and Role Model

### 3.1 Core Model

```
USER ←──── auth.users (global identity)
  │
  │  1:N relationship via members table
  │
  ├── MEMBER in Academy A  (role: admin)
  ├── MEMBER in Academy B  (role: instructor)
  └── MEMBER in Academy C  (role: student)

Key constraints:
  - One member record per (user_id, academy_id) pair
  - A user can have DIFFERENT roles in different academies
  - A user can be admin in one academy and student in another
  - Role is per-membership, NOT per-user
```

### 3.2 Role Hierarchy

```
ROLE HIERARCHY (strict, not inheriting):
═══════════════════════════════════════

  admin
    │
    │  has ALL instructor permissions PLUS:
    │    - billing, settings, invites, role management, danger zone
    │
  instructor
    │
    │  has ALL student permissions PLUS:
    │    - class management, attendance taking, curriculum editing,
    │      viewing all members
    │
  student
    │
    │  base permissions:
    │    - view schedule, self check-in, view own profile,
    │      view published curriculum

HIERARCHY IS ENFORCED BY THE APPLICATION, NOT BY RLS:
  - RLS only cares about academy_id (tenant boundary)
  - Role-based restrictions are enforced at:
    a. tRPC middleware (procedure-level guards)
    b. Next.js middleware (route-level guards)
    c. UI (hide/show based on role — NEVER trust this alone)
```

### 3.3 Active Academy Context

```
How active academy is determined:

  1. JWT contains app_metadata.academy_id — this is the ACTIVE academy
  2. On login, if user has exactly 1 membership → that academy is auto-set
  3. On login, if user has N memberships → last active academy is used
     (stored in app_metadata from previous session)
  4. On login, if user has 0 memberships → redirect to /onboarding or /join
  5. Academy switcher UI lets user change active academy

Where active academy matters:
  - RLS: get_current_academy_id() reads from JWT
  - tRPC context: academyId set from JWT in createContext
  - Middleware: route protection based on academy status + role
  - Client: TenantProvider reads from session

What CANNOT override active academy:
  - URL parameters (e.g., ?academy=other-slug → IGNORED)
  - Request headers (e.g., X-Academy-Id → IGNORED)
  - Cookies set by the client → ONLY server can set app_metadata
```

### 3.4 Membership Lifecycle States

```
Member statuses and their meaning:

  'active'     → full access per role
  'inactive'   → voluntarily paused (e.g., student taking a break)
                  can log in, sees read-only dashboard, cannot check in
  'suspended'  → admin-imposed restriction (e.g., unpaid, behavior)
                  can log in, sees "contact your academy" message
  'trial'      → invited but plan not yet confirmed
                  limited access, used with student_plans

Transition rules:
  active → inactive      admin sets, or student self-service
  active → suspended     admin only
  inactive → active      admin sets, or student self-service (if plan valid)
  suspended → active     admin only
  * → (deleted)          member row deleted (hard delete, cascade-safe)
                          auth.users PRESERVED (user still has their account)
```

---

## 4. Instructor Invitation Flow

### 4.1 Full Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INSTRUCTOR INVITE FLOW                            │
│                                                                     │
│  STEP 1: ADMIN CREATES INVITE                                       │
│  ────────────────────────────                                       │
│  Admin navigates to /members/invite                                 │
│  → Enters: email, selects role = "instructor"                       │
│  → Server:                                                          │
│     a. Validate admin has 'admin' role                              │
│     b. Check email not already a member of THIS academy             │
│     c. Check invite limit not exceeded (20/day per academy)         │
│     d. Generate cryptographically secure token (32 bytes, hex)      │
│     e. Insert invite record:                                        │
│        - academy_id, email, role='instructor', token, expires_at    │
│        - invited_by = admin's member_id                             │
│     f. Send invitation email via Resend:                            │
│        - Contains: academy name, inviter name, role                 │
│        - Link: https://bjjflow.com/invite?token={TOKEN}            │
│        - Link valid for 7 days                                      │
│  → Admin sees invite in "Pending Invites" list                      │
│                                                                     │
│  STEP 2: INVITEE CLICKS LINK                                       │
│  ────────────────────────────                                       │
│  Instructor clicks link in email                                    │
│  → /invite?token={TOKEN} page loads                                 │
│  → Server validates token:                                          │
│     a. Token exists in invites table                                │
│     b. accepted_at IS NULL (not yet used)                           │
│     c. expires_at > now() (not expired)                             │
│     d. Academy status is active/trialing (not suspended)            │
│  → Page shows: "You've been invited to [Academy] as an instructor"  │
│                                                                     │
│  STEP 3A: INVITEE HAS NO ACCOUNT                                   │
│  ────────────────────────────────                                   │
│  → "Create Account" form shown (email pre-filled from invite)       │
│  → User enters: password, full name                                 │
│  → Supabase creates auth.users                                      │
│  → Email verification sent (OR auto-verified if invite is trusted)  │
│  → On verification → proceed to Step 4                              │
│                                                                     │
│  STEP 3B: INVITEE ALREADY HAS ACCOUNT                              │
│  ─────────────────────────────────────                              │
│  → "Log in to accept" form shown                                    │
│  → User enters credentials (or uses magic link / OAuth)             │
│  → Server validates auth.users.email matches invite.email           │
│  → If mismatch: reject. Invite is email-bound.                      │
│  → On login → proceed to Step 4                                     │
│                                                                     │
│  STEP 4: MEMBERSHIP CREATED (server-side, atomic)                   │
│  ────────────────────────────────────────────────                   │
│  → BEGIN TRANSACTION                                                │
│      a. Re-validate invite (not expired, not accepted, etc.)        │
│      b. Create member record:                                       │
│         - academy_id from invite                                    │
│         - user_id from authenticated session                        │
│         - role from invite (instructor)                             │
│         - display_name from auth user metadata                      │
│         - status: 'active'                                          │
│      c. Set invite.accepted_at = now()                              │
│      d. Update app_metadata.academy_id to this academy              │
│         (only if user has no other active academy)                   │
│    COMMIT                                                           │
│  → Refresh session → redirect to /dashboard                         │
│                                                                     │
│  FAILURE CASES:                                                     │
│  ──────────────                                                     │
│  Token expired → show "Invite expired. Ask admin for a new one."    │
│  Token already accepted → show "Already accepted. Log in."          │
│  Academy suspended → show "This academy is currently inactive."     │
│  Email mismatch → show "This invite was sent to a different email." │
│  Already a member → show "You're already part of this academy."     │
│  Plan limit exceeded → show "Academy has reached member limit."     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Invite Revocation

```
Admin can revoke pending invites:
  → DELETE from invites WHERE id = invite_id AND accepted_at IS NULL
  → Invite link becomes invalid immediately
  → No email sent to invitee (link just shows "invalid invite")

Expired invite cleanup:
  → Cron job (daily): DELETE FROM invites WHERE expires_at < now() - interval '30 days'
  → Keeps expired invites for 30 days for audit purposes
```

---

## 5. Student Onboarding Flow

### 5.1 Three Entry Paths

BJJ academies manage students differently from SaaS companies. Not every
student needs (or wants) a digital account. The system supports three models:

```
PATH A: FULL ACCOUNT (student has app access)
═════════════════════════════════════════════
  Same flow as instructor invite (Section 4) but with role='student'.
  Student gets:
    - Login credentials
    - Self check-in capability
    - Schedule viewing
    - Curriculum access
    - Attendance history
    - Notification preferences

PATH B: MANAGED PROFILE (no login, admin-managed)
══════════════════════════════════════════════════
  Admin creates member record WITHOUT linking to auth.users:
    - member.user_id = NULL  ← special case
    - member.role = 'student'
    - Admin fills in: name, email (optional), belt, phone
    - Member exists for attendance tracking, billing, belt history
    - Student has NO login, NO app access

  This is the default for many Brazilian academies where students
  are managed via a registration book or spreadsheet today.

  Key implications for schema:
    - members.user_id must be NULLABLE (already is via the FK)
    - WAIT: our schema has user_id NOT NULL. This needs revision.
    - DECISION: Add a flag `has_portal_access boolean DEFAULT false`
      instead of making user_id nullable. Managed profiles get a
      user_id = NULL and has_portal_access = false.
    - REVISED DECISION: Actually, user_id SHOULD be nullable.
      Making it non-nullable forces creating auth.users for every
      student, which is wrong for managed profiles. The unique
      constraint becomes: UNIQUE(academy_id, user_id) WHERE user_id
      IS NOT NULL. A partial unique index.

PATH C: INVITE TO ACTIVATE LATER
═════════════════════════════════
  Combines A and B:
    1. Admin creates managed profile (Path B)
    2. Later, admin sends "activation invite" to student's email
    3. Student clicks link → creates account → linked to existing member
    4. Member record updated: user_id set, has_portal_access = true

  Activation flow:
    - Server generates activation token (separate from invite token)
    - Token embedded in email link
    - Student creates account or logs in
    - Server matches by: academy_id + email (from activation token)
    - Links auth.users.id to existing member.user_id
    - Does NOT create a new member record (updates existing)
```

### 5.2 Managed Profile Identification

```
Without a user_id, how do we identify managed profiles?

  - By member.id (UUID) — internal system reference
  - By member.email — entered by admin during creation
  - By member.phone — alternative identifier
  - NOT by auth.users.id — they don't have one

For attendance, an instructor checks off managed profiles by name
from the class roster. No login required.

Uniqueness for managed profiles:
  - UNIQUE(academy_id, email) WHERE user_id IS NULL
  - Prevents duplicate managed profiles with the same email
  - When user_id is set (Path C activation), the email constraint
    is enforced via the user_id unique constraint instead
```

### 5.3 Schema Revision Needed

```
The current DATABASE_SCHEMA.md has:
  members.user_id uuid NOT NULL REFERENCES auth.users(id)

This MUST be revised to:
  members.user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
  -- NULLABLE for managed profiles

With additional indexes:
  CREATE UNIQUE INDEX idx_members_academy_user
    ON members(academy_id, user_id) WHERE user_id IS NOT NULL;
  CREATE UNIQUE INDEX idx_members_academy_email_managed
    ON members(academy_id, email) WHERE user_id IS NULL;

And RLS must account for this:
  - Managed profiles (user_id IS NULL) are visible to admins/instructors
    within the same academy_id
  - They cannot log in (no auth.users), so they never trigger RLS
    on their own behalf
```

---

## 6. Authorization Model

### 6.1 RBAC Structure

```
AUTHORIZATION LAYERS (defense in depth):

  Layer 1: TENANT BOUNDARY (RLS)
  ─────────────────────────────
  "Can this user see data from this academy at all?"
  → Enforced by PostgreSQL RLS using academy_id from JWT
  → Binary: yes (member of academy) or no (cannot see anything)
  → This layer CANNOT be bypassed by application code
    (unless using service role, which is server-only)

  Layer 2: ROLE-BASED ACCESS (application)
  ────────────────────────────────────────
  "Within this academy, what can this user do?"
  → Enforced by tRPC middleware, server actions, and Next.js middleware
  → Three roles: admin > instructor > student
  → Role checked on EVERY mutating operation

  Layer 3: RESOURCE OWNERSHIP (application)
  ─────────────────────────────────────────
  "Even with the right role, can this user touch THIS specific resource?"
  → Examples:
    - Student can only edit their OWN profile, not other students'
    - Instructor can only mark attendance for THEIR assigned classes
      (or any class if academy settings allow)
    - Only the member who created a technique can edit it
      (or any admin/instructor, depending on settings)

  Layer 4: STATUS GATES (application)
  ───────────────────────────────────
  "Is the academy/membership in a state that allows this action?"
  → Academy status must be 'active' or 'trialing' for writes
  → Member status must be 'active' for most operations
  → Subscription must be current for premium features
```

### 6.2 Resource Ownership Rules

```
RESOURCE OWNERSHIP MATRIX:

  Resource              │ Creator Owns │ Admin Can Edit │ Instructor Can Edit │ Student Can Edit
  ──────────────────────┼──────────────┼────────────────┼─────────────────────┼─────────────────
  Academy settings      │ N/A          │ ✅             │ ❌                  │ ❌
  Member profile (own)  │ ✅           │ ✅ (override)  │ ❌                  │ ✅ (limited*)
  Member profile (other)│ N/A          │ ✅             │ 🔶 (view only)      │ ❌
  Class template        │ ✅           │ ✅             │ ✅ (own only**)     │ ❌
  Class session         │ Auto         │ ✅             │ ✅ (assigned only)  │ ❌
  Attendance record     │ Auto         │ ✅             │ ✅ (own sessions)   │ ❌ (self-checkin only)
  Technique             │ ✅           │ ✅             │ ✅ (own only**)     │ ❌
  Student plan          │ N/A          │ ✅             │ ❌                  │ ❌
  Automation            │ ✅           │ ✅             │ ❌                  │ ❌
  AI insight action     │ Auto         │ ✅             │ ✅ (own view)       │ ❌

  * Students can edit: display_name, avatar, phone, emergency_contact,
    weight_class. They CANNOT edit: belt_rank, stripes, role, status.
  ** "own only" means instructors can be restricted to editing only
     classes/techniques they created. Configurable per academy.
```

### 6.3 Sensitive Action Protection

```
SENSITIVE ACTIONS (require extra verification or restriction):

  ACTION                     │ WHO       │ EXTRA PROTECTION
  ───────────────────────────┼───────────┼────────────────────────────
  Delete academy             │ admin     │ Confirm via typed academy name
                             │           │ + re-authenticate (password prompt)
  Transfer ownership         │ admin     │ Re-authenticate + email confirmation
                             │           │ to BOTH old and new owner
  Change member role         │ admin     │ Audit log entry, cannot demote self
  Remove member              │ admin     │ Confirmation modal, soft-delete first
  Promote belt rank          │ admin/    │ Audit log, belt_history record
                             │ instructor│
  Change billing plan        │ admin     │ Stripe Customer Portal (Stripe handles)
  Cancel subscription        │ admin     │ Stripe Customer Portal + warning modal
  Export all data (LGPD/GDPR)│ admin     │ Rate limited (1 export/24h)
  Bulk delete operations     │ admin     │ Confirmation + audit log
  View payment details       │ admin     │ No extra auth, but logged
  Modify automations         │ admin     │ Audit log
```

---

## 7. Row-Level Security Strategy

### 7.1 JWT Academy Context

```
HOW ACADEMY CONTEXT FLOWS INTO RLS:

  1. User logs in → JWT issued with app_metadata.academy_id
  2. Every Supabase client request includes JWT in cookie/header
  3. PostgreSQL function get_current_academy_id() extracts from JWT:
     auth.jwt() -> 'app_metadata' ->> 'academy_id'
  4. RLS policies on every tenant table:
     USING (academy_id = get_current_academy_id())
  5. Any query automatically filtered to active academy

  This means: even if application code has a bug that forgets to
  WHERE academy_id = X, the RLS policy catches it. Defense in depth.
```

### 7.2 Table Group RLS Strategies

```
GROUP 1: STANDARD TENANT TABLES (majority of tables)
─────────────────────────────────────────────────────
Tables: members, classes, class_sessions, attendance, check_ins,
        techniques, technique_media, student_plans, notifications,
        automations, automation_runs, automation_logs,
        ai_insights, ai_insight_actions, member_belt_history,
        session_techniques, audit_log, invites

Policy:
  FOR ALL
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id())

This is sufficient because:
  - ALL rows belong to exactly one academy
  - The JWT academy_id is the ONLY way to access


GROUP 2: ACADEMY TABLE (special — no standard RLS)
──────────────────────────────────────────────────
Table: academies

Why no standard RLS:
  - Queried BEFORE tenant context exists (slug lookup during login)
  - Queried during onboarding (no academy_id in JWT yet)
  - Contains no sensitive cross-tenant data in the row itself

Protection strategy:
  - SELECT: allow authenticated users to read ONLY academies where
    they have a member record (JOIN-based policy)
  - INSERT: service role only (webhook handler)
  - UPDATE: service role only (webhook handler, admin via server action)
  - DELETE: service role only

Policy:
  CREATE POLICY "academies_select_own" ON academies
    FOR SELECT USING (
      id IN (SELECT academy_id FROM members WHERE user_id = auth.uid())
      OR
      -- Allow slug lookup for anyone (needed for login routing)
      -- This is safe: slug and name are not sensitive
      true  -- BUT limit columns via a VIEW instead
    );

  REVISED APPROACH: Instead of RLS on academies, use a VIEW:
    CREATE VIEW my_academies AS
      SELECT a.* FROM academies a
      INNER JOIN members m ON m.academy_id = a.id
      WHERE m.user_id = auth.uid();

  Slug lookup uses service role (server-side only, in middleware).


GROUP 3: SUBSCRIPTIONS + PAYMENTS (admin-only within tenant)
────────────────────────────────────────────────────────────
Tables: subscriptions, payments

These have standard tenant RLS (academy_id), but the application layer
adds a role check: only admin role can read/write these.

RLS doesn't enforce role (it only enforces tenant). Role enforcement
happens in tRPC procedures:
  - billingRouter uses adminProcedure for all endpoints
  - Even if a student somehow crafted a direct Supabase query,
    RLS would scope to their academy, and they'd see billing data
  - THIS IS ACCEPTABLE for the shared-schema model, but if billing
    data must be hidden from non-admins at the DB level, add:

  CREATE POLICY "payments_admin_only" ON payments
    FOR SELECT USING (
      academy_id = get_current_academy_id()
      AND EXISTS (
        SELECT 1 FROM members
        WHERE academy_id = get_current_academy_id()
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    );

  DECISION: YES, add admin-only RLS on payments and subscriptions.
  Defense in depth. Even if tRPC is bypassed, DB protects it.


GROUP 4: CROSS-TENANT REFERENCES (none in current schema)
─────────────────────────────────────────────────────────
We have NO tables that span multiple academies. This is by design.
If we ever need cross-tenant features (e.g., tournament results
across academies), use a separate schema with its own access model.
```

### 7.3 Multi-Academy User RLS

```
PROBLEM: User belongs to Academy A and Academy B.
         JWT has academy_id = A.
         Can they accidentally see Academy B data?

ANSWER: No.
  - RLS checks academy_id against JWT's app_metadata.academy_id
  - JWT contains EXACTLY ONE academy_id at a time
  - To see Academy B, user must switch (Section 1.5)
  - Switching updates JWT → new RLS scope

PROBLEM: What if user has a stale JWT with Academy A, but their
         membership in Academy A was deleted?

ANSWER: Middleware catches this.
  1. Middleware reads JWT → gets academy_id
  2. Middleware queries members table (via service role):
     "Does this user_id have an active member record in this academy_id?"
  3. If NO → clear app_metadata.academy_id → redirect to academy picker
  4. This check happens on every navigation (cached for 5min with
     a cache-busting mechanism on role/membership changes)

PROBLEM: What about the members table itself? The user needs to
         query the members table to find which academies they belong to.

ANSWER: Special RLS policy on members for the "my memberships" query:
  CREATE POLICY "members_own_user" ON members
    FOR SELECT USING (
      user_id = auth.uid()  -- user can always see their OWN member records
    );

  This allows the academy switcher to query:
    SELECT * FROM members WHERE user_id = auth.uid()
  Which returns all academies the user belongs to, regardless of
  which academy_id is in their JWT.

  For all OTHER operations on members, the standard tenant policy applies:
    academy_id = get_current_academy_id()
```

### 7.4 Service Role Usage Rules

```
SERVICE ROLE (supabaseAdmin) BYPASSES ALL RLS.
It is used ONLY in these contexts:

  1. Stripe webhook handlers
     → Creates/updates academies, subscriptions, payments
     → No user session exists during webhook processing

  2. Cron jobs
     → Subscription status checks, invite cleanup
     → Runs server-side without user context

  3. Academy switch operation
     → Updates app_metadata (requires admin.updateUserById)

  4. Invite acceptance
     → Creates member record during signup flow
     → User may not have academy_id in JWT yet

  5. Onboarding
     → Academy creation, first member creation

RULES:
  - Service role key is NEVER exposed to the client
  - Service role client is instantiated ONLY in:
    src/server/auth/supabase-admin.ts
  - NEVER import supabase-admin.ts from client components
  - server-only package directive enforces this
  - Every use of service role is logged to audit_log
```

---

## 8. Next.js App Router Access Strategy

### 8.1 Middleware Responsibilities

```
middleware.ts runs on EVERY request (except static assets).
It is the FIRST line of defense.

MIDDLEWARE DECISION TREE:
═══════════════════════

  Request arrives
    │
    ├── Is it a public route? (/marketing, /pricing, /api/webhooks)
    │   YES → pass through, no auth needed
    │
    ├── Is it an auth route? (/login, /signup, /forgot-password, /invite)
    │   YES → if already authenticated, redirect to /dashboard
    │         if not, pass through
    │
    ├── Refresh Supabase session (cookie-based)
    │   FAIL → cookies expired, redirect to /login
    │
    ├── Is email verified?
    │   NO → redirect to /verify-email
    │
    ├── Does JWT have academy_id in app_metadata?
    │   NO → redirect to /onboarding/setup (or /join if invited)
    │
    ├── Is it an onboarding route?
    │   YES → if already has academy, redirect to /dashboard
    │         if not, pass through
    │
    ├── Lookup academy status (cached)
    │   'deleted' → redirect to /academy-gone
    │   'suspended' → redirect to /suspended (with details)
    │   'cancelled' → redirect to /reactivate
    │
    ├── Lookup member record (cached)
    │   NOT FOUND → clear academy_id, redirect to /join
    │   'suspended' → redirect to /member-suspended
    │   'inactive' → allow read-only mode (set header)
    │
    ├── Check route-level role requirement
    │   /settings/* → admin only
    │   /billing/* → admin only
    │   /members/invite → admin only
    │   /schedule/*/edit → admin or instructor
    │   /curriculum/*/edit → admin or instructor
    │   /dashboard, /schedule, /curriculum → any role
    │   FAIL → redirect to /dashboard (soft 403)
    │
    └── Pass through → set response headers:
          X-Academy-Id: {academyId}  (for server components)
          X-Member-Role: {role}      (for server components)
          X-Member-Id: {memberId}    (for server components)

IMPORTANT:
  - Middleware runs at the EDGE (Vercel Edge Runtime)
  - It CANNOT make heavy DB queries. Use cached lookups.
  - Cache invalidation: on role change, membership change, or
    academy status change → bust the cache by incrementing a version
    counter in app_metadata or a simple key in Supabase.
  - Middleware NEVER uses service role. It reads the user's JWT only.
```

### 8.2 Protected Route Groups

```
ROUTE GROUP STRUCTURE:
══════════════════════

  (marketing)         → PUBLIC, no auth
    /                 → Landing page
    /pricing          → Pricing page
    /blog             → Blog (future)

  (auth)              → PUBLIC, redirect if already authed
    /login
    /signup
    /forgot-password
    /reset-password
    /verify-email
    /invite           → Token-based invite acceptance

  (onboarding)        → AUTHENTICATED, no academy required
    /onboarding/setup
    /onboarding/plan
    /onboarding/complete

  (dashboard)         → AUTHENTICATED + ACADEMY + ACTIVE MEMBER
    /dashboard        → any role
    /schedule         → any role (read), admin/instructor (write)
    /members          → admin/instructor (list), admin (invite)
    /curriculum       → any role (read), admin/instructor (write)
    /billing          → admin only
    /settings         → admin only

  api/
    /api/webhooks/*   → PUBLIC (validated by webhook signature)
    /api/trpc/*       → AUTHENTICATED (tRPC handles auth internally)
    /api/cron/*       → CRON SECRET header validation
```

### 8.3 Server Component Auth Checks

```
IN SERVER COMPONENTS (RSC):

  Every server component that renders tenant data should:

  1. Read session from Supabase server client:
     const { data: { session } } = await supabase.auth.getSession()

  2. Extract academy context:
     const academyId = session.user.app_metadata.academy_id

  3. For role-gated content:
     const member = await getMember(session.user.id, academyId)
     if (member.role !== 'admin') return <NotAuthorized />

  Helper pattern:
     async function requireRole(minRole: 'admin' | 'instructor' | 'student') {
       const session = await getSession()  // throws if no session
       const member = await getMember(session.user.id)
       if (!hasMinRole(member.role, minRole)) redirect('/dashboard')
       return { session, member }
     }

  Used as:
     export default async function SettingsPage() {
       const { member } = await requireRole('admin')
       // ... render settings
     }

  NEVER do this in a client component. Client components receive
  role/permissions as props from their parent server component.
```

### 8.4 API / Server Action Authorization

```
tRPC PROCEDURES:
  - publicProcedure     → no auth (used for health checks)
  - protectedProcedure  → authenticated + has academy context
  - instructorProcedure → protected + role in ['admin', 'instructor']
  - adminProcedure      → protected + role = 'admin'

  Each procedure type is a tRPC middleware that:
    1. Reads session from request context
    2. Validates role
    3. Passes { academyId, userId, memberId, role } into ctx
    4. Downstream resolvers use ctx.academyId for all queries

SERVER ACTIONS:
  - Same pattern as tRPC procedures
  - Every server action starts with:
    const { session, member } = await requireRole('admin')
  - No server action trusts client-provided academy_id or role
  - academy_id ALWAYS comes from the session JWT

WEBHOOK ROUTES:
  - NO user session. Validated by Stripe signature only.
  - Use supabaseAdmin (service role) for all DB operations.
  - NEVER accept academy_id from webhook payload without
    cross-referencing with stripe_customer_id on the academy.
```

---

## 9. Edge Cases

### 9.1 User Belongs to Multiple Academies

```
SCENARIO: João is admin at "JJ Lisboa" and instructor at "Nova União Porto"

  Login behavior:
    → JWT is issued with the LAST active academy_id
    → If first login ever: pick the first academy (by created_at)
    → Dashboard shows academy switcher in the sidebar

  Academy switch:
    → User clicks "Nova União Porto" in switcher
    → Server validates membership exists and is active
    → Server updates app_metadata.academy_id
    → Server forces JWT refresh
    → Client reloads: new dashboard, new data, new role

  RLS behavior:
    → Before switch: all queries scoped to "JJ Lisboa"
    → After switch: all queries scoped to "Nova União Porto"
    → NEVER both at the same time

  Permissions:
    → In "JJ Lisboa": admin (full access)
    → In "Nova União Porto": instructor (limited access)
    → Role changes IMMEDIATELY on switch. No bleed-through.

  Notifications:
    → Stored per-academy per-member
    → Notification badge shows count for ACTIVE academy only
    → Email notifications sent regardless of active academy
      (email is per-user, not per-academy)
```

### 9.2 Owner Transfers Academy Ownership

```
SCENARIO: Maria (admin) wants to transfer ownership to Pedro (instructor)

  Preconditions:
    - Maria has role='admin' in the academy
    - Pedro has an active member record in the same academy
    - Pedro's role can be any (instructor or student)
    - Academy has exactly 1 admin (Maria) — transfer is needed

  Flow:
    1. Maria navigates to Settings → Danger Zone → Transfer Ownership
    2. Maria re-authenticates (password prompt) ← CRITICAL
    3. Maria selects Pedro from member list
    4. Server validates:
       - Maria is admin
       - Pedro is active member
       - Pedro's auth.users email is verified
    5. Server sends confirmation email to PEDRO's email:
       "Maria wants to transfer ownership of [Academy] to you. Accept?"
    6. Pedro clicks confirmation link
    7. Server (atomic transaction):
       a. Pedro's member.role → 'admin'
       b. Maria's member.role → 'instructor' (demoted, not removed)
       c. Stripe customer email updated to Pedro's email
       d. Audit log entry created
    8. Both users' sessions refreshed on next request

  Guard rails:
    - An academy MUST always have at least 1 admin
    - The last admin cannot demote themselves without transferring first
    - Transfer requires BOTH parties to confirm
    - Transfer is logged with full audit trail
```

### 9.3 Instructor Removed from Academy

```
SCENARIO: Admin removes instructor Carlos from the academy

  Flow:
    1. Admin navigates to Members → Carlos → Remove
    2. Confirmation: "Remove Carlos? They'll lose access immediately."
    3. Server:
       a. Set member.status = 'inactive' (soft removal)
       b. If Carlos's active academy_id matches this academy:
          → Clear app_metadata.academy_id
          → Carlos's next request triggers academy picker
       c. Classes assigned to Carlos:
          → default_instructor_id set to NULL
          → Admin notified: "Reassign Carlos's classes"
       d. Future class_sessions with Carlos as instructor:
          → instructor_id set to NULL
       e. Audit log entry

  What Carlos sees:
    → On next page load: redirected to academy picker
    → If Carlos has other academies: can switch to them
    → If Carlos has NO other academies: sees "No academies" page
    → Carlos's historical data (attendance, belt history) is PRESERVED
      but only visible to the academy's admins, not to Carlos

  Full deletion (hard remove):
    → Only via admin explicit action: "Delete member permanently"
    → Cascades: attendance, check_ins, notifications, belt_history
    → auth.users record PRESERVED (Carlos keeps their login)
```

### 9.4 Student Converted to Instructor

```
SCENARIO: Blue belt Ana is promoted to assistant instructor

  Flow:
    1. Admin navigates to Members → Ana → Edit Role
    2. Changes role from 'student' to 'instructor'
    3. Server:
       a. Update member.role = 'instructor'
       b. Audit log entry
       c. Cache bust for Ana's member lookup
       d. Notification sent to Ana: "You're now an instructor!"
    4. Ana's next page load:
       → Middleware detects role change (cached lookup refreshed)
       → Dashboard shows instructor-level navigation
       → Ana can now manage classes and take attendance

  What does NOT change:
    - Ana's member.id (same record, role updated)
    - Ana's attendance history (preserved as student records)
    - Ana's belt rank (unchanged)
    - Ana's auth.users record (unchanged)
    - Ana's student_plans (if any — admin decides whether to keep/cancel)

  Reversal:
    - Admin can change role back to 'student' at any time
    - Same audit log pattern
    - Ana loses instructor permissions immediately
```

### 9.5 Suspended Academy

```
SCENARIO: Academy's Stripe subscription fails payment after retries

  Timeline:
    Day 0: invoice.payment_failed webhook received
      → academy.status = 'past_due'
      → Admin notified via email + in-app notification
      → Full access continues (grace period)

    Day 14: Second payment attempt fails
      → Admin notified again (urgent)

    Day 30: Final payment attempt fails
      → academy.status = 'suspended'
      → App enters READ-ONLY mode:
        - All users can log in
        - All users can VIEW data (schedule, members, curriculum)
        - NO writes allowed (no check-ins, no new classes, no edits)
        - Admin sees prominent banner: "Update payment to restore access"
        - Stripe Customer Portal link prominently displayed

    Day 90: customer.subscription.deleted webhook
      → academy.status = 'cancelled'
      → App enters EXPORT-ONLY mode:
        - Admin can log in
        - Admin can export data (LGPD/GDPR compliance)
        - No other access
        - Other members see: "This academy is no longer active"

  Middleware enforcement:
    → On every request, middleware checks academy.status
    → 'past_due': full access, but show warning banner
    → 'suspended': read-only mode (set X-Academy-Readonly header)
    → 'cancelled': admin-only, export-only
    → 'deleted': redirect to /academy-gone

  API enforcement:
    → tRPC context checks academy status
    → For 'suspended': mutating procedures throw TRPCError('FORBIDDEN')
    → For 'cancelled': all procedures except export throw FORBIDDEN
```

### 9.6 Subscription Delinquency (Student Plan Level)

```
SCENARIO: Student's monthly plan managed by the academy is overdue

  This is a student_plans concern, NOT a Stripe concern (unless using
  Stripe Connect in the future). For now, student billing is managed
  externally (cash, PIX, bank transfer) and tracked in student_plans.

  Flow:
    1. student_plans.next_billing_at passes without admin marking paid
    2. Cron job (daily): find plans where next_billing_at < now()
       → Set student_plan.status = 'past_due'
       → Create notification for admin: "João's plan is overdue"
    3. Admin decides:
       a. Mark as paid → status = 'active', advance next_billing_at
       b. Pause → member.status = 'inactive' (student can't check in)
       c. Cancel → student_plan.status = 'cancelled'

  The system does NOT auto-suspend students. The admin controls this.
  Different academies have very different tolerance for late payments.
  (A Brazilian academy may be lenient; a European one may be strict.)
```

---

## 10. Security Pitfalls to Avoid

### 10.1 Confused Deputy Problem

```
WHAT IT IS:
  A "confused deputy" attack tricks a privileged component into
  performing actions on behalf of an attacker.

IN OUR CONTEXT:
  - The tRPC server has service role access to Supabase
  - If an API endpoint takes academy_id from the REQUEST BODY
    instead of from the JWT, an attacker can pass another academy's ID
  - The server (the "deputy") executes the action with its elevated
    privileges against the wrong tenant

PREVENTION:
  ✅ ALWAYS read academy_id from session JWT (server-side)
  ❌ NEVER read academy_id from request body, query params, or headers
  ❌ NEVER read academy_id from cookies set by the client
  ✅ tRPC context sets academyId ONCE from the JWT, and every
     downstream resolver uses ctx.academyId exclusively
```

### 10.2 Trusting Client-Side Role Checks

```
WHAT IT IS:
  Showing/hiding UI based on role is fine for UX, but it's NOT security.
  If the server doesn't also check the role, a user can bypass the UI.

IN OUR CONTEXT:
  - React component: {role === 'admin' && <DeleteButton />}
  - This hides the button for non-admins
  - But a non-admin can call the tRPC endpoint directly
  - If the endpoint doesn't check role, the action succeeds

PREVENTION:
  ✅ EVERY mutating tRPC procedure checks role via middleware
  ✅ EVERY server action checks role via requireRole()
  ✅ Client-side role checks are ONLY for UX (show/hide)
  ❌ NEVER skip server-side role check because "the button is hidden"
```

### 10.3 Academy Context Spoofing

```
WHAT IT IS:
  An attacker tries to make the system think they belong to a
  different academy than they actually do.

ATTACK VECTORS:
  1. Modify JWT payload → Fails: JWT is signed by Supabase secret
  2. Pass academy_id in URL/body → Fails: server ignores it (Section 10.1)
  3. Switch to academy they don't belong to →
     Fails: switchAcademy() validates membership first
  4. Craft a Supabase query with different academy_id →
     Fails: RLS enforces JWT's academy_id regardless of query

PREVENTION:
  ✅ JWT is the SOLE source of academy context
  ✅ app_metadata can ONLY be modified via admin API (server-side)
  ✅ RLS doesn't trust anything except the JWT
  ✅ Middleware validates membership on every request
```

### 10.4 Invite Abuse

```
ATTACK VECTORS:

  1. Brute-force invite tokens
     → Tokens are 32 bytes hex (256 bits of entropy)
     → 2^256 possible values → computationally infeasible
     → Rate limit on /invite endpoint: 10 attempts/min per IP

  2. Email enumeration via invites
     → "This invite was sent to a different email" reveals the
       invite exists. Acceptable risk for UX. Could make generic
       "Invalid invite" message if concerned.

  3. Replay accepted invite
     → Server checks accepted_at IS NULL before accepting
     → Token is one-time use

  4. Invite to self-escalate
     → Admin invites themselves with 'admin' role to another academy
     → This is legitimate: admin of Academy A can be invited to
       Academy B by Academy B's admin
     → An admin CANNOT invite themselves to their OWN academy with
       a different role (server rejects: already a member)

  5. Mass invite spam
     → Rate limit: 20 invites/day per academy
     → Invites tracked: invited_by shows who created them
     → Abuse → admin account suspended

PREVENTION:
  ✅ Cryptographically secure token generation
  ✅ One-time use with accepted_at check
  ✅ Expiry (7 days)
  ✅ Rate limiting per academy
  ✅ Email-bound (token only valid for the invited email)
```

### 10.5 Privilege Escalation

```
ATTACK VECTORS:

  1. Student modifies their own role in the members table
     → Fails: RLS allows read, but UPDATE on role column is
       protected by tRPC/server action role check
     → Even with direct Supabase client, the UPDATE policy
       requires the user to be admin (see Group 3 RLS)

  2. Instructor changes their role to admin
     → Same protection as above
     → Only admin can change roles
     → Only admin can change OTHER members' roles (not their own
       to a higher level — no self-promotion)

  3. Student accesses admin API endpoints
     → tRPC: adminProcedure middleware rejects before execution
     → Server actions: requireRole('admin') rejects
     → Even if they craft the right request shape

  4. Accessing another academy's data by manipulating member.academy_id
     → Fails: RLS on members uses JWT academy_id, not the row's
     → User can only see members in their active academy

PREVENTION:
  ✅ Role changes ONLY through adminProcedure
  ✅ Self-role-change explicitly blocked (cannot promote yourself)
  ✅ RLS is the ultimate gatekeeper for data access
  ✅ Role checked at EVERY authorization layer (middleware + tRPC + RLS)
```

---

## 11. Recommended Auth Implementation Order

```
PHASE 1: FOUNDATION (week 1-2)
═══════════════════════════════
  □ 1. Supabase project setup + auth configuration
       - Email provider, PKCE flow, redirect URLs
  □ 2. get_current_academy_id() PostgreSQL function
  □ 3. RLS policies on all tenant tables
  □ 4. supabase-server.ts + supabase-admin.ts clients
  □ 5. middleware.ts with session refresh + public route bypass

PHASE 2: ACADEMY CREATION (week 2-3)
═════════════════════════════════════
  □ 6. Signup page (email + password)
  □ 7. Email verification flow
  □ 8. Onboarding: academy setup form
  □ 9. Stripe Checkout integration
  □ 10. Stripe webhook → academy + member bootstrap
  □ 11. Post-checkout redirect + session refresh

PHASE 3: AUTH + TENANT CONTEXT (week 3-4)
═════════════════════════════════════════
  □ 12. Login page (email/password + magic link)
  □ 13. Password reset flow
  □ 14. Middleware: academy_id validation + status checks
  □ 15. Middleware: role-based route protection
  □ 16. tRPC context: session + academy + role injection
  □ 17. protectedProcedure / instructorProcedure / adminProcedure

PHASE 4: INVITATIONS (week 4-5)
════════════════════════════════
  □ 18. Invite creation (admin only)
  □ 19. Invite email sending (Resend)
  □ 20. Invite acceptance page (signup or login)
  □ 21. Invite → membership creation (atomic)
  □ 22. Invite expiry + revocation

PHASE 5: MULTI-ACADEMY (week 5-6)
══════════════════════════════════
  □ 23. Academy switcher component
  □ 24. switchAcademy server action
  □ 25. JWT refresh on switch
  □ 26. "My academies" query (special RLS policy)

PHASE 6: MANAGED PROFILES (week 6-7)
═════════════════════════════════════
  □ 27. Schema revision: members.user_id nullable
  □ 28. Admin: create managed profile (no auth.users)
  □ 29. Activation invite flow (link managed profile to auth user)
  □ 30. Attendance for managed profiles (instructor marks)

PHASE 7: HARDENING (week 7-8)
══════════════════════════════
  □ 31. Rate limiting on auth endpoints
  □ 32. Audit log for sensitive actions
  □ 33. Academy suspension/read-only mode
  □ 34. Ownership transfer flow
  □ 35. Data export (LGPD/GDPR)
  □ 36. Security review + penetration testing
```

---

## 12. Permission Matrix Summary

### Full Permission Matrix

```
┌──────────────────────────────────┬───────┬────────────┬─────────┬───────────┐
│ Action                           │ Admin │ Instructor │ Student │ Managed*  │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ ACADEMY MANAGEMENT               │       │            │         │           │
│ View academy info                │  ✅   │     ✅     │   ✅    │    ❌     │
│ Edit academy settings            │  ✅   │     ❌     │   ❌    │    ❌     │
│ Transfer ownership               │  ✅   │     ❌     │   ❌    │    ❌     │
│ Delete academy                   │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ BILLING                          │       │            │         │           │
│ View subscription                │  ✅   │     ❌     │   ❌    │    ❌     │
│ Manage plan                      │  ✅   │     ❌     │   ❌    │    ❌     │
│ View payment history             │  ✅   │     ❌     │   ❌    │    ❌     │
│ Manage student plans             │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ MEMBER MANAGEMENT                │       │            │         │           │
│ Invite members                   │  ✅   │     ❌     │   ❌    │    ❌     │
│ Remove members                   │  ✅   │     ❌     │   ❌    │    ❌     │
│ Change member roles              │  ✅   │     ❌     │   ❌    │    ❌     │
│ View all members                 │  ✅   │     ✅     │   ❌    │    ❌     │
│ View member profile              │  ✅   │     ✅     │   🔶**  │    ❌     │
│ Edit own profile                 │  ✅   │     ✅     │   ✅    │    ❌     │
│ Create managed profile           │  ✅   │     🔶***  │   ❌    │    ❌     │
│ Promote belt rank                │  ✅   │     ✅     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ SCHEDULE                         │       │            │         │           │
│ View schedule                    │  ✅   │     ✅     │   ✅    │    ❌     │
│ Create/edit class template       │  ✅   │     ✅     │   ❌    │    ❌     │
│ Cancel class session             │  ✅   │     ✅     │   ❌    │    ❌     │
│ Assign instructor to class       │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ ATTENDANCE                       │       │            │         │           │
│ Self check-in                    │  ✅   │     ✅     │   ✅    │    ❌     │
│ Take attendance (others)         │  ✅   │     ✅     │   ❌    │    ❌     │
│ Bulk check-in                    │  ✅   │     ✅     │   ❌    │    ❌     │
│ View own attendance history      │  ✅   │     ✅     │   ✅    │    ❌     │
│ View all attendance              │  ✅   │     ✅     │   ❌    │    ❌     │
│ Edit/delete attendance records   │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ CURRICULUM                       │       │            │         │           │
│ View published techniques        │  ✅   │     ✅     │   ✅    │    ❌     │
│ Create/edit techniques           │  ✅   │     ✅     │   ❌    │    ❌     │
│ Delete techniques                │  ✅   │     ❌     │   ❌    │    ❌     │
│ Manage technique media           │  ✅   │     ✅     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ AUTOMATIONS                      │       │            │         │           │
│ View automations                 │  ✅   │     ❌     │   ❌    │    ❌     │
│ Create/edit automations          │  ✅   │     ❌     │   ❌    │    ❌     │
│ View automation logs             │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ AI INSIGHTS                      │       │            │         │           │
│ View insights (academy-level)    │  ✅   │     ❌     │   ❌    │    ❌     │
│ View insights (class-level)      │  ✅   │     ✅     │   ❌    │    ❌     │
│ Dismiss/action insights          │  ✅   │     ✅     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ NOTIFICATIONS                    │       │            │         │           │
│ Receive notifications            │  ✅   │     ✅     │   ✅    │    ❌     │
│ Manage notification prefs        │  ✅   │     ✅     │   ✅    │    ❌     │
│ Send academy announcements       │  ✅   │     ❌     │   ❌    │    ❌     │
├──────────────────────────────────┼───────┼────────────┼─────────┼───────────┤
│ AUDIT                            │       │            │         │           │
│ View audit log                   │  ✅   │     ❌     │   ❌    │    ❌     │
│ Export data                      │  ✅   │     ❌     │   ❌    │    ❌     │
└──────────────────────────────────┴───────┴────────────┴─────────┴───────────┘

  * Managed = managed profile (no login, no user_id)
  ** Students can view OTHER students' limited profile (name, belt)
     only if academy setting "student_directory" is enabled
  *** Instructors can create managed profiles only if academy setting
      "instructor_can_add_students" is enabled
```

---

## 13. Top 10 Mistakes to Avoid

```
 1. READING academy_id FROM THE REQUEST BODY INSTEAD OF THE JWT
    The #1 multi-tenant vulnerability. academy_id MUST come from
    the server-side session. Never from the client. Never from URL.

 2. FORGETTING RLS ON A NEW TABLE
    Every new migration MUST include RLS setup. Add a CI check that
    flags any public table without RLS enabled (except academies).

 3. USING SUPABASE ADMIN CLIENT FROM CLIENT-SIDE CODE
    The service role key in the browser = game over. Use the
    "server-only" package to prevent accidental imports.

 4. CHECKING ROLES ONLY IN THE UI
    {role === 'admin' && <DeleteButton />} is UX, not security.
    The API endpoint MUST also check the role.

 5. ALLOWING SELF-PROMOTION
    A user should NEVER be able to change their own role to a
    higher level. Role changes must be by a member with higher
    or equal authority (admin for all changes).

 6. NOT VALIDATING MEMBERSHIP ON ACADEMY SWITCH
    When switching academy, the server MUST verify the user has
    an active membership. A stale JWT with old academy_id could
    otherwise grant access to an academy the user was removed from.

 7. CREATING ACADEMY BEFORE PAYMENT
    If you create the academy on the setup form (before Stripe),
    you get orphan academies, slug squatting, and spam.
    Academy creation belongs in the Stripe webhook.

 8. TRUSTING STRIPE WEBHOOK DATA WITHOUT SIGNATURE VERIFICATION
    Always use stripe.webhooks.constructEvent() with the webhook
    secret. A forged webhook could create rogue academies.

 9. HARDCODING ROLE STRINGS INSTEAD OF USING A TYPE SYSTEM
    Define roles as a TypeScript union type and a Zod enum.
    Use them everywhere. A typo like 'admim' should be a
    compile-time error, not a runtime mystery.

10. NOT HANDLING THE "MANAGED PROFILE → FULL ACCOUNT" TRANSITION
    When a managed profile (user_id=NULL) activates their account,
    the server must link the EXISTING member record to the new
    auth.users — NOT create a duplicate member. Match by
    (academy_id, email) to find the existing profile.
```

---

## Appendix: Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Role in JWT? | NO (only academy_id) | Role can change without re-login; queried from DB |
| Role in RLS? | Only for billing tables | Keep RLS simple; role checks in app layer |
| Managed profiles? | YES (user_id nullable) | BJJ reality: many students don't want app accounts |
| Multi-academy? | YES (single JWT, switchable) | Instructors commonly teach at multiple academies |
| Session storage | Cookies (HTTP-only) | Secure, automatic, SSR-compatible |
| Invite model | Email-bound, one-time token | Simple, secure, no link sharing abuse |
| Academy creation timing | On Stripe webhook only | No orphans, no spam, Stripe is source of truth |
| Ownership transfer | Dual confirmation (email) | Prevents accidental or social-engineered transfers |
| Suspended mode | Read-only (not locked out) | Users need to see data to decide to reactivate |
