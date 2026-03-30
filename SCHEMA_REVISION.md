# BJJFlow - Schema Revision Report

> Source of truth: ACCESS_MODEL.md
> Subject of review: DATABASE_SCHEMA.md
> Purpose: Align schema design to access model before any SQL generation

---

## 1. Schema Revision Report

### 1.1 Audit Methodology

Every table in DATABASE_SCHEMA.md was compared against the following
ACCESS_MODEL.md sections:

- Section 1: Authentication Model (identity boundary, session strategy)
- Section 3: Membership and Role Model (nullable user_id, multi-academy)
- Section 5: Student Onboarding Flow (managed profiles, Path B/C)
- Section 6: Authorization Model (RBAC layers, resource ownership)
- Section 7: RLS Strategy (admin-only billing, special members policy)
- Section 9: Edge Cases (ownership transfer, instructor removal, suspension)
- Section 10: Security Pitfalls (confused deputy, self-promotion)

### 1.2 Findings Summary

```
TOTAL MISMATCHES FOUND: 27

  CRITICAL (blocks correct behavior):          7
  HIGH     (security or data integrity risk):  9
  MEDIUM   (missing feature, incomplete):      7
  LOW      (naming, clarity, optimization):    4
```

---

## 2. Exact List of Changes Needed

### CRITICAL ISSUES

