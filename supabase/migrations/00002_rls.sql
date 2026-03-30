-- ============================================================================
-- BJJFlow — Row-Level Security Policies
-- ============================================================================
-- Source of truth: RLS_MODEL.md
-- Depends on:     00001_schema.sql (tables, functions, RLS ENABLED)
--
-- PRINCIPLES:
--   1. RLS is the last line of defense (tenant boundary).
--   2. Deny by default (RLS enabled + no policy = no access).
--   3. JWT is the sole identity source (no client-side trust).
--   4. Service role bypasses all RLS (server-only, never in client).
--   5. Policies are simple, narrow, and auditable.
--
-- HELPER FUNCTIONS (already created in 00001):
--   get_current_academy_id()  → uuid from JWT, NULL if missing
--   is_academy_admin()        → boolean, SECURITY DEFINER
--
-- TIER SYSTEM:
--   Tier 1: Standard tenant isolation (FOR ALL)
--   Tier 2: Admin-only tenant isolation (FOR SELECT, billing)
--   Tier 3: Self-access across academies (FOR SELECT, members)
--   Tier 4: Membership-gated SELECT (academies)
--
-- NAMING: {table}_{description}
-- ============================================================================


-- ============================================================================
-- DOMAIN 1: TENANT CORE
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 academies — Tier 4: membership-gated SELECT
-- ---------------------------------------------------------------------------
-- Users can read full details of academies they belong to.
-- No INSERT/UPDATE/DELETE policies — all writes via service role.
-- Service role handles: Stripe webhooks, admin server actions.
-- Slug resolution uses service role client in middleware.

CREATE POLICY academies_select_own
  ON public.academies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT academy_id
      FROM public.members
      WHERE user_id = auth.uid()
        AND has_portal_access = true
    )
  );


-- ---------------------------------------------------------------------------
-- 1.2 members — Tier 1 + Tier 3
-- ---------------------------------------------------------------------------
-- Policy 1: Standard tenant isolation for all operations within the
-- active academy. Role-based write restrictions are app-layer.
-- Policy 2: Self-access SELECT across ALL academies for the academy
-- switcher. Only returns portal-enabled memberships.

CREATE POLICY members_tenant_isolation
  ON public.members
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());

CREATE POLICY members_own_memberships
  ON public.members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND has_portal_access = true
  );

-- NOTE: PostgreSQL ORs the USING clauses for SELECT. A row is visible
-- if EITHER policy matches. For writes, only tenant_isolation's
-- WITH CHECK applies (own_memberships is SELECT-only).
-- Managed profiles (user_id=NULL) are never matched by own_memberships.


-- ---------------------------------------------------------------------------
-- 1.3 member_belt_history — Tier 1
-- ---------------------------------------------------------------------------
-- All academy members can see belt history (belt ranks are public
-- in BJJ culture). Writes: trigger-generated or admin/instructor
-- via app layer. Rows are never deleted (immutable history).

CREATE POLICY member_belt_history_tenant_isolation
  ON public.member_belt_history
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 1.4 invites — Tier 1
-- ---------------------------------------------------------------------------
-- All academy members can view invites. Admin-only creation/revocation
-- enforced at app layer. Invite acceptance uses service role (the
-- accepting user has no academy context in their JWT yet).

CREATE POLICY invites_tenant_isolation
  ON public.invites
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 2: SCHEDULING
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 classes — Tier 1
-- ---------------------------------------------------------------------------
-- Schedule is visible to all academy members. Create/edit restricted
-- to admin/instructor at app layer. Soft delete via is_active = false.

CREATE POLICY classes_tenant_isolation
  ON public.classes
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 2.2 class_sessions — Tier 1
-- ---------------------------------------------------------------------------
-- All members see sessions. Write restrictions (instructor assignment,
-- cancellation) enforced at app layer. Never hard-deleted.

CREATE POLICY class_sessions_tenant_isolation
  ON public.class_sessions
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 2.3 session_techniques — Tier 1
-- ---------------------------------------------------------------------------
-- Visible to all members. Insert/update/delete by admin/instructor
-- at app layer.

CREATE POLICY session_techniques_tenant_isolation
  ON public.session_techniques
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 3: ATTENDANCE & CHECK-INS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 attendance — Tier 1
-- ---------------------------------------------------------------------------
-- All academy members can see attendance (everyone in a BJJ class
-- sees who showed up). Student self check-in gated by academy setting
-- allow_student_self_checkin — enforced at app layer, NOT in RLS.
-- Managed profile attendance created by instructor on their behalf.

CREATE POLICY attendance_tenant_isolation
  ON public.attendance
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 3.2 check_ins — Tier 1
-- ---------------------------------------------------------------------------
-- Facility access log. All members can read within academy.
-- App filters student view to own check-ins. Immutable — never deleted.

