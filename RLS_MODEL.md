# BJJFlow - Final Row-Level Security Model

> Sources of truth: ARCHITECTURE.md, DATABASE_SCHEMA.md, ACCESS_MODEL.md, SCHEMA_REVISION.md
> This is the definitive RLS policy specification. No SQL yet — design only.
> Every policy defined here will be translated 1:1 into SQL in the next step.

---

## Foundational Principles

```
PRINCIPLE 1: RLS IS THE LAST LINE OF DEFENSE
  Application code (tRPC, middleware, server actions) enforces role checks.
  RLS enforces tenant isolation. If the app has a bug, RLS still prevents
  cross-tenant data access. RLS is NOT a substitute for app-level auth,
  and app-level auth is NOT a substitute for RLS.

PRINCIPLE 2: DENY BY DEFAULT
  RLS is ENABLED on every table. With no matching policy, access is denied.
  Policies grant access — they do not restrict it.
  The absence of a policy = no access.

PRINCIPLE 3: JWT IS THE SOLE IDENTITY SOURCE
  get_current_academy_id() reads from JWT app_metadata.
  auth.uid() reads from JWT sub claim.
  No other source of identity is trusted.
  No request body, header, cookie, or URL parameter is trusted.

PRINCIPLE 4: SERVICE ROLE BYPASSES ALL RLS
  Used ONLY in server-side code for operations that cannot have user context
  (webhooks, cron, bootstrapping). The service role key NEVER reaches
  the client. Every use of supabaseAdmin is a security-critical code path.

PRINCIPLE 5: POLICIES MUST BE SIMPLE AND AUDITABLE
  Prefer multiple narrow policies over one complex policy.
  PostgreSQL ORs multiple USING clauses on the same operation.
  A policy should express ONE access rule, named descriptively.
```

---

## Helper Function Strategy

### Primary Function: get_current_academy_id()

```
PURPOSE: Extract the active academy UUID from the JWT.

SIGNATURE:
  get_current_academy_id() RETURNS uuid

BEHAVIOR:
  Returns (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid

  If JWT has no academy_id → returns NULL
  If NULL → any comparison (academy_id = NULL) → false → zero rows
  NO COALESCE. NO fallback UUID.

SECURITY: SECURITY DEFINER + STABLE
  SECURITY DEFINER: executes with the function owner's privileges,
    allowing it to read auth.jwt() regardless of the caller's role.
  STABLE: tells the planner the function returns the same result
    within a single statement, enabling index usage.

USED BY: Every Tier 1/2/3 policy in the system.
```

### Secondary Function: is_academy_admin()

```
PURPOSE: Check if the current user is an admin of the active academy.
         Used by Tier 2 (admin-only) policies on billing tables.

SIGNATURE:
  is_academy_admin() RETURNS boolean

BEHAVIOR:
  Returns EXISTS (
    SELECT 1 FROM members
    WHERE academy_id = get_current_academy_id()
    AND user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  )

SECURITY: SECURITY DEFINER + STABLE
  SECURITY DEFINER is required because this function queries the members
  table, which itself has RLS. Without SECURITY DEFINER, a recursive
  RLS check would occur (infinite loop or permission denied).

PERFORMANCE: This function is called once per query on billing tables.
  The members table has an index on (academy_id, user_id), so the
  EXISTS subquery is an index-only scan. Cost: negligible.

USED BY: Tier 2 policies on subscriptions, payments.
```

### No Other Helper Functions

```
DECISION: Two helper functions only. No is_instructor(), no
get_member_role(), no other helpers.

RATIONALE:
  - Role checks beyond admin are enforced at the application layer
  - Adding more RLS helper functions increases the attack surface
  - Each SECURITY DEFINER function is a privilege escalation boundary
  - Two functions are easy to audit; ten are not
```

---

## Policy Tier System

```
TIER 1: STANDARD TENANT ISOLATION
  USING:       academy_id = get_current_academy_id()
  WITH CHECK:  academy_id = get_current_academy_id()
  APPLIES TO:  Most tables (14 tables)
  MEANING:     Any authenticated member of the active academy can
               SELECT/INSERT/UPDATE/DELETE rows in that academy.
               Write restrictions (role, ownership) at application layer.

TIER 2: ADMIN-ONLY TENANT ISOLATION
  USING:       academy_id = get_current_academy_id() AND is_academy_admin()
  WITH CHECK:  academy_id = get_current_academy_id() AND is_academy_admin()
  APPLIES TO:  subscriptions, payments
  MEANING:     Only admin members of the active academy can see these rows.
               Writes are service-role only (Stripe webhooks).

TIER 3: SELF-ACCESS (supplementary)
  USING:       user_id = auth.uid()
  APPLIES TO:  members (additional SELECT-only policy)
  MEANING:     A user can always read their OWN member records across
               all academies, regardless of which academy is active.
               Used by the academy switcher.

TIER 4: MEMBERSHIP-GATED SELECT
  USING:       id IN (SELECT academy_id FROM members WHERE user_id = auth.uid())
  APPLIES TO:  academies
  MEANING:     A user can read full details of academies they belong to.
               No INSERT/UPDATE/DELETE via user-facing queries.

TIER 5: SERVICE-ROLE ONLY
  No user-facing policies. RLS is enabled but no policies exist.
  Only the service role (which bypasses RLS) can access.
  APPLIES TO:  No tables currently. All tables have at least SELECT.
  NOTE:        Writes to academies, subscriptions, payments happen
               via service role, but reads are allowed per Tier 2/4.
```