```
C-1  members.user_id is NOT NULL — must be NULLABLE
─────────────────────────────────────────────────────
  CURRENT:  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
  REQUIRED: user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL

  WHY: ACCESS_MODEL Section 5.1 defines three student entry paths.
  Path B ("Managed Profile") creates a member record WITHOUT an auth
  account. user_id must be NULL for these profiles.

  ALSO: ON DELETE CASCADE is wrong. If an auth.users record is deleted
  (admin action in Supabase dashboard), we should NOT cascade-delete
  the member record — it holds belt history, attendance, and billing data.
  ON DELETE SET NULL preserves the member as a managed profile.

  IMPACT: Unique constraint must also change (see C-2).


C-2  UNIQUE(academy_id, user_id) breaks with nullable user_id
─────────────────────────────────────────────────────────────
  CURRENT:  UNIQUE(academy_id, user_id)  — table-level constraint
  REQUIRED: Partial unique indexes instead:

    idx_members_academy_user_unique:
      UNIQUE(academy_id, user_id) WHERE user_id IS NOT NULL
      → Prevents one auth user from having two memberships in same academy

    idx_members_academy_email_managed:
      UNIQUE(academy_id, email) WHERE user_id IS NULL
      → Prevents duplicate managed profiles with same email in same academy

  WHY: In PostgreSQL, UNIQUE constraints do not treat NULL as equal,
  so UNIQUE(academy_id, user_id) would allow infinite rows with
  user_id=NULL for the same academy. The partial indexes enforce
  the correct uniqueness rules for each profile type.


C-3  members table missing has_portal_access flag
─────────────────────────────────────────────────
  CURRENT:  No way to distinguish "managed profile" from "full account"
            except by checking user_id IS NULL.
  REQUIRED: Add column:
    has_portal_access boolean NOT NULL DEFAULT false

  WHY: ACCESS_MODEL Section 5.1 Path C describes the transition from
  managed profile to full account. The flag provides:
    - Explicit intent (not just inferred from user_id nullability)
    - Query filter for "students with app access" reports
    - Guard in RLS/application: managed profiles should never appear
      in "my academies" queries even after user_id is linked

  RULE: has_portal_access = true REQUIRES user_id IS NOT NULL.
  Enforced by CHECK constraint:
    CHECK (has_portal_access = false OR user_id IS NOT NULL)


C-4  academies table has no owner_id column
───────────────────────────────────────────
  CURRENT:  Academy ownership is implied by "the admin member."
            But multiple members can have role='admin'.
  REQUIRED: Add column:
    owner_id uuid NOT NULL REFERENCES auth.users(id)

  WHY: ACCESS_MODEL Section 9.2 describes ownership transfer. The
  system needs to know WHO is the single accountable owner:
    - Stripe billing contact defaults to owner
    - Transfer requires dual confirmation (Section 9.2)
    - "Last admin cannot demote themselves" requires knowing who is owner
    - LGPD/GDPR data controller is the owner
    - Deletion requires owner confirmation

  IMPORTANT: owner_id references auth.users, NOT members, because:
    - The owner always has an auth account (created the academy)
    - The FK should survive even if the member record is modified
    - On ownership transfer: update owner_id to new user's auth.users.id

  CONSTRAINT: The owner MUST always have an active admin member record
  in the same academy. Enforced at the application level (not FK, since
  it would create a circular reference with members).


C-5  academies RLS is completely absent — needs explicit policy
──────────────────────────────────────────────────────────────
  CURRENT:  Comment says "No RLS on academies" with service role for writes.
  REQUIRED: RLS ENABLED with specific policies:

    SELECT policy for authenticated users:
      Authenticated users can read academies where they have a member record.
      Plus: anyone can read (id, slug, name, logo_url) for login routing.
      Implementation: Use a VIEW for public fields, RLS for full row.

    INSERT/UPDATE/DELETE: service role only (no user-facing policy).

  WHY: ACCESS_MODEL Section 7.2 Group 2 explicitly designs this.
  Without RLS, any authenticated user with the anon/authenticated
  Supabase key could query ALL academies (names, emails, addresses,
  Stripe IDs). This is a data leak.


C-6  Billing tables lack admin-only RLS policies
────────────────────────────────────────────────
  CURRENT:  subscriptions and payments have standard tenant-only RLS:
            academy_id = get_current_academy_id()
  REQUIRED: Add role-checking RLS for SELECT:

    USING (
      academy_id = get_current_academy_id()
      AND EXISTS (
        SELECT 1 FROM members
        WHERE academy_id = get_current_academy_id()
        AND user_id = auth.uid()
        AND role = 'admin'
      )
    )

  WHY: ACCESS_MODEL Section 7.2 Group 3 explicitly states billing data
  must be hidden from non-admins at the DB level. Without this, any
  member (student, instructor) who crafts a direct Supabase query
  could read all payment amounts, Stripe IDs, and invoice URLs.

  TABLES AFFECTED: subscriptions, payments
  student_plans KEEPS standard tenant RLS (admin-only enforced at app layer
  because instructors may need limited visibility in future).


C-7  invites table allows role='admin' — it should not
─────────────────────────────────────────────────────
  CURRENT:  CHECK (role IN ('instructor', 'student'))  ← This is actually correct!
  CORRECTION: Re-reading the schema — this IS correct as-is.
  However, the invites table is MISSING a type column to distinguish
  between:
    - 'invite'     → standard invite for new member
    - 'activation' → activate portal for existing managed profile

  ACCESS_MODEL Section 5.1 Path C describes activation invites that
  link an existing managed profile to a new auth.users account.
  The current invite schema has no way to carry the target member_id
  for activation.

  REQUIRED: Add columns:
    invite_type text NOT NULL DEFAULT 'invite'
      CHECK (invite_type IN ('invite', 'activation'))
    target_member_id uuid REFERENCES members(id) ON DELETE CASCADE
      → Only set for 'activation' type. References the managed profile
        to be linked.
  CONSTRAINT:
    CHECK (
      (invite_type = 'invite' AND target_member_id IS NULL)
      OR
      (invite_type = 'activation' AND target_member_id IS NOT NULL)
    )
```

### HIGH ISSUES