CREATE POLICY check_ins_tenant_isolation
  ON public.check_ins
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 4: CURRICULUM
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 techniques — Tier 1
-- ---------------------------------------------------------------------------
-- All members see techniques at the RLS level. The is_published
-- filter is app-layer (students see published only, admin/instructor
-- see all). This allows edge cases like shared unpublished links.

CREATE POLICY techniques_tenant_isolation
  ON public.techniques
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 4.2 technique_media — Tier 1
-- ---------------------------------------------------------------------------
-- Follows parent technique visibility. CRUD by admin/instructor (app-layer).

CREATE POLICY technique_media_tenant_isolation
  ON public.technique_media
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 5: BILLING
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 subscriptions — Tier 2: admin-only SELECT
-- ---------------------------------------------------------------------------
-- CRITICAL: Only admin members can read subscription data.
-- Prevents students/instructors from seeing Stripe IDs, plan amounts,
-- or invoice URLs even via direct Supabase queries.
-- All writes via service role only (Stripe webhooks).

CREATE POLICY subscriptions_admin_only
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  );

-- No INSERT/UPDATE/DELETE policy.
-- Service role (Stripe webhook handler) writes directly.


-- ---------------------------------------------------------------------------
-- 5.2 payments — Tier 2: admin-only SELECT
-- ---------------------------------------------------------------------------
-- Identical pattern to subscriptions. Admin-only read access.
-- All writes via service role (Stripe webhooks).

CREATE POLICY payments_admin_only
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  );

-- No INSERT/UPDATE/DELETE policy.
-- Service role writes directly.


-- ---------------------------------------------------------------------------
-- 5.3 student_plans — Tier 1 (intentionally NOT admin-only)
-- ---------------------------------------------------------------------------
-- Standard tenant isolation. NOT admin-only because instructors may
-- need to check a student's plan status before allowing check-in.
-- Write restrictions (admin-only) enforced at app layer.

CREATE POLICY student_plans_tenant_isolation
  ON public.student_plans
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 6: NOTIFICATIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6.1 notifications — Tier 1
-- ---------------------------------------------------------------------------
-- All members within academy can see notifications at RLS level.
-- App filters: students/instructors see own only, admin sees all.
-- This design avoids a get_current_member_id() helper function.
-- Managed profiles never have in_app notifications (app-enforced).

CREATE POLICY notifications_tenant_isolation
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 7: AUTOMATIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 automations — Tier 1
-- ---------------------------------------------------------------------------
-- Tenant-scoped, NOT admin-only at RLS level. Reason: automations
-- may eventually be visible to instructors. Admin-only enforced at
-- app layer for now. Avoids a migration when instructor visibility ships.

CREATE POLICY automations_tenant_isolation
  ON public.automations
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 7.2 automation_runs — Tier 1
-- ---------------------------------------------------------------------------
-- Admin reads via app layer. Most writes via service role (engine).

CREATE POLICY automation_runs_tenant_isolation
  ON public.automation_runs
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 7.3 automation_logs — Tier 1
-- ---------------------------------------------------------------------------
-- Admin reads via app layer. All writes via service role (engine).

CREATE POLICY automation_logs_tenant_isolation
  ON public.automation_logs
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 8: AI INSIGHTS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 ai_insights — Tier 1
-- ---------------------------------------------------------------------------
-- Tenant-scoped. App filters by role: admin sees all, instructor sees
-- class-level, student sees none. Inserts by service role (AI pipeline).

CREATE POLICY ai_insights_tenant_isolation
  ON public.ai_insights
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ---------------------------------------------------------------------------
-- 8.2 ai_insight_actions — Tier 1
-- ---------------------------------------------------------------------------
-- Tenant-scoped. Admin/instructor can log actions on insights.
-- Records are immutable (no UPDATE/DELETE at app layer).

CREATE POLICY ai_insight_actions_tenant_isolation
  ON public.ai_insight_actions
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- DOMAIN 9: AUDIT & SYSTEM
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 audit_log — Tier 1, SELECT ONLY
-- ---------------------------------------------------------------------------
-- TAMPER-PROOF: No user-facing INSERT/UPDATE/DELETE policies.
-- Even a compromised admin account cannot modify audit entries.
-- All writes exclusively via service role (server-side).
-- Admin reads the trail via app layer.

CREATE POLICY audit_log_tenant_read
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (academy_id = get_current_academy_id());

-- No INSERT policy → user-facing INSERT denied.
-- No UPDATE policy → user-facing UPDATE denied.
-- No DELETE policy → user-facing DELETE denied.
-- Service role bypasses RLS for writes.