---

## Domain 1: Tenant Core

### 1.1 academies

```
SCOPE: Global table with membership-gated access
RLS:   ENABLED

POLICY: "select_own_academies"
  FOR:        SELECT
  USING:      id IN (
                SELECT academy_id FROM members
                WHERE user_id = auth.uid()
                AND has_portal_access = true
              )
  MEANING:    User can read full academy details ONLY for academies
              where they have an active portal-enabled membership.
  NOTE:       has_portal_access filter prevents managed profiles
              (who may have a user_id set during activation but
              hasn't completed portal setup) from leaking academy data.

POLICY: (none for INSERT, UPDATE, DELETE)
  All writes via service role only.
  - INSERT: Stripe webhook handler (academy bootstrap)
  - UPDATE: Stripe webhook (status), admin server action (settings)
  - DELETE: Never from app. Soft delete via status = 'deleted'.

SOFT vs HARD DELETE:
  SOFT. Set status = 'deleted'. Never hard-delete via application.
  Hard delete only via manual database admin operation (LGPD/GDPR
  final purge after data export, executed by BJJFlow ops team).

VIEW: academy_public
  SELECT id, slug, name, logo_url, status FROM academies
  No RLS on the view (SECURITY INVOKER, default).
  GRANT SELECT on academy_public TO authenticated.
  PURPOSE: Slug lookup during login routing. Middleware (server-side)
  uses this view to resolve slug → academy_id. Exposes only
  non-sensitive fields.

EDGE CASES:
  - User with 0 memberships: SELECT returns 0 rows. Correct.
  - User with membership in suspended academy: SELECT returns the row.
    Academy status check is middleware concern, not RLS.
  - Owner lookup: owner_id is visible in the row. Acceptable because
    only members of that academy can see the row.

IMPORTANT NOTES:
  - The subquery SELECT academy_id FROM members WHERE user_id = auth.uid()
    hits the members table which has its own RLS. This would cause
    infinite recursion — EXCEPT: the members "own_memberships" policy
    uses user_id = auth.uid() (no academy_id dependency), so it resolves
    without needing get_current_academy_id(). No recursion.
  - If this subquery is a performance concern at scale, cache the
    academy list in app_metadata as an array. For MVP, the subquery
    is fine (index on members.user_id exists).
```

### 1.2 members

```
SCOPE: Academy-scoped with self-access supplement
RLS:   ENABLED

POLICY 1: "tenant_isolation"
  FOR:        ALL (SELECT, INSERT, UPDATE, DELETE)
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()
  MEANING:    Within the active academy, all members are visible to
              all other members of that academy.
  NOTE:       This is intentionally broad. Role-based restrictions
              on who can UPDATE/DELETE are enforced at app layer.
              RLS job = tenant boundary. App job = role boundary.

POLICY 2: "own_memberships"
  FOR:        SELECT only
  USING:      user_id = auth.uid() AND has_portal_access = true
  MEANING:    User can always read their OWN member records across
              ALL academies, regardless of active academy context.
  PURPOSE:    Powers the academy switcher UI.
  NOTE:       has_portal_access = true ensures managed profiles
              (user_id set but portal not yet enabled) don't appear
              in the switcher. Only fully activated memberships show.

WHO CAN SELECT:
  - Any member of the same academy (via Policy 1)
  - The user themselves across academies (via Policy 2)

WHO CAN INSERT:
  - Service role: academy bootstrap (first admin member)
  - Service role: invite acceptance handler
  - Admin via app layer: managed profile creation
  - tRPC/server action validates role before INSERT.
    RLS allows the INSERT if academy_id matches (Policy 1).

WHO CAN UPDATE:
  - Admin: any member's role, status, belt_rank (app-enforced)
  - Instructor: limited fields on students they manage (app-enforced)
  - Student: own profile fields only (app-enforced)
  - RLS allows the UPDATE if academy_id matches. Field-level
    restrictions are application-only (PostgreSQL doesn't have
    column-level RLS).

WHO CAN DELETE:
  SOFT DELETE preferred. Set status = 'inactive' or 'suspended'.
  Hard DELETE only for: LGPD/GDPR data removal requests.
  Performed via admin server action → service role.

EDGE CASES:
  - Managed profile (user_id = NULL):
    → Never matched by Policy 2 (auth.uid() != NULL for logged-in users)
    → Only visible via Policy 1 (same-academy members)
    → Cannot log in, so never triggers RLS on their own behalf
  - Deactivated membership (status = 'inactive'):
    → Still visible to academy members (for historical records)
    → Middleware prevents the deactivated user from accessing dashboard
  - User removed from academy (member hard-deleted):
    → Policy 1 no longer matches for that academy
    → Policy 2 no longer returns that academy
    → User loses access immediately

IMPORTANT NOTES:
  - Policy 2 does NOT allow writes across academies. SELECT only.
  - PostgreSQL ORs the USING clauses of Policy 1 and Policy 2
    for SELECT operations. A row is visible if EITHER matches.
  - For INSERT/UPDATE/DELETE, only Policy 1's WITH CHECK applies
    (Policy 2 has no WITH CHECK since it's SELECT-only).
```