```
H-1  members.email should allow NULL for certain managed profiles
────────────────────────────────────────────────────────────────
  CURRENT:  email text NOT NULL
  REQUIRED: email text  (nullable)

  WHY: Some managed profiles may be created by admin with only a name
  and phone number. Not every Brazilian BJJ student has or provides
  an email address. Email is required for auth users (enforced by
  Supabase), but managed profiles may have phone-only contact.

  IMPACT: The partial unique index idx_members_academy_email_managed
  should only apply WHERE user_id IS NULL AND email IS NOT NULL.


H-2  get_current_academy_id() fallback to zero UUID is dangerous
────────────────────────────────────────────────────────────────
  CURRENT:  COALESCE(..., '00000000-0000-0000-0000-000000000000'::uuid)
  REQUIRED: Return NULL when no academy_id in JWT:
    SELECT (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid;
    — no COALESCE

  WHY: If the JWT has no academy_id (user hasn't created academy yet),
  the COALESCE returns a zero UUID. RLS then checks:
    academy_id = '00000000-...'
  If ANY table accidentally has a row with that UUID as academy_id
  (data corruption, migration error), the user could access it.

  Returning NULL instead means:
    academy_id = NULL → always false → no rows returned
  This is the safe default. No data leak possible.


H-3  academies.settings default includes feature flags that
     should be separate columns
──────────────────────────────────────────────────────────
  CURRENT:  settings jsonb with allow_student_self_checkin,
            instructor_can_add_students (mentioned in ACCESS_MODEL
            but missing from schema), etc.
  REQUIRED: Extract permission-related settings into explicit columns:

    allow_student_self_checkin    boolean NOT NULL DEFAULT true
    require_checkin_geolocation   boolean NOT NULL DEFAULT false
    instructor_can_add_students   boolean NOT NULL DEFAULT false
    student_directory_visible     boolean NOT NULL DEFAULT false

  WHY: ACCESS_MODEL Section 6.2 and Section 12 reference these settings
  as permission gates. Storing them in a jsonb blob means:
    - No type safety (boolean vs string "true")
    - No NOT NULL enforcement
    - No default enforcement
    - Cannot be referenced in RLS policies (jsonb extraction is slow
      and error-prone in policies)
    - Cannot be used in CHECK constraints

  KEEP settings jsonb for non-permission config (timezone display format,
  theme colors, UI preferences, etc.)


H-4  members table missing created_by column
────────────────────────────────────────────
  CURRENT:  No record of WHO created the member.
  REQUIRED: Add column:
    created_by uuid REFERENCES members(id) ON DELETE SET NULL

  WHY: ACCESS_MODEL defines three creation paths:
    - Owner creates themselves (created_by = NULL, bootstrap)
    - Admin creates managed profile (created_by = admin's member_id)
    - Invite acceptance (created_by = NULL, or invited_by from invite)
  The created_by column enables:
    - Audit trail for managed profile creation
    - "Who added this student?" reporting
    - Distinguishing self-registered from admin-created


H-5  audit_log.actor_id should be nullable
──────────────────────────────────────────
  CURRENT:  actor_id uuid NOT NULL REFERENCES members(id)
  REQUIRED: actor_id uuid REFERENCES members(id) ON DELETE SET NULL

  WHY: Some audit events are system-generated (Stripe webhooks,
  cron jobs) with no human actor. Also, if a member is later removed,
  their past audit entries should be preserved (SET NULL, not CASCADE).

  Add columns for system-initiated events:
    actor_type text NOT NULL DEFAULT 'member'
      CHECK (actor_type IN ('member', 'system', 'webhook', 'cron'))
    actor_id   uuid REFERENCES members(id) ON DELETE SET NULL
      → NULL when actor_type != 'member'


H-6  notifications table assumes all members have app access
───────────────────────────────────────────────────────────
  CURRENT:  notifications always reference member_id with no
            consideration for managed profiles.
  REQUIRED: Add awareness of delivery capability:

  A managed profile (has_portal_access=false) cannot receive in_app
  notifications. They CAN receive email/sms/whatsapp if the academy
  has their contact info.

  ADD constraint or application rule:
    If channel = 'in_app', the target member MUST have
    has_portal_access = true.
  Enforced at application level (not FK constraint).


H-7  classes.default_instructor_id has no role validation
────────────────────────────────────────────────────────
  CURRENT:  FK to members(id) with no check that the member is actually
            an instructor.
  REQUIRED: Application-level validation that the referenced member has
    role IN ('admin', 'instructor').

  WHY: Nothing in the schema prevents assigning a student as the default
  instructor. This should be validated at the tRPC/server action layer.

  NOT a schema constraint because:
    - Roles can change (student promoted to instructor — no need to
      update all class records)
    - CHECK constraints cannot reference other tables
    - Trigger-based validation is fragile


H-8  student_plans needs admin-only application enforcement documented
────────────────────────────────────────────────────────────────────
  CURRENT:  Standard tenant-only RLS on student_plans.
  DECISION: Keep tenant-only RLS (not admin-only at DB level) because:
    - Instructors may need to see student plan status in future
      (e.g., "is this student's plan active before checking them in?")
    - Admin-only write restriction enforced at tRPC layer

  ADD documentation comment in schema noting this decision.


H-9  No mechanism for ownership transfer at the schema level
───────────────────────────────────────────────────────────
  CURRENT:  Nothing in the schema supports the ownership transfer flow
            described in ACCESS_MODEL Section 9.2.
  REQUIRED: With C-4 (owner_id column on academies), also add:

  New table: ownership_transfers
    id                uuid PRIMARY KEY
    academy_id        uuid NOT NULL REFERENCES academies(id)
    from_user_id      uuid NOT NULL REFERENCES auth.users(id)
    to_user_id        uuid NOT NULL REFERENCES auth.users(id)
    status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired'))
    initiated_at      timestamptz NOT NULL DEFAULT now()
    confirmed_at      timestamptz
    expires_at        timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
    confirmation_token text UNIQUE NOT NULL

  WHY: Ownership transfer requires dual confirmation and has an expiry.
  This state must be persisted (not just in-memory) because it spans
  two separate user sessions (old owner initiates, new owner confirms).
```

