-- ============================================================================
-- BJJFlow — Production Schema
-- ============================================================================
-- Sources of truth:
--   ARCHITECTURE.md, DATABASE_SCHEMA.md, ACCESS_MODEL.md,
--   SCHEMA_REVISION.md, RLS_MODEL.md
--
-- This migration creates all tables, indexes, constraints, and triggers.
-- RLS policies are in a SEPARATE migration (00002_rls_policies.sql).
-- Seed data is in a SEPARATE file (seed.sql).
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

-- pgcrypto: gen_random_uuid(), gen_random_bytes(), encode()
-- Already enabled by default on Supabase. Explicit for self-hosted.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

-- Extract active academy_id from JWT.
-- Returns NULL when no academy context exists (safe: NULL = no rows).
CREATE OR REPLACE FUNCTION get_current_academy_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid;
$$;

-- Check if the current authenticated user is an admin of the active academy.
-- Used by Tier 2 (admin-only) RLS policies on billing tables.
CREATE OR REPLACE FUNCTION is_academy_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE academy_id = get_current_academy_id()
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
  );
$$;

-- Auto-set updated_at on row modification.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-insert belt history when belt_rank or stripes change on members.
CREATE OR REPLACE FUNCTION record_belt_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.belt_rank IS DISTINCT FROM NEW.belt_rank
     OR OLD.stripes IS DISTINCT FROM NEW.stripes
  THEN
    INSERT INTO public.member_belt_history (
      academy_id, member_id, belt_rank, stripes, promoted_at
    ) VALUES (
      OLD.academy_id, OLD.id, OLD.belt_rank, OLD.stripes, now()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Denormalized attendance count maintenance.
CREATE OR REPLACE FUNCTION maintain_attendance_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.class_sessions
       SET attendance_count = attendance_count + 1
     WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.class_sessions
       SET attendance_count = attendance_count - 1
     WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$;


-- ============================================================================
-- 2. TENANT CORE
-- ============================================================================

-- 2.1 academies ---------------------------------------------------------

CREATE TABLE public.academies (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name                        text NOT NULL,
  slug                        text NOT NULL,
  logo_url                    text,

  -- Ownership (references auth.users, NOT members — avoids circular FK)
  owner_id                    uuid NOT NULL REFERENCES auth.users(id),

  -- Locale
  timezone                    text NOT NULL DEFAULT 'America/Sao_Paulo',
  locale                      text NOT NULL DEFAULT 'pt-BR',
  currency                    text NOT NULL DEFAULT 'BRL'
                              CHECK (currency IN ('BRL', 'EUR', 'USD', 'GBP')),
  country_code                text NOT NULL DEFAULT 'BR',

  -- Lifecycle
  status                      text NOT NULL DEFAULT 'trialing'
                              CHECK (status IN (
                                'trialing', 'active', 'past_due',
                                'suspended', 'cancelled', 'deleted'
                              )),

  -- Stripe integration
  stripe_customer_id          text UNIQUE,
  stripe_subscription_id      text UNIQUE,
  plan                        text NOT NULL DEFAULT 'starter'
                              CHECK (plan IN ('starter', 'growth', 'pro', 'enterprise')),

  -- Plan limits (enforced at application layer)
  max_members                 int NOT NULL DEFAULT 50,
  max_storage_mb              int NOT NULL DEFAULT 1024,

  -- Permission booleans (extracted from jsonb per SCHEMA_REVISION H-3)
  allow_student_self_checkin  boolean NOT NULL DEFAULT true,
  require_checkin_geolocation boolean NOT NULL DEFAULT false,
  instructor_can_add_students boolean NOT NULL DEFAULT false,
  student_directory_visible   boolean NOT NULL DEFAULT false,

  -- Non-permission settings (UI/display preferences only)
  settings                    jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Contact / address
  email                       text,
  phone                       text,
  address_line1               text,
  address_line2               text,
  city                        text,
  state                       text,
  postal_code                 text,

  -- Trial
  trial_ends_at               timestamptz,

  -- Timestamps
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  -- Active academies MUST have Stripe integration (SCHEMA_REVISION rule)
  CONSTRAINT chk_academies_stripe CHECK (
    status IN ('suspended', 'cancelled', 'deleted')
    OR stripe_customer_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX idx_academies_slug       ON public.academies (slug);
CREATE INDEX idx_academies_status            ON public.academies (status);
CREATE INDEX idx_academies_stripe_customer   ON public.academies (stripe_customer_id);
CREATE INDEX idx_academies_owner             ON public.academies (owner_id);

CREATE TRIGGER trg_academies_updated_at
  BEFORE UPDATE ON public.academies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.2 members ------------------------------------------------------------

CREATE TABLE public.members (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  -- Auth link — NULLABLE for managed profiles (SCHEMA_REVISION C-1)
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- RBAC
  role                  text NOT NULL DEFAULT 'student'
                        CHECK (role IN ('admin', 'instructor', 'student')),

  -- Profile
  display_name          text NOT NULL,
  email                 text,            -- NULLABLE for phone-only managed profiles (H-1)
  avatar_url            text,
  phone                 text,

  -- BJJ-specific
  belt_rank             text NOT NULL DEFAULT 'white'
                        CHECK (belt_rank IN (
                          'white', 'blue', 'purple', 'brown', 'black',
                          'coral', 'red_white', 'red'
                        )),
  stripes               int NOT NULL DEFAULT 0
                        CHECK (stripes BETWEEN 0 AND 4),
  weight_class          text,
  date_of_birth         date,
  emergency_contact     text,
  emergency_phone       text,

  -- Role-specific metadata blobs
  student_metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  instructor_metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Portal access flag (SCHEMA_REVISION C-3)
  has_portal_access     boolean NOT NULL DEFAULT false,

  -- Status
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),

  -- Provenance
  created_by            uuid REFERENCES public.members(id) ON DELETE SET NULL,
  joined_at             timestamptz NOT NULL DEFAULT now(),
  last_active_at        timestamptz,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Portal access requires an auth account (SCHEMA_REVISION C-3)
  CONSTRAINT chk_members_portal CHECK (
    has_portal_access = false OR user_id IS NOT NULL
  ),
  -- Admin role requires an auth account (no managed-profile admin)
  CONSTRAINT chk_members_admin_auth CHECK (
    role IN ('instructor', 'student') OR user_id IS NOT NULL
  )
);

-- Partial unique: one auth user per academy (SCHEMA_REVISION C-2)
CREATE UNIQUE INDEX idx_members_academy_user_unique
  ON public.members (academy_id, user_id)
  WHERE user_id IS NOT NULL;

-- Partial unique: one managed profile per email per academy (C-2)
CREATE UNIQUE INDEX idx_members_academy_email_managed
  ON public.members (academy_id, email)
  WHERE user_id IS NULL AND email IS NOT NULL;

CREATE INDEX idx_members_academy           ON public.members (academy_id);
CREATE INDEX idx_members_user              ON public.members (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_members_academy_role      ON public.members (academy_id, role);
CREATE INDEX idx_members_academy_status    ON public.members (academy_id, status);
CREATE INDEX idx_members_academy_belt      ON public.members (academy_id, belt_rank);
CREATE INDEX idx_members_portal            ON public.members (academy_id, has_portal_access)
  WHERE has_portal_access = true;

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_members_belt_promotion
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  WHEN (OLD.belt_rank IS DISTINCT FROM NEW.belt_rank
        OR OLD.stripes IS DISTINCT FROM NEW.stripes)
  EXECUTE FUNCTION record_belt_promotion();


-- 2.3 member_belt_history ------------------------------------------------

CREATE TABLE public.member_belt_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  belt_rank             text NOT NULL,
  stripes               int NOT NULL DEFAULT 0,
  promoted_by           uuid REFERENCES public.members(id) ON DELETE SET NULL,
  promoted_at           timestamptz NOT NULL DEFAULT now(),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_belt_history_member ON public.member_belt_history (academy_id, member_id);


-- 2.4 invites ------------------------------------------------------------

CREATE TABLE public.invites (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  -- Invite vs activation (SCHEMA_REVISION C-7)
  invite_type           text NOT NULL DEFAULT 'invite'
                        CHECK (invite_type IN ('invite', 'activation')),

  email                 text NOT NULL,
  role                  text NOT NULL DEFAULT 'student'
                        CHECK (role IN ('instructor', 'student')),
  token                 text UNIQUE NOT NULL
                        DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- For activation invites: the managed profile to link (C-7)
  target_member_id      uuid REFERENCES public.members(id) ON DELETE CASCADE,

  -- Who sent the invite
  invited_by            uuid NOT NULL REFERENCES public.members(id),

  -- Lifecycle
  accepted_at           timestamptz,
  revoked_at            timestamptz,                -- soft revocation (M-2)
  revoked_by            uuid REFERENCES public.members(id) ON DELETE SET NULL,
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  created_at            timestamptz NOT NULL DEFAULT now(),

  -- Activation invites must reference a target member
  CONSTRAINT chk_invites_type_target CHECK (
    (invite_type = 'invite'     AND target_member_id IS NULL)
    OR
    (invite_type = 'activation' AND target_member_id IS NOT NULL)
  )
);

CREATE INDEX idx_invites_token            ON public.invites (token);
CREATE INDEX idx_invites_academy          ON public.invites (academy_id);
CREATE INDEX idx_invites_active
  ON public.invites (academy_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX idx_invites_target_member
  ON public.invites (target_member_id)
  WHERE target_member_id IS NOT NULL;


-- ============================================================================
-- 3. SCHEDULING
-- ============================================================================

-- 3.1 classes ------------------------------------------------------------

CREATE TABLE public.classes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id              uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  name                    text NOT NULL,
  description             text,

  class_type              text NOT NULL DEFAULT 'regular'
                          CHECK (class_type IN (
                            'regular', 'open_mat', 'competition_prep',
                            'private', 'seminar', 'kids'
                          )),
  gi_type                 text NOT NULL DEFAULT 'gi'
                          CHECK (gi_type IN ('gi', 'nogi', 'both')),

  -- Belt requirements (app-validated, not CHECK — values evolve)
  belt_level_min          text DEFAULT 'white',
  belt_level_max          text DEFAULT 'red',

  -- Recurrence
  day_of_week             int CHECK (day_of_week BETWEEN 0 AND 6),
  start_time              time NOT NULL,
  end_time                time NOT NULL,
  is_recurring            boolean NOT NULL DEFAULT true,

  -- Capacity
  max_students            int,  -- NULL = unlimited

  -- Default instructor
  default_instructor_id   uuid REFERENCES public.members(id) ON DELETE SET NULL,

  -- Location (multi-mat academies)
  room                    text,

  -- Tags for filtering
  tags                    text[] NOT NULL DEFAULT '{}',

  -- Soft delete
  is_active               boolean NOT NULL DEFAULT true,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_academy          ON public.classes (academy_id);
CREATE INDEX idx_classes_academy_day      ON public.classes (academy_id, day_of_week);
CREATE INDEX idx_classes_instructor       ON public.classes (default_instructor_id)
  WHERE default_instructor_id IS NOT NULL;

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.2 class_sessions -----------------------------------------------------

CREATE TABLE public.class_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  class_id              uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,

  date                  date NOT NULL,
  start_time            time NOT NULL,
  end_time              time NOT NULL,

  -- Can override instructor per session
  instructor_id         uuid REFERENCES public.members(id) ON DELETE SET NULL,

  -- Outcome
  status                text NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN (
                          'scheduled', 'in_progress', 'completed', 'cancelled'
                        )),
  attendance_count      int NOT NULL DEFAULT 0,

  -- Content
  notes                 text,
  topic                 text,

  -- Cancellation tracking (SCHEMA_REVISION M-7)
  cancelled_by          uuid REFERENCES public.members(id) ON DELETE SET NULL,
  cancel_reason         text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (class_id, date)
);

CREATE INDEX idx_sessions_academy_date    ON public.class_sessions (academy_id, date);
CREATE INDEX idx_sessions_instructor      ON public.class_sessions (instructor_id)
  WHERE instructor_id IS NOT NULL;
CREATE INDEX idx_sessions_status          ON public.class_sessions (academy_id, status, date);

CREATE TRIGGER trg_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 4. ATTENDANCE & CHECK-INS
-- ============================================================================

-- 4.1 attendance ---------------------------------------------------------

CREATE TABLE public.attendance (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  session_id            uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  check_in_method       text NOT NULL DEFAULT 'manual'
                        CHECK (check_in_method IN (
                          'manual', 'self', 'qr_code', 'geolocation'
                        )),
  checked_in_at         timestamptz NOT NULL DEFAULT now(),
  checked_in_by         uuid REFERENCES public.members(id) ON DELETE SET NULL,

  -- Geolocation proof
  latitude              decimal(10, 7),
  longitude             decimal(10, 7),

  -- Student feedback
  rating                int CHECK (rating BETWEEN 1 AND 5),
  feedback              text,

  created_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id, member_id)
);

CREATE INDEX idx_attendance_academy       ON public.attendance (academy_id);
CREATE INDEX idx_attendance_session       ON public.attendance (session_id);
CREATE INDEX idx_attendance_member        ON public.attendance (academy_id, member_id);
CREATE INDEX idx_attendance_date          ON public.attendance (academy_id, checked_in_at);

CREATE TRIGGER trg_attendance_count
  AFTER INSERT OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION maintain_attendance_count();


-- 4.2 check_ins (facility access) ----------------------------------------

CREATE TABLE public.check_ins (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  checked_in_at         timestamptz NOT NULL DEFAULT now(),
  checked_out_at        timestamptz,

  method                text NOT NULL DEFAULT 'app'
                        CHECK (method IN ('app', 'qr_code', 'nfc', 'manual', 'kiosk')),

  -- Optional: auto-link to class session if timing matches
  session_id            uuid REFERENCES public.class_sessions(id) ON DELETE SET NULL,

  latitude              decimal(10, 7),
  longitude             decimal(10, 7),

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_academy         ON public.check_ins (academy_id);
CREATE INDEX idx_checkins_member          ON public.check_ins (academy_id, member_id);
CREATE INDEX idx_checkins_date            ON public.check_ins (academy_id, checked_in_at);


-- ============================================================================
-- 5. CURRICULUM
-- ============================================================================

-- 5.1 techniques ---------------------------------------------------------
-- NOTE: position and category have NO CHECK constraint (SCHEMA_REVISION L-3).
-- Academies define custom taxonomies. Validation at application layer.

CREATE TABLE public.techniques (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  name                  text NOT NULL,
  description           text,

  -- Classification (app-validated, no CHECK — values evolve per academy)
  position              text NOT NULL,
  category              text NOT NULL,
  sub_category          text,

  -- Difficulty / belt mapping
  belt_level            text NOT NULL DEFAULT 'white',
  difficulty            int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),

  -- Content
  instructions          text,
  key_points            text[],

  -- Tags
  tags                  text[] NOT NULL DEFAULT '{}',

  -- Visibility
  is_published          boolean NOT NULL DEFAULT true,
  sort_order            int NOT NULL DEFAULT 0,

  -- Provenance
  created_by            uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_techniques_academy       ON public.techniques (academy_id);
CREATE INDEX idx_techniques_position      ON public.techniques (academy_id, position);
CREATE INDEX idx_techniques_category      ON public.techniques (academy_id, category);
CREATE INDEX idx_techniques_belt          ON public.techniques (academy_id, belt_level);
CREATE INDEX idx_techniques_tags          ON public.techniques USING gin (tags);

CREATE TRIGGER trg_techniques_updated_at
  BEFORE UPDATE ON public.techniques
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 5.2 technique_media ----------------------------------------------------

CREATE TABLE public.technique_media (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  technique_id          uuid NOT NULL REFERENCES public.techniques(id) ON DELETE CASCADE,

  media_type            text NOT NULL CHECK (media_type IN ('video', 'image', 'diagram')),
  url                   text NOT NULL,
  thumbnail_url         text,
  title                 text,
  duration_seconds      int,
  sort_order            int NOT NULL DEFAULT 0,
  file_size_bytes       bigint,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technique_media_technique ON public.technique_media (technique_id);


-- 5.3 session_techniques -------------------------------------------------
-- Junction: which techniques were taught in a specific class session.
-- Placed here (after techniques) to satisfy FK dependency order.

CREATE TABLE public.session_techniques (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  session_id            uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  technique_id          uuid NOT NULL REFERENCES public.techniques(id) ON DELETE CASCADE,
  sort_order            int NOT NULL DEFAULT 0,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (session_id, technique_id)
);

CREATE INDEX idx_session_techniques_session ON public.session_techniques (session_id);


-- ============================================================================
-- 6. BILLING & PAYMENTS
-- ============================================================================

-- 6.1 subscriptions (academy → BJJFlow) ----------------------------------

CREATE TABLE public.subscriptions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  stripe_subscription_id    text UNIQUE NOT NULL,
  stripe_customer_id        text NOT NULL,
  stripe_price_id           text NOT NULL,

  plan                      text NOT NULL,
  status                    text NOT NULL
                            CHECK (status IN (
                              'trialing', 'active', 'past_due',
                              'cancelled', 'unpaid', 'incomplete',
                              'incomplete_expired', 'paused'
                            )),

  currency                  text NOT NULL,
  amount_cents              int NOT NULL,
  billing_interval          text NOT NULL DEFAULT 'month'
                            CHECK (billing_interval IN ('month', 'year')),

  current_period_start      timestamptz,
  current_period_end        timestamptz,
  trial_end                 timestamptz,
  cancel_at                 timestamptz,
  cancelled_at              timestamptz,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_academy    ON public.subscriptions (academy_id);
CREATE INDEX idx_subscriptions_stripe     ON public.subscriptions (stripe_subscription_id);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 6.2 payments (synced from Stripe) --------------------------------------

CREATE TABLE public.payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id                  uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  subscription_id             uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id           text UNIQUE,
  stripe_payment_intent_id    text,
  stripe_charge_id            text,

  amount_cents                int NOT NULL,
  currency                    text NOT NULL,
  status                      text NOT NULL
                              CHECK (status IN (
                                'pending', 'succeeded', 'failed', 'refunded', 'disputed'
                              )),

  description                 text,
  invoice_url                 text,
  receipt_url                 text,

  period_start                timestamptz,
  period_end                  timestamptz,
  paid_at                     timestamptz,
  refunded_at                 timestamptz,

  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_academy         ON public.payments (academy_id);
CREATE INDEX idx_payments_subscription    ON public.payments (subscription_id);
CREATE INDEX idx_payments_status          ON public.payments (academy_id, status);
CREATE INDEX idx_payments_date            ON public.payments (academy_id, paid_at);


-- 6.3 student_plans (academy charges students) ----------------------------

CREATE TABLE public.student_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  plan_name             text NOT NULL,
  amount_cents          int NOT NULL,
  currency              text NOT NULL,
  billing_cycle         text NOT NULL DEFAULT 'monthly'
                        CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  classes_per_week      int,  -- NULL = unlimited

  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),

  starts_at             timestamptz NOT NULL DEFAULT now(),
  next_billing_at       timestamptz,
  ends_at               timestamptz,

  payment_method        text NOT NULL DEFAULT 'external'
                        CHECK (payment_method IN ('external', 'stripe')),
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_plans_academy    ON public.student_plans (academy_id);
CREATE INDEX idx_student_plans_member     ON public.student_plans (member_id);
CREATE INDEX idx_student_plans_status     ON public.student_plans (academy_id, status);
CREATE INDEX idx_student_plans_billing    ON public.student_plans (academy_id, next_billing_at);

CREATE TRIGGER trg_student_plans_updated_at
  BEFORE UPDATE ON public.student_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 7. NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  type                  text NOT NULL
                        CHECK (type IN (
                          'class_reminder', 'class_cancelled', 'class_rescheduled',
                          'streak_milestone', 'attendance_low', 'welcome_back',
                          'promotion', 'belt_stripe_earned',
                          'payment_due', 'payment_received', 'payment_overdue',
                          'plan_expiring',
                          'new_member_welcome', 'birthday',
                          'academy_announcement', 'system_update',
                          'ai_insight', 'ai_recommendation'
                        )),

  title                 text NOT NULL,
  body                  text NOT NULL,
  data                  jsonb NOT NULL DEFAULT '{}'::jsonb,

  channel               text NOT NULL DEFAULT 'in_app'
                        CHECK (channel IN ('in_app', 'email', 'push', 'sms', 'whatsapp')),
  delivered_at          timestamptz,
  read_at               timestamptz,

  priority              text NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  expires_at            timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_member     ON public.notifications (academy_id, member_id);
CREATE INDEX idx_notifications_unread
  ON public.notifications (academy_id, member_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type       ON public.notifications (academy_id, type);
CREATE INDEX idx_notifications_created    ON public.notifications (academy_id, created_at DESC);


-- ============================================================================
-- 8. AUTOMATIONS
-- ============================================================================

-- 8.1 automations --------------------------------------------------------

CREATE TABLE public.automations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  name                  text NOT NULL,
  description           text,

  trigger_type          text NOT NULL
                        CHECK (trigger_type IN ('schedule', 'event', 'condition')),
  trigger_config        jsonb NOT NULL,

  action_type           text NOT NULL
                        CHECK (action_type IN (
                          'send_notification', 'send_email', 'send_whatsapp',
                          'update_member_status', 'create_ai_insight', 'webhook'
                        )),
  action_config         jsonb NOT NULL,

  is_active             boolean NOT NULL DEFAULT true,

  last_run_at           timestamptz,
  run_count             int NOT NULL DEFAULT 0,
  error_count           int NOT NULL DEFAULT 0,

  created_by            uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automations_academy      ON public.automations (academy_id);
CREATE INDEX idx_automations_active
  ON public.automations (academy_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_automations_trigger      ON public.automations (academy_id, trigger_type);

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 8.2 automation_runs ----------------------------------------------------

CREATE TABLE public.automation_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  automation_id         uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,

  status                text NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  affected_count        int NOT NULL DEFAULT 0,

  error_message         text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_automation ON public.automation_runs (automation_id);
CREATE INDEX idx_automation_runs_date       ON public.automation_runs (academy_id, started_at DESC);


-- 8.3 automation_logs ----------------------------------------------------

CREATE TABLE public.automation_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  run_id                uuid NOT NULL REFERENCES public.automation_runs(id) ON DELETE CASCADE,
  member_id             uuid REFERENCES public.members(id) ON DELETE SET NULL,

  action                text NOT NULL,
  status                text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_logs_run ON public.automation_logs (run_id);


-- ============================================================================
-- 9. AI INSIGHTS
-- ============================================================================

-- 9.1 ai_insights --------------------------------------------------------

CREATE TABLE public.ai_insights (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  insight_type          text NOT NULL
                        CHECK (insight_type IN (
                          'churn_risk', 'engagement_drop', 'reactivation_opportunity',
                          'promotion_ready', 'plateau_detected', 'overtraining_risk',
                          'revenue_trend', 'class_optimization', 'peak_hour_shift',
                          'instructor_impact',
                          'technique_gap', 'popular_techniques',
                          'custom'
                        )),

  target_type           text NOT NULL DEFAULT 'academy'
                        CHECK (target_type IN ('academy', 'member', 'class', 'instructor')),
  target_id             uuid,

  title                 text NOT NULL,
  summary               text NOT NULL,
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,

  confidence            decimal(3, 2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  severity              text NOT NULL DEFAULT 'info'
                        CHECK (severity IN ('info', 'warning', 'critical')),
  priority_score        int NOT NULL DEFAULT 50
                        CHECK (priority_score BETWEEN 0 AND 100),

  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'dismissed', 'actioned', 'expired')),
  dismissed_by          uuid REFERENCES public.members(id) ON DELETE SET NULL,
  dismissed_at          timestamptz,

  model_version         text,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_insights_academy      ON public.ai_insights (academy_id);
CREATE INDEX idx_ai_insights_type         ON public.ai_insights (academy_id, insight_type);
CREATE INDEX idx_ai_insights_target       ON public.ai_insights (academy_id, target_type, target_id);
CREATE INDEX idx_ai_insights_active
  ON public.ai_insights (academy_id, status)
  WHERE status = 'active';
CREATE INDEX idx_ai_insights_priority
  ON public.ai_insights (academy_id, priority_score DESC)
  WHERE status = 'active';


-- 9.2 ai_insight_actions -------------------------------------------------

CREATE TABLE public.ai_insight_actions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  insight_id            uuid NOT NULL REFERENCES public.ai_insights(id) ON DELETE CASCADE,

  action_type           text NOT NULL
                        CHECK (action_type IN (
                          'viewed', 'dismissed', 'actioned',
                          'shared', 'feedback_positive', 'feedback_negative'
                        )),
  action_by             uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  notes                 text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insight_actions_insight ON public.ai_insight_actions (insight_id);


-- ============================================================================
-- 10. AUDIT & SYSTEM
-- ============================================================================

-- 10.1 audit_log ---------------------------------------------------------

CREATE TABLE public.audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  -- Actor — NULLABLE for system-generated events (SCHEMA_REVISION H-5)
  actor_type            text NOT NULL DEFAULT 'member'
                        CHECK (actor_type IN ('member', 'system', 'webhook', 'cron')),
  actor_id              uuid REFERENCES public.members(id) ON DELETE SET NULL,

  action                text NOT NULL,
  resource_type         text NOT NULL,
  resource_id           uuid,
  changes               jsonb,

  ip_address            inet,
  user_agent            text,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_academy            ON public.audit_log (academy_id);
CREATE INDEX idx_audit_actor              ON public.audit_log (academy_id, actor_id)
  WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_date               ON public.audit_log (academy_id, created_at DESC);
CREATE INDEX idx_audit_resource           ON public.audit_log (academy_id, resource_type, resource_id);


-- 10.2 ownership_transfers (NEW — SCHEMA_REVISION H-9) -------------------

CREATE TABLE public.ownership_transfers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  from_user_id          uuid NOT NULL REFERENCES auth.users(id),
  to_user_id            uuid NOT NULL REFERENCES auth.users(id),

  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),

  initiated_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  confirmation_token    text UNIQUE NOT NULL
                        DEFAULT encode(gen_random_bytes(32), 'hex'),

  created_at            timestamptz NOT NULL DEFAULT now(),

  -- Cannot transfer to yourself
  CONSTRAINT chk_transfers_different_users CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_transfers_academy        ON public.ownership_transfers (academy_id);
CREATE INDEX idx_transfers_pending
  ON public.ownership_transfers (academy_id, status)
  WHERE status = 'pending';


-- ============================================================================
-- 11. VIEWS
-- ============================================================================

-- Safe public-facing subset of academies for slug resolution.
-- Exposes ONLY non-sensitive fields. No Stripe IDs, no contact info.
CREATE VIEW public.academy_public AS
  SELECT id, slug, name, logo_url, status
  FROM public.academies;


-- ============================================================================
-- 12. ENABLE RLS ON ALL TABLES
-- ============================================================================
-- Policies are defined in the NEXT migration (00002_rls_policies.sql).
-- RLS is enabled here so that tables are secure-by-default immediately.
-- With no policies, all access is denied (except service role).

ALTER TABLE public.academies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_belt_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_techniques    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.techniques            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insight_actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_transfers   ENABLE ROW LEVEL SECURITY;