### 1.3 member_belt_history

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Any member of the academy.
  Students see their own history and others' (belt ranks are public
  in BJJ culture — everyone wears their belt visibly).

WHO CAN INSERT:
  - Trigger on members table (auto-insert on belt/stripe change)
  - Admin/instructor via app layer (manual history entry)
  App validates role before allowing manual inserts.

WHO CAN UPDATE: Admin only (corrections). App-enforced.
WHO CAN DELETE: Never. Belt history is immutable audit data.
  SOFT DELETE: N/A. Rows are never deleted.

EDGE CASES:
  - Managed profile gets promoted: promoted_by references the
    instructor's member_id. The managed student's member_id is
    the target. Both are in the same academy. Works correctly.
```

### 1.4 invites

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Any member of the academy.
  App layer restricts the invite management UI to admins, but
  RLS doesn't need to enforce this. Invite data (email, role,
  status) is not sensitive within the tenant.

WHO CAN INSERT: Admin only (app-enforced).
  RLS allows insert if academy_id matches.
  App validates: caller is admin, rate limit not exceeded.

WHO CAN UPDATE:
  - accepted_at: set by service role during invite acceptance
    (user may not have academy context yet)
  - revoked_at/revoked_by: admin only (app-enforced)
  Note: Most invite updates happen via service role because the
  accepting user doesn't have an academy_id in their JWT yet.

WHO CAN DELETE: Never. Use soft revocation (revoked_at).
  SOFT DELETE: Yes, via revoked_at timestamp.

EDGE CASES:
  - Invite acceptance by a user who has no academy_id in JWT:
    The service role handles this. The user has no RLS context.
    Correct: service role bypasses RLS.
  - Invite for an email that already exists as a member:
    App-level validation. RLS doesn't prevent duplicate invites
    (uniqueness is on token, not on email).

IMPORTANT NOTES:
  - Token lookup during invite acceptance MUST use service role
    because the accepting user has no academy context.
  - The invite page reads the token, validates it, and creates
    the membership — all via service role.
```

---

## Domain 2: Scheduling

### 2.1 classes

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Any member (schedule is visible to all).
WHO CAN INSERT: Admin, instructor (app-enforced).
WHO CAN UPDATE: Admin, instructor (app-enforced, with ownership rules).
WHO CAN DELETE: SOFT. Set is_active = false. Admin only (app-enforced).

EDGE CASES:
  - Instructor assigned to a class is removed from academy:
    default_instructor_id set to NULL (ON DELETE SET NULL).
    Class remains visible, just unassigned.
```

### 2.2 class_sessions

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Any member.
WHO CAN INSERT: Admin, instructor, or system/cron (auto-generation).
WHO CAN UPDATE: Admin, instructor assigned to session (app-enforced).
WHO CAN DELETE: Never. Cancel via status = 'cancelled'.
  SOFT DELETE: Yes, via status + cancelled_by + cancel_reason.

EDGE CASES:
  - Session auto-generated for a class whose instructor was removed:
    instructor_id = NULL. Admin must reassign.
```