### MEDIUM ISSUES

```
M-1  invites table missing academy_name denormalization
──────────────────────────────────────────────────────
  The invite email needs the academy name. Currently, the email
  template must JOIN to academies. Not a schema issue per se, but
  adding a denormalized academy_name field on invites would:
    - Simplify email rendering (no JOIN needed in email worker)
    - Preserve the name at time of invite (academy could rename later)

  DECISION: Do NOT add. Read from academies at email-send time.
  The JOIN is trivial and renaming is rare. Denormalization creates
  a sync problem.


M-2  No revoked_at column on invites
────────────────────────────────────
  CURRENT:  Admin revokes by DELETE.
  REQUIRED: Add column:
    revoked_at  timestamptz
    revoked_by  uuid REFERENCES members(id)

  WHY: ACCESS_MODEL Section 4.2 describes revocation. Soft-revoke
  (setting revoked_at) is better than DELETE because:
    - Audit trail preserved
    - Prevents token reuse if somehow still in someone's email
    - Query: "active invites" = WHERE accepted_at IS NULL
      AND revoked_at IS NULL AND expires_at > now()


M-3  members table missing last_academy_id for multi-academy login
─────────────────────────────────────────────────────────────────
  ACCESS_MODEL Section 3.3 says: "On login, if user has N memberships
  → last active academy is used (stored in app_metadata from previous
  session)."

  This is already handled by app_metadata.academy_id persisting across
  sessions. No schema change needed.

  CONFIRMED: No change required.


M-4  academies.settings jsonb should have a documented shape
───────────────────────────────────────────────────────────
  After extracting permission booleans (H-3), the remaining settings
  jsonb needs a documented interface. Add a comment listing expected
  keys:
    -- Non-permission settings (UI/display preferences):
    -- { "theme": "dark", "date_format": "DD/MM/YYYY",
    --   "default_class_duration_min": 60, "belt_system": "ibjjf" }


M-5  Schema overview diagram mentions payment_line_items and
     notification_reads tables that don't exist
────────────────────────────────────────────────────────────
  The ASCII diagram at the top of DATABASE_SCHEMA.md references:
    - payment_line_items (never defined)
    - notification_reads (never defined)
    - ai_models_config (never defined)

  DECISION:
    - payment_line_items: NOT NEEDED. Payments map 1:1 to Stripe invoices.
      Line item detail lives in Stripe, not our DB.
    - notification_reads: NOT NEEDED. notifications.read_at serves this.
    - ai_models_config: NOT NEEDED for MVP. AI model selection is
      environment config, not per-academy DB config.

  ACTION: Remove these from the overview diagram.


M-6  attendance.checked_in_by should support managed profiles
────────────────────────────────────────────────────────────
  CURRENT:  checked_in_by uuid REFERENCES members(id)
  This already works because managed profiles have member records.
  An instructor (with user_id) marks attendance for a managed student
  (member_id without user_id). The FK is valid.

  CONFIRMED: No change required.


M-7  class_sessions should track who created/cancelled
─────────────────────────────────────────────────────
  CURRENT:  No record of who cancelled a session or why.
  REQUIRED: Add columns:
    cancelled_by  uuid REFERENCES members(id) ON DELETE SET NULL
    cancel_reason text

  WHY: ACCESS_MODEL Section 9.3 describes instructor removal triggering
  session reassignment. Having cancelled_by helps with:
    - "Who cancelled this class?" audit question
    - Distinguishing system-cancelled (instructor removed) from
      admin-cancelled (weather, holiday)
```