-- ============================================================================
-- DOMAIN 10: OWNERSHIP TRANSFER
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 10.1 ownership_transfers — Tier 1, SELECT ONLY
-- ---------------------------------------------------------------------------
-- SECURITY-CRITICAL: No user-facing write policies.
-- Initiation: admin server action → service role INSERT.
-- Confirmation: new owner via confirmation link → service role UPDATE.
-- Expiry: cron job → service role UPDATE.
-- Admin can view pending/completed transfers.

CREATE POLICY ownership_transfers_tenant_read
  ON public.ownership_transfers
  FOR SELECT
  TO authenticated
  USING (academy_id = get_current_academy_id());

-- No INSERT/UPDATE/DELETE policies.
-- All mutations via service role only.


-- ============================================================================
-- DOMAIN 11: PUBLIC ACCESS SURFACE
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 11.1 academy_public VIEW — GRANT
-- ---------------------------------------------------------------------------
-- The view inherits RLS from the base academies table (SECURITY INVOKER).
-- For authenticated users, only their own academies are visible.
-- For slug resolution during login, middleware uses service role.
-- Exposes ONLY: id, slug, name, logo_url, status.
-- Does NOT expose: Stripe IDs, contact info, financial data.

GRANT SELECT ON public.academy_public TO authenticated;


-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================
--
-- TABLE                    │ POLICY                              │ FOR     │ TIER
-- ─────────────────────────┼─────────────────────────────────────┼─────────┼──────
-- academies                │ academies_select_own                │ SELECT  │  4
-- members                  │ members_tenant_isolation            │ ALL     │  1
-- members                  │ members_own_memberships             │ SELECT  │  3
-- member_belt_history      │ member_belt_history_tenant_iso...   │ ALL     │  1
-- invites                  │ invites_tenant_isolation            │ ALL     │  1
-- classes                  │ classes_tenant_isolation             │ ALL     │  1
-- class_sessions           │ class_sessions_tenant_isolation     │ ALL     │  1
-- session_techniques       │ session_techniques_tenant_iso...    │ ALL     │  1
-- attendance               │ attendance_tenant_isolation         │ ALL     │  1
-- check_ins                │ check_ins_tenant_isolation          │ ALL     │  1
-- techniques               │ techniques_tenant_isolation         │ ALL     │  1
-- technique_media          │ technique_media_tenant_isolation    │ ALL     │  1
-- subscriptions            │ subscriptions_admin_only            │ SELECT  │  2
-- payments                 │ payments_admin_only                 │ SELECT  │  2
-- student_plans            │ student_plans_tenant_isolation      │ ALL     │  1
-- notifications            │ notifications_tenant_isolation      │ ALL     │  1
-- automations              │ automations_tenant_isolation        │ ALL     │  1
-- automation_runs          │ automation_runs_tenant_isolation    │ ALL     │  1
-- automation_logs          │ automation_logs_tenant_isolation    │ ALL     │  1
-- ai_insights              │ ai_insights_tenant_isolation        │ ALL     │  1
-- ai_insight_actions       │ ai_insight_actions_tenant_iso...    │ ALL     │  1
-- audit_log                │ audit_log_tenant_read               │ SELECT  │  1
-- ownership_transfers      │ ownership_transfers_tenant_read     │ SELECT  │  1
-- ─────────────────────────┴─────────────────────────────────────┴─────────┴──────
-- TOTAL: 23 policies across 22 tables
--   Tier 1 FOR ALL:     17 (standard tenant isolation)
--   Tier 1 SELECT-only:  2 (audit_log, ownership_transfers)
--   Tier 2 SELECT-only:  2 (subscriptions, payments — admin-only)
--   Tier 3 SELECT-only:  1 (members — self-access across academies)
--   Tier 4 SELECT-only:  1 (academies — membership-gated)
--
-- SERVICE-ROLE-ONLY WRITES (no user-facing write policy):
--   academies, subscriptions, payments, audit_log, ownership_transfers
--
-- INTENTIONALLY BROAD (MVP):
--   automations, automation_runs, automation_logs — Tier 1 (not admin-only)
--   because instructor visibility may be added later without migration.
--
--   student_plans — Tier 1 (not admin-only) because instructors may need
--   to verify plan status before check-in.
--
--   notifications — Tier 1 (not member-scoped) because admin needs
--   cross-member visibility for support. App filters to own.
--
-- RECURSION ANALYSIS:
--   academies policy → queries members (user_id = auth.uid())
--   members policy 1 → uses get_current_academy_id() (JWT only, no table query)
--   members policy 2 → uses auth.uid() (JWT only, no table query)
--   is_academy_admin() → queries members (SECURITY DEFINER, bypasses members RLS)
--   Result: NO circular dependencies. Safe.