### 2.3 session_techniques

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Any member.
WHO CAN INSERT: Admin, instructor (app-enforced).
WHO CAN UPDATE: Admin, instructor who added it (app-enforced).
WHO CAN DELETE: Admin, instructor who added it (app-enforced). Hard delete OK.
```

---

## Domain 3: Attendance

### 3.1 attendance

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT:
  - Admin, instructor: all attendance records
  - Student: own attendance (app-enforced filter, not RLS)
  RLS allows all members to see all attendance. The app shows
  students only their own. This is an intentional design choice:
  attendance data within an academy is not sensitive (everyone
  in a BJJ class sees who showed up).

WHO CAN INSERT:
  - Student: self check-in (app validates academy setting
    allow_student_self_checkin)
  - Admin, instructor: mark others' attendance
  - For managed profiles: instructor marks on their behalf

WHO CAN UPDATE:
  - Admin only (corrections). App-enforced.
  - Never by students.

WHO CAN DELETE:
  - Admin only (mistake correction). Hard delete OK.
  - Creates audit_log entry.

EDGE CASES:
  - Managed profile check-in: instructor creates attendance record
    with member_id of the managed profile. check_in_method = 'manual'.
    checked_in_by = instructor's member_id. Works correctly.
  - Student self check-in when setting is disabled:
    App checks academy.allow_student_self_checkin before allowing.
    RLS does NOT check this (keeping policies simple).
```

### 3.2 check_ins (facility access)

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT:
  - Admin, instructor: all check-ins
  - Student: own check-ins (app-filtered)

WHO CAN INSERT:
  - Any active member (self check-in)
  - Instructor/admin for managed profiles

WHO CAN UPDATE: Admin only (corrections).
WHO CAN DELETE: Never. Immutable access log.
  SOFT DELETE: N/A. Rows preserved permanently.
```

---

## Domain 4: Curriculum

### 4.1 techniques

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT:
  - Admin, instructor: all techniques (published and unpublished)
  - Student: published only (app-enforced filter on is_published)
  RLS allows all members to see all techniques. The is_published
  filter is app-level (not RLS) because there may be edge cases
  where a student needs to see an unpublished technique (e.g.,
  shared link from instructor).

WHO CAN INSERT: Admin, instructor (app-enforced).
WHO CAN UPDATE: Admin, instructor who created it (app-enforced via created_by).
WHO CAN DELETE: Admin only (app-enforced). SOFT via is_published = false.
  Hard delete reserved for admin explicit action.
```

### 4.2 technique_media

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Same as parent technique.
WHO CAN INSERT: Admin, instructor (app-enforced).
WHO CAN UPDATE: Admin, instructor (app-enforced).
WHO CAN DELETE: Admin, instructor (app-enforced). Hard delete OK
  (deletes the DB row; Supabase Storage file cleaned up by app).
```

---

## Domain 5: Billing

### 5.1 subscriptions

```
SCOPE: Academy-scoped, ADMIN-ONLY
RLS:   ENABLED

POLICY: "admin_only_tenant_isolation"
  FOR:        SELECT
  USING:      academy_id = get_current_academy_id()
              AND is_academy_admin()
  MEANING:    Only admin members of the active academy can read
              subscription data. Instructors and students see nothing.

POLICY: (none for INSERT, UPDATE, DELETE)
  All writes via service role only (Stripe webhooks).

WHO CAN SELECT: Admin only (RLS-enforced via is_academy_admin()).
WHO CAN INSERT: Service role only (Stripe webhook: checkout.session.completed).
WHO CAN UPDATE: Service role only (Stripe webhook: customer.subscription.updated).
WHO CAN DELETE: Never. Subscription records are permanent.
  SOFT DELETE: N/A. Status field tracks lifecycle.

EDGE CASES:
  - Instructor tries to read subscription: RLS returns 0 rows. Correct.
  - Admin of one academy tries to read another academy's subscription:
    get_current_academy_id() returns their active academy. Correct.

IMPORTANT NOTES:
  - The is_academy_admin() function is SECURITY DEFINER.
    It queries members internally. Without SECURITY DEFINER, the
    members table's RLS would apply, but that's fine because
    is_academy_admin() uses auth.uid() which matches the
    members "tenant_isolation" policy. No recursion risk here
    because the members policy doesn't call is_academy_admin().
  - No WITH CHECK needed because there are no user-facing writes.
```

### 5.2 payments

```
SCOPE: Academy-scoped, ADMIN-ONLY
RLS:   ENABLED

POLICY: "admin_only_tenant_isolation"
  FOR:        SELECT
  USING:      academy_id = get_current_academy_id()
              AND is_academy_admin()

POLICY: (none for INSERT, UPDATE, DELETE)
  All writes via service role only.

Identical pattern to subscriptions. Same rationale, same edge cases.