### LOW ISSUES

```
L-1  Inconsistent ON DELETE behavior across FK references
────────────────────────────────────────────────────────
  Some FKs use ON DELETE CASCADE, others ON DELETE SET NULL, some
  have no ON DELETE clause (defaults to RESTRICT).

  STANDARDIZE:
    - academy_id FKs: ON DELETE CASCADE (delete academy = delete all data)
    - member_id FKs (for actors/creators): ON DELETE SET NULL
      (preserve records even if member is removed)
    - member_id FKs (for ownership): ON DELETE CASCADE
      (e.g., student_plans, belt_history — meaningless without member)
    - user_id on members: ON DELETE SET NULL (preserve managed profile)


L-2  Naming inconsistency: some tables use created_by, others use
     invited_by, actor_id, etc.
─────────────────────────────────────────────────────────────────
  STANDARDIZE the "who did this" column pattern:
    - For creation: created_by uuid REFERENCES members(id)
    - For auditing: actor_id uuid REFERENCES members(id)
    - For specific actions: promoted_by, cancelled_by, etc.
  These are already mostly consistent. Just document the convention.


L-3  techniques.position CHECK constraint is too restrictive
───────────────────────────────────────────────────────────
  The CHECK constraint lists 17 specific positions. BJJ has many more
  (rubber guard, worm guard, berimbolo position, etc.) and academies
  create custom positions.

  DECISION: Remove CHECK constraint on position and category.
  Use application-level validation instead. Let academies define
  custom position/category taxonomies.

  Replace with: position text NOT NULL, category text NOT NULL
  (no CHECK, validated at app layer with configurable options).


L-4  Schema uses both "stripe" and "stripes" as terms
────────────────────────────────────────────────────
  - members.stripes = belt stripes (0-4)
  - notifications type 'stripe_earned' = belt stripe earned
  - Various stripe_* columns = Stripe payment platform

  RENAME notification type: 'stripe_earned' → 'belt_stripe_earned'
  This prevents confusion in code and logs.
```

---

## 3. Updated Table Design Decisions

### 3.1 members (REVISED)

```
CHANGES FROM CURRENT:
  1. user_id: NOT NULL → NULLABLE (managed profiles)
  2. user_id FK: ON DELETE CASCADE → ON DELETE SET NULL
  3. email: NOT NULL → NULLABLE (phone-only managed profiles)
  4. ADD: has_portal_access boolean NOT NULL DEFAULT false
  5. ADD: created_by uuid REFERENCES members(id) ON DELETE SET NULL
  6. REMOVE: UNIQUE(academy_id, user_id) table constraint
  7. ADD: Partial unique index on (academy_id, user_id) WHERE user_id IS NOT NULL
  8. ADD: Partial unique index on (academy_id, email) WHERE user_id IS NULL AND email IS NOT NULL
  9. ADD: CHECK (has_portal_access = false OR user_id IS NOT NULL)

REVISED COLUMN LIST:
  id                    uuid PK
  academy_id            uuid NOT NULL → academies(id) ON DELETE CASCADE
  user_id               uuid → auth.users(id) ON DELETE SET NULL  ← NULLABLE
  role                  text NOT NULL DEFAULT 'student'
  display_name          text NOT NULL
  email                 text  ← NULLABLE
  avatar_url            text
  phone                 text
  belt_rank             text NOT NULL DEFAULT 'white'
  stripes               int NOT NULL DEFAULT 0
  weight_class          text
  date_of_birth         date
  emergency_contact     text
  emergency_phone       text
  student_metadata      jsonb NOT NULL DEFAULT '{}'
  instructor_metadata   jsonb NOT NULL DEFAULT '{}'
  has_portal_access     boolean NOT NULL DEFAULT false  ← NEW
  status                text NOT NULL DEFAULT 'active'
  joined_at             timestamptz NOT NULL DEFAULT now()
  last_active_at        timestamptz
  created_by            uuid → members(id) ON DELETE SET NULL  ← NEW
  created_at            timestamptz NOT NULL DEFAULT now()
  updated_at            timestamptz NOT NULL DEFAULT now()

RLS POLICIES (REVISED — two policies instead of one):
  Policy 1: "tenant_isolation"
    FOR ALL
    USING (academy_id = get_current_academy_id())
    WITH CHECK (academy_id = get_current_academy_id())

  Policy 2: "own_memberships"
    FOR SELECT
    USING (user_id = auth.uid())
    → Allows academy switcher to query all memberships
```

### 3.2 academies (REVISED)

```
CHANGES FROM CURRENT:
  1. ADD: owner_id uuid NOT NULL → auth.users(id)
  2. EXTRACT from settings jsonb into explicit boolean columns:
     - allow_student_self_checkin
     - require_checkin_geolocation
     - instructor_can_add_students
     - student_directory_visible
  3. ENABLE RLS with specific policies
  4. settings jsonb: keep for non-permission display preferences only

NEW COLUMNS:
  owner_id                       uuid NOT NULL → auth.users(id)
  allow_student_self_checkin     boolean NOT NULL DEFAULT true
  require_checkin_geolocation    boolean NOT NULL DEFAULT false
  instructor_can_add_students    boolean NOT NULL DEFAULT false
  student_directory_visible      boolean NOT NULL DEFAULT false

RLS POLICIES:
  Policy 1: "select_own_academies"
    FOR SELECT USING (
      id IN (SELECT academy_id FROM members WHERE user_id = auth.uid())
    )

  INSERT/UPDATE/DELETE: no user-facing policy (service role only)

ADDITIONAL: Create a public-safe VIEW for slug resolution:
  CREATE VIEW academy_public AS
    SELECT id, slug, name, logo_url, status FROM academies;
  → Accessible by authenticated role for login routing
  → Does NOT expose email, phone, address, Stripe IDs
```

### 3.3 subscriptions + payments (REVISED RLS)

```
CHANGE: Replace tenant-only RLS with admin-only RLS.

Policy for both tables:
  FOR ALL USING (
    academy_id = get_current_academy_id()
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.academy_id = get_current_academy_id()
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  )
  WITH CHECK (same condition)

Note: INSERT/UPDATE on these tables is service-role only (Stripe webhooks).
The RLS policy primarily governs SELECT for the billing dashboard.
```

### 3.4 invites (REVISED)

```
CHANGES FROM CURRENT:
  1. ADD: invite_type text NOT NULL DEFAULT 'invite'
  2. ADD: target_member_id uuid → members(id) ON DELETE CASCADE
  3. ADD: revoked_at timestamptz
  4. ADD: revoked_by uuid → members(id)
  5. ADD: CHECK constraint linking invite_type to target_member_id

REVISED COLUMN LIST:
  id                    uuid PK
  academy_id            uuid NOT NULL → academies(id) ON DELETE CASCADE
  invite_type           text NOT NULL DEFAULT 'invite'  ← NEW
  email                 text NOT NULL
  role                  text NOT NULL DEFAULT 'student'
  token                 text UNIQUE NOT NULL
  target_member_id      uuid → members(id) ON DELETE CASCADE  ← NEW
  invited_by            uuid NOT NULL → members(id)
  accepted_at           timestamptz
  revoked_at            timestamptz  ← NEW
  revoked_by            uuid → members(id)  ← NEW
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days')
  created_at            timestamptz NOT NULL DEFAULT now()
```

### 3.5 audit_log (REVISED)

```
CHANGES FROM CURRENT:
  1. actor_id: NOT NULL → NULLABLE
  2. actor_id FK: ON DELETE (implied RESTRICT) → ON DELETE SET NULL
  3. ADD: actor_type text NOT NULL DEFAULT 'member'

REVISED RELEVANT COLUMNS:
  actor_type            text NOT NULL DEFAULT 'member'
                        CHECK (actor_type IN ('member', 'system', 'webhook', 'cron'))
  actor_id              uuid → members(id) ON DELETE SET NULL  ← NOW NULLABLE
```

### 3.6 class_sessions (REVISED)

```
CHANGES FROM CURRENT:
  1. ADD: cancelled_by uuid → members(id) ON DELETE SET NULL
  2. ADD: cancel_reason text
```

### 3.7 ownership_transfers (NEW TABLE)