WHO CAN SELECT: Admin only (RLS-enforced).
WHO CAN INSERT: Service role only (Stripe webhook: invoice.paid/failed).
WHO CAN UPDATE: Service role only (status changes from Stripe).
WHO CAN DELETE: Never.
```

### 5.3 student_plans

```
SCOPE: Academy-scoped (STANDARD — not admin-only)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHY NOT ADMIN-ONLY:
  Instructors may need to check a student's plan status before
  allowing check-in (e.g., "is their plan active?"). Making this
  admin-only at the RLS level would block that future use case.
  Write restrictions (admin-only) enforced at app layer.

WHO CAN SELECT:
  - Admin: all student plans
  - Instructor: all plans (for check-in validation)
  - Student: own plan only (app-filtered, not RLS)
  RLS allows all members to see all plans within the academy.

WHO CAN INSERT: Admin only (app-enforced).
WHO CAN UPDATE: Admin only (app-enforced).
WHO CAN DELETE: SOFT. Set status = 'cancelled'. Admin only.
```

---

## Domain 6: Notifications

### 6.1 notifications

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

DESIGN DECISION — WHY NOT MEMBER-SCOPED RLS:
  We COULD add a policy: member_id = get_current_member_id()
  to ensure users only see their own notifications. We choose
  NOT to because:
    - Admin needs to see all notifications (for debugging/support)
    - A get_current_member_id() function would add complexity
    - App-layer filtering is sufficient for notification feeds
    - Notifications are not cross-tenant sensitive data

WHO CAN SELECT:
  - Admin: all notifications in academy (for support)
  - Instructor: own only (app-filtered)
  - Student: own only (app-filtered)
  RLS allows all within academy. App filters by member_id.

WHO CAN INSERT:
  - System/automation (cron, triggers, server actions)
  - Admin (academy announcements)
  Most inserts happen via service role (automation engine).

WHO CAN UPDATE:
  - The target member: mark as read (read_at) — app-enforced
  - System: mark as delivered (delivered_at)

WHO CAN DELETE: Never. Notifications are permanent records.
  Old notifications expire via expires_at (app ignores expired ones).

EDGE CASES:
  - Managed profile notifications:
    channel must NOT be 'in_app' (they can't log in).
    Enforced at application layer during notification creation.
    RLS doesn't care about channel.
```

---

## Domain 7: Automations

### 7.1 automations

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Admin only (app-enforced).
  RLS allows all members (tenant isolation only).
  App restricts automation visibility to admin.

WHO CAN INSERT: Admin only (app-enforced).
WHO CAN UPDATE: Admin only (app-enforced).
WHO CAN DELETE: SOFT. Set is_active = false. Admin only.