```
NEW TABLE supporting ACCESS_MODEL Section 9.2:
  id                    uuid PK
  academy_id            uuid NOT NULL → academies(id) ON DELETE CASCADE
  from_user_id          uuid NOT NULL → auth.users(id)
  to_user_id            uuid NOT NULL → auth.users(id)
  status                text NOT NULL DEFAULT 'pending'
  initiated_at          timestamptz NOT NULL DEFAULT now()
  confirmed_at          timestamptz
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
  confirmation_token    text UNIQUE NOT NULL

RLS: Standard tenant isolation (academy_id = get_current_academy_id())
     Plus admin-only at application layer.
```

### 3.8 get_current_academy_id() (REVISED)

```
CHANGE: Remove COALESCE fallback to zero UUID.

BEFORE:
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );

AFTER:
  SELECT (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid;

WHY: Returning NULL when no academy context exists causes RLS
comparisons (academy_id = NULL) to return false for all rows.
This is the safest default — zero access, not zero-UUID access.
```

---

## 4. Recommended Final Schema Rules Before SQL

These rules MUST be followed during SQL generation:

```
RULE 1: EVERY TENANT TABLE
  - Has academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE
  - Has RLS ENABLED
  - Has at minimum a tenant isolation policy
  - Has an index on academy_id (composite preferred)

RULE 2: NULLABLE user_id ON members
  - members.user_id is NULLABLE
  - Uniqueness enforced via partial indexes, not table constraint
  - has_portal_access CHECK constraint tied to user_id

RULE 3: RLS POLICY TIERS
  Tier 1 (standard): academy_id = get_current_academy_id()
    → ALL tables except academies, subscriptions, payments

  Tier 2 (admin-only): Tier 1 + role = 'admin' check
    → subscriptions, payments

  Tier 3 (self-access): user_id = auth.uid()
    → members (additional SELECT policy for academy switcher)

  Tier 4 (view-based): no RLS, use VIEW instead
    → academies (academy_public VIEW for slug lookup)

RULE 4: ON DELETE STRATEGY
  - academy_id FKs: ON DELETE CASCADE (tenant deletion cascades all data)
  - members.user_id: ON DELETE SET NULL (preserve profile if auth deleted)
  - "actor" FKs (created_by, cancelled_by, etc.): ON DELETE SET NULL
  - "owner" FKs (student_plans.member_id): ON DELETE CASCADE
  - invites.target_member_id: ON DELETE CASCADE (no point if member gone)

RULE 5: NO ZERO-UUID FALLBACK
  get_current_academy_id() returns NULL, not '000...000', when no
  academy context exists.

RULE 6: PERMISSION BOOLEANS ON academies, NOT IN jsonb
  Feature-gating booleans that affect authorization logic MUST be
  explicit columns with NOT NULL + DEFAULT. jsonb is for display prefs.

RULE 7: AUDIT TRAIL REQUIREMENTS
  These operations MUST create audit_log entries:
    - Member role change
    - Member status change
    - Belt promotion
    - Academy settings change
    - Ownership transfer initiation/completion
    - Invite creation/revocation
    - Subscription plan change
    - Member removal

RULE 8: INDEX NAMING CONVENTION
  idx_{table}_{columns}              — standard index
  idx_{table}_{columns}_unique       — unique index
  idx_{table}_{columns}_{filter}     — partial index with descriptive suffix

RULE 9: CHECK CONSTRAINTS VS APPLICATION VALIDATION
  Use CHECK constraints for:
    - Enum-like values that are STABLE (status, role, plan)
    - Numeric ranges (stripes 0-4, rating 1-5)
    - Cross-column invariants (has_portal_access requires user_id)

  Use application validation for:
    - Enum-like values that EVOLVE (technique positions, categories)
    - Cross-table validations (instructor must have instructor role)
    - Business rules that differ per academy (settings-dependent)

RULE 10: SERVICE ROLE USAGE
  Tables written ONLY by service role (never by user-facing queries):
    - academies (INSERT/UPDATE)
    - subscriptions (INSERT/UPDATE via Stripe webhook)
    - payments (INSERT via Stripe webhook)
    - ownership_transfers (INSERT by server action, UPDATE by confirmation)
```

---

## 5. New Constraints and Indexes Needed

### New Indexes

```
MEMBERS:
  DROP:  UNIQUE(academy_id, user_id)  — table-level constraint
  ADD:   CREATE UNIQUE INDEX idx_members_academy_user_unique
           ON members(academy_id, user_id) WHERE user_id IS NOT NULL;
  ADD:   CREATE UNIQUE INDEX idx_members_academy_email_managed
           ON members(academy_id, email)
           WHERE user_id IS NULL AND email IS NOT NULL;
  ADD:   CREATE INDEX idx_members_portal
           ON members(academy_id, has_portal_access)
           WHERE has_portal_access = true;

ACADEMIES:
  ADD:   CREATE INDEX idx_academies_owner ON academies(owner_id);

INVITES:
  ADD:   CREATE INDEX idx_invites_active
           ON invites(academy_id, email)
           WHERE accepted_at IS NULL AND revoked_at IS NULL;
  ADD:   CREATE INDEX idx_invites_target_member
           ON invites(target_member_id)
           WHERE target_member_id IS NOT NULL;

OWNERSHIP_TRANSFERS:
  ADD:   CREATE INDEX idx_transfers_academy
           ON ownership_transfers(academy_id);
  ADD:   CREATE INDEX idx_transfers_pending
           ON ownership_transfers(academy_id, status)
           WHERE status = 'pending';
  ADD:   CREATE UNIQUE INDEX idx_transfers_token
           ON ownership_transfers(confirmation_token);
```

### New CHECK Constraints

```
MEMBERS:
  ADD:   CHECK (has_portal_access = false OR user_id IS NOT NULL)
         — Cannot have portal access without an auth account

  ADD:   CHECK (
           (role = 'admin' AND user_id IS NOT NULL)
           OR role IN ('instructor', 'student')
         )
         — Admin role REQUIRES an auth account (no managed-profile admin)

INVITES:
  ADD:   CHECK (
           (invite_type = 'invite' AND target_member_id IS NULL)
           OR
           (invite_type = 'activation' AND target_member_id IS NOT NULL)
         )
         — Activation invites must reference the target managed profile

ACADEMIES:
  ADD:   CHECK (
           (status IN ('trialing', 'active', 'past_due') AND stripe_customer_id IS NOT NULL)
           OR status IN ('suspended', 'cancelled', 'deleted')
         )
         — Active academies MUST have Stripe integration
         — (Enforces "no academy without payment" from ACCESS_MODEL Section 2.2)

OWNERSHIP_TRANSFERS:
  ADD:   CHECK (from_user_id != to_user_id)
         — Cannot transfer to yourself
```

### New Triggers

```
MEMBERS (belt promotion auto-history):
  BEFORE UPDATE ON members
  WHEN (OLD.belt_rank != NEW.belt_rank OR OLD.stripes != NEW.stripes)
  → INSERT into member_belt_history with old values
  → This ensures belt history is NEVER missed, even if the app
    forgets to explicitly create the history record

ACADEMIES (owner must be admin):
  After updating owner_id, a deferred trigger should validate that
  the new owner has an admin member record. However, this is tricky
  with circular references. DECISION: Enforce at application level,
  not trigger. Document this clearly.
```

---

## Summary: Changes by Table

| Table | Change Type | Changes |
|---|---|---|
| **members** | CRITICAL REVISION | user_id nullable, ON DELETE SET NULL, has_portal_access, created_by, partial unique indexes, new CHECK constraints, additional RLS policy |
| **academies** | CRITICAL REVISION | owner_id column, permission booleans extracted from jsonb, RLS enabled with policies, academy_public VIEW |
| **subscriptions** | HIGH REVISION | Admin-only RLS policy |
| **payments** | HIGH REVISION | Admin-only RLS policy |
| **invites** | HIGH REVISION | invite_type, target_member_id, revoked_at, revoked_by, new CHECK |
| **audit_log** | HIGH REVISION | actor_id nullable, actor_type column, ON DELETE SET NULL |
| **class_sessions** | MEDIUM REVISION | cancelled_by, cancel_reason columns |
| **ownership_transfers** | NEW TABLE | Full table for ownership transfer flow |
| **academy_public** | NEW VIEW | Safe public subset of academies for slug routing |
| **get_current_academy_id()** | REVISED FUNCTION | Remove COALESCE zero-UUID fallback |
| **techniques** | LOW REVISION | Remove CHECK constraints on position/category |
| **notifications** | LOW NOTE | Application must validate channel vs has_portal_access |
| **All other tables** | NO CHANGE | Already aligned with ACCESS_MODEL |