WHY NOT ADMIN-ONLY RLS (like billing):
  Automations may eventually be visible to instructors (e.g., "see
  which automations affect your classes"). Keeping tenant-only RLS
  avoids a migration when that feature ships. Admin-only at app layer
  is sufficient for now.
```

### 7.2 automation_runs

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Admin only (app-enforced).
WHO CAN INSERT: Service role (automation engine).
WHO CAN UPDATE: Service role (mark completed/failed).
WHO CAN DELETE: Never.
```

### 7.3 automation_logs

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Admin only (app-enforced).
WHO CAN INSERT: Service role (automation engine).
WHO CAN UPDATE: Never.
WHO CAN DELETE: Never.
```

---

## Domain 8: AI Insights

### 8.1 ai_insights

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT:
  - Admin: all insights (academy-level, member-level, class-level)
  - Instructor: class-level insights only (app-filtered by target_type)
  - Student: none (app-enforced)
  RLS allows all members. App filters by role + target_type.

WHO CAN INSERT: Service role (AI pipeline).
WHO CAN UPDATE:
  - Admin/instructor: dismiss, action (app-enforced)
  - Fields: status, dismissed_by, dismissed_at
WHO CAN DELETE: Never. Insights expire (expires_at) or are dismissed.
```

### 8.2 ai_insight_actions

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        ALL
  USING:      academy_id = get_current_academy_id()
  WITH CHECK: academy_id = get_current_academy_id()

WHO CAN SELECT: Admin, instructor (app-enforced).
WHO CAN INSERT: Admin, instructor (logging their actions on insights).
WHO CAN UPDATE: Never. Action records are immutable.
WHO CAN DELETE: Never.
```

---

## Domain 9: Audit / System

### 9.1 audit_log

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        SELECT only
  USING:      academy_id = get_current_academy_id()

NO INSERT/UPDATE/DELETE POLICY FOR USERS.
  All writes via service role only.
  User-facing queries are SELECT-only (admin reads audit trail).

WHY SELECT-ONLY POLICY:
  Audit logs must be tamper-proof. If a compromised admin account
  could DELETE or UPDATE audit entries, the trail becomes unreliable.
  By having no user-facing INSERT/UPDATE/DELETE policies, even a
  user with the anon key cannot modify audit data.
  Only the service role (server-side) can write audit entries.

WHO CAN SELECT: Admin only (app-enforced).
WHO CAN INSERT: Service role only.
WHO CAN UPDATE: Never. Audit entries are immutable.
WHO CAN DELETE: Never. Not even service role should delete these.
  Retention policy: keep forever (or archive to cold storage after 2 years).

EDGE CASES:
  - System-generated audit entries (actor_type = 'webhook'):
    actor_id = NULL. Still scoped to academy_id.
  - Audit entry for an actor who was later removed:
    actor_id = NULL (ON DELETE SET NULL). Entry preserved.
```

---

## Domain 10: Ownership Transfer Flow

### 10.1 ownership_transfers

```
SCOPE: Academy-scoped (standard)
RLS:   ENABLED

POLICY: "tenant_isolation"
  FOR:        SELECT only
  USING:      academy_id = get_current_academy_id()

NO INSERT/UPDATE/DELETE POLICY FOR USERS.
  All writes via service role only.

RATIONALE:
  Ownership transfers are security-critical operations:
    - Initiated by admin via server action → service role INSERT
    - Confirmed by new owner via confirmation link → service role UPDATE
    - Expired by cron job → service role UPDATE
  No user-facing write access prevents tampering with transfer state.

WHO CAN SELECT:
  - Admin of the academy: see pending/completed transfers
  - App-enforced admin-only visibility

WHO CAN INSERT: Service role (admin server action).
WHO CAN UPDATE: Service role (confirmation handler, expiry cron).
WHO CAN DELETE: Never.

EDGE CASES:
  - Multiple pending transfers: app prevents this (only 1 pending
    transfer per academy at a time, enforced at app layer).
  - Transfer to user not yet a member: to_user_id references
    auth.users, not members. The user becomes admin AFTER confirming.
    The confirmation handler creates/upgrades the member record.
```

---

## Domain 11: Public Lookup / Safe Access Surfaces

### 11.1 academy_public (VIEW)

```
TYPE: VIEW (not a table)
RLS:  N/A (views don't have RLS; they inherit from base table)

DEFINITION:
  CREATE VIEW academy_public AS
    SELECT id, slug, name, logo_url, status
    FROM academies;

ACCESS:
  GRANT SELECT ON academy_public TO authenticated;

PURPOSE:
  Middleware slug resolution. When a user logs in and we need to
  resolve their slug to an academy_id, we query this view.
  Since the view is defined as SECURITY INVOKER (default),
  it runs with the caller's permissions.

SECURITY ANALYSIS:
  The base academies table has RLS enabled with a SELECT policy
  that checks membership. So academy_public inherits that restriction.

  PROBLEM: During login, the user may not have academy_id in their
  JWT yet, so the academies RLS policy won't match anything.

  SOLUTION: Slug resolution happens in middleware using the SERVICE
  ROLE client. The view is a convenience for shape, but the actual
  query bypasses RLS via service role.

  For the authenticated (non-service-role) path, the view returns
  only academies the user is a member of — which is correct for
  the academy switcher.

EXPOSED FIELDS:
  ✅ id, slug, name, logo_url, status
  ❌ email, phone, address, stripe_customer_id, stripe_subscription_id,
     owner_id, plan, max_members, settings, currency, country_code

IMPORTANT:
  This view NEVER exposes Stripe IDs, contact information, or
  financial data. Even if RLS is somehow bypassed, the view itself
  only selects safe columns.
```

### 11.2 Supabase Storage Buckets

```
Not a table, but a critical access surface.

BUCKET STRUCTURE:
  avatars/{academy_id}/{member_id}/avatar.jpg
  techniques/{academy_id}/{technique_id}/video.mp4
  academy/{academy_id}/logo.png

STORAGE RLS POLICIES:
  - Each bucket has policies scoped by the academy_id path segment
  - Storage policies use auth.uid() and JWT claims just like table RLS
  - INSERT: only authenticated users within the academy
  - SELECT: only members of the academy
  - DELETE: admin/instructor only

NOTE: Storage RLS is configured separately in Supabase dashboard
  or via supabase/config.toml. Not part of the migration SQL.
  But the PRINCIPLE is the same: tenant isolation via academy_id.
```

---

## Complete Policy Registry

Summary of every policy in the system:

```
TABLE                  │ POLICY NAME                    │ FOR     │ TIER │ NOTES
───────────────────────┼────────────────────────────────┼─────────┼──────┼─────────────────
academies              │ select_own_academies           │ SELECT  │  4   │ membership-gated
members                │ tenant_isolation               │ ALL     │  1   │ standard
members                │ own_memberships                │ SELECT  │  3   │ cross-academy self
member_belt_history    │ tenant_isolation               │ ALL     │  1   │ standard
invites                │ tenant_isolation               │ ALL     │  1   │ standard
classes                │ tenant_isolation               │ ALL     │  1   │ standard
class_sessions         │ tenant_isolation               │ ALL     │  1   │ standard
session_techniques     │ tenant_isolation               │ ALL     │  1   │ standard
attendance             │ tenant_isolation               │ ALL     │  1   │ standard
check_ins              │ tenant_isolation               │ ALL     │  1   │ standard
techniques             │ tenant_isolation               │ ALL     │  1   │ standard
technique_media        │ tenant_isolation               │ ALL     │  1   │ standard
subscriptions          │ admin_only_tenant_isolation    │ SELECT  │  2   │ admin-only read
payments               │ admin_only_tenant_isolation    │ SELECT  │  2   │ admin-only read
student_plans          │ tenant_isolation               │ ALL     │  1   │ standard
notifications          │ tenant_isolation               │ ALL     │  1   │ standard
automations            │ tenant_isolation               │ ALL     │  1   │ standard
automation_runs        │ tenant_isolation               │ ALL     │  1   │ standard
automation_logs        │ tenant_isolation               │ ALL     │  1   │ standard
ai_insights            │ tenant_isolation               │ ALL     │  1   │ standard
ai_insight_actions     │ tenant_isolation               │ ALL     │  1   │ standard
audit_log              │ tenant_isolation               │ SELECT  │  1   │ read-only
ownership_transfers    │ tenant_isolation               │ SELECT  │  1   │ read-only
───────────────────────┴────────────────────────────────┴─────────┴──────┴─────────────────
TOTAL: 23 policies across 21 tables + 1 view
  - 17 standard Tier 1 (FOR ALL)
  - 2 standard Tier 1 (SELECT-only: audit_log, ownership_transfers)
  - 2 Tier 2 admin-only (SELECT-only: subscriptions, payments)
  - 1 Tier 3 self-access (SELECT-only: members own_memberships)
  - 1 Tier 4 membership-gated (SELECT-only: academies)
```

---

## Tables That Remain Service-Role-Only for Writes

```
TABLE                   │ USER CAN READ │ USER CAN WRITE │ WHY SERVICE-ROLE WRITES
────────────────────────┼───────────────┼────────────────┼──────────────────────────
academies               │ Yes (Tier 4)  │ No             │ Created by Stripe webhook,
                        │               │                │ updated by webhook + admin
                        │               │                │ server actions
subscriptions           │ Admin (Tier 2)│ No             │ Synced from Stripe only
payments                │ Admin (Tier 2)│ No             │ Synced from Stripe only
audit_log               │ Admin (Tier 1)│ No             │ Tamper-proof trail
ownership_transfers     │ Admin (Tier 1)│ No             │ Security-critical flow

All other tables: Users CAN write (scoped by Tier 1 RLS).
Role-based write restrictions are app-layer concerns.
```

---

## Top 10 RLS Mistakes to Avoid

```
 1. COALESCE TO A FALLBACK UUID IN get_current_academy_id()
    ─────────────────────────────────────────────────────────
    A zero UUID fallback means "no academy context" maps to a real UUID.
    If any row accidentally has that UUID as academy_id, it's exposed.
    RETURN NULL. NULL comparisons are always false. Safe by default.

 2. FORGETTING RLS ON A NEW TABLE
    ─────────────────────────────
    Every new migration that creates a table MUST include:
      ALTER TABLE x ENABLE ROW LEVEL SECURITY;
      CREATE POLICY ... ON x ...;
    Add a CI check: any table in public schema without RLS enabled
    fails the build. No exceptions.

 3. USING FOR ALL WHEN YOU MEAN FOR SELECT
    ──────────────────────────────────────
    FOR ALL creates policies for SELECT, INSERT, UPDATE, and DELETE.
    For service-role-write tables (audit_log, subscriptions, etc.),
    use FOR SELECT only. A FOR ALL policy would allow user-facing
    writes if the USING/WITH CHECK passes.

 4. CIRCULAR RLS DEPENDENCIES
    ─────────────────────────
    If table A's policy queries table B, and table B's policy queries
    table A, PostgreSQL enters infinite recursion and throws an error.

    Our design avoids this:
      - academies policy queries members (OK: members policy uses
        auth.uid(), not get_current_academy_id())
      - is_academy_admin() queries members (OK: same reason)
      - No policy queries academies (slug lookup is service-role)

    RULE: Never write a policy that queries a table whose policy
    queries the original table.

 5. EXPOSING BILLING DATA TO NON-ADMINS
    ────────────────────────────────────
    Standard tenant isolation on subscriptions/payments means any
    member (including students) can read Stripe IDs and payment amounts.
    We use Tier 2 (admin-only) specifically for these tables.

 6. LETTING MANAGED PROFILES APPEAR IN ACADEMY SWITCHER
    ────────────────────────────────────────────────────
    The members "own_memberships" policy (Tier 3) MUST filter on
    has_portal_access = true. Without this, a managed profile that
    had user_id set during activation (but hasn't completed setup)
    could appear in the switcher, potentially granting premature
    access to the academy dashboard.

 7. MISSING WITH CHECK ON WRITE POLICIES
    ────────────────────────────────────
    A policy with USING but no WITH CHECK allows reads but blocks
    writes silently (INSERT/UPDATE fail with "new row violates RLS").
    For Tier 1 FOR ALL policies, always include WITH CHECK matching
    the USING clause. Otherwise, a user could read data but every
    write would fail with a confusing error.

 8. GRANTING SELECT ON BASE TABLE INSTEAD OF VIEW
    ──────────────────────────────────────────────
    If you grant SELECT on academies to the anon role (for public
    landing page), you bypass RLS for anonymous users. Never do this.
    Use the academy_public VIEW for safe public access. The VIEW
    selects only non-sensitive columns.

 9. ASSUMING RLS PREVENTS COLUMN-LEVEL ACCESS
    ─────────────────────────────────────────
    RLS is row-level, not column-level. If a policy allows a user
    to SELECT a row, they can see ALL columns. You cannot use RLS
    to hide member.emergency_contact from students but show it to
    admins. Column-level restrictions are app-layer concerns
    (select specific fields in tRPC resolvers).

10. NOT TESTING RLS WITH THE ANON/AUTHENTICATED ROLE
    ────────────────────────────────────────────────
    Test RLS by signing in as a real user (not service role) and
    querying tables. Many teams test with service role only,
    which bypasses RLS, then ship broken policies to production.

    TESTING STRATEGY:
      - Create two test academies
      - Create test users in each academy
      - Sign in as user A, query user B's academy data
      - Verify: 0 rows returned
      - Sign in as student, query subscriptions
      - Verify: 0 rows returned
      - Run these as automated integration tests (Playwright or Vitest)
```

---

## Final Notes Before SQL Generation

```
1. POLICY NAMING CONVENTION
   Format: {table}_{description}
   Examples:
     members_tenant_isolation
     members_own_memberships
     subscriptions_admin_only
     audit_log_tenant_read
     academies_select_own

2. EXECUTION ORDER IN MIGRATIONS
   a. Create get_current_academy_id() function FIRST
   b. Create is_academy_admin() function SECOND
   c. Create tables with RLS ENABLED
   d. Create policies AFTER all tables exist
      (policies may reference other tables)
   e. Create academy_public VIEW last
   f. GRANT statements last

3. RLS IS ENABLED BUT NO DEFAULT DENY STATEMENT NEEDED
   PostgreSQL with RLS enabled and no matching policy = no access.
   We don't need an explicit "deny all" policy.

4. SERVICE ROLE CLIENT USAGE INVENTORY
   These server-side code paths use supabaseAdmin (service role):
     - Stripe webhook handlers (academy/subscription/payment CRUD)
     - Invite acceptance handler (member creation, JWT update)
     - Academy switch handler (app_metadata update)
     - Cron: subscription checks, invite cleanup, automation engine
     - Audit log writes
     - Ownership transfer operations
     - Belt promotion trigger (writes to member_belt_history)
   All other operations use the authenticated Supabase client
   with the user's JWT, subject to RLS.

5. PERFORMANCE CONSIDERATIONS
   - get_current_academy_id(): called on every query. STABLE hint
     allows planner to cache within a statement. Fast: JWT parsing.
   - is_academy_admin(): called only on billing table queries.
     Uses EXISTS with indexed lookup. Sub-millisecond.
   - academies "select_own_academies" policy: subquery on members.
     For users with few memberships (99% of cases), this is fast.
     For pathological cases (user in 100+ academies), consider
     caching academy list in app_metadata as a uuid array.
   - No policy uses a sequential scan. All rely on indexed columns
     (academy_id, user_id).

6. FUTURE-PROOFING
   This RLS model supports:
     - Adding new tables: just use Tier 1 policy template
     - Adding new roles: no RLS changes needed (role checks are app-layer)
     - Sharding by academy_id: policies don't change
     - Moving to Supabase branching: policies are in migrations
     - Multi-region: policies are data-agnostic
   This model does NOT easily support:
     - Cross-tenant features (tournament results, inter-academy events)
       → Would need a separate schema with its own RLS model
     - Column-level RLS → Not a PostgreSQL feature; use app-layer
```
