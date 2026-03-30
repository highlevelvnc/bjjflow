# BJJFlow - Complete Database Schema

## Schema Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           TENANT CORE                                    │
│  academies ──┬── members ──── member_belt_history                        │
│              │                                                           │
│              ├── SCHEDULING ─────────────────────────────────────────┐   │
│              │   classes ── class_sessions ── attendance             │   │
│              │                               └── session_techniques  │   │
│              │                                                       │   │
│              ├── CURRICULUM ─────────────────────────────────────────┤   │
│              │   techniques ── technique_media                       │   │
│              │   └── class_session → session_techniques              │   │
│              │                                                       │   │
│              ├── BILLING ────────────────────────────────────────────┤   │
│              │   subscriptions ── payments ── payment_line_items     │   │
│              │   student_plans                                       │   │
│              │                                                       │   │
│              ├── ENGAGEMENT ─────────────────────────────────────────┤   │
│              │   check_ins ── notifications ── notification_reads    │   │
│              │                                                       │   │
│              ├── AUTOMATION ─────────────────────────────────────────┤   │
│              │   automations ── automation_runs ── automation_logs   │   │
│              │                                                       │   │
│              └── AI ─────────────────────────────────────────────────┘   │
│                  ai_insights ── ai_insight_actions                       │
│                  ai_models_config                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tenant Core

### 1.1 academies

The root tenant table. Every other table references this.

```sql
CREATE TABLE academies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text NOT NULL,
  logo_url              text,
  timezone              text NOT NULL DEFAULT 'America/Sao_Paulo',
  locale                text NOT NULL DEFAULT 'pt-BR',
  currency              text NOT NULL DEFAULT 'BRL'
                        CHECK (currency IN ('BRL', 'EUR', 'USD', 'GBP')),
  country_code          text NOT NULL DEFAULT 'BR',  -- ISO 3166-1 alpha-2

  -- Status lifecycle
  status                text NOT NULL DEFAULT 'trialing'
                        CHECK (status IN (
                          'trialing', 'active', 'past_due',
                          'suspended', 'cancelled', 'deleted'
                        )),

  -- Stripe integration
  stripe_customer_id    text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan                  text NOT NULL DEFAULT 'starter'
                        CHECK (plan IN ('starter', 'growth', 'pro', 'enterprise')),

  -- Limits (enforced at app level)
  max_members           int NOT NULL DEFAULT 50,
  max_storage_mb        int NOT NULL DEFAULT 1024,

  -- Settings blob for academy-level config
  settings              jsonb NOT NULL DEFAULT '{
    "allow_student_self_checkin": true,
    "require_checkin_geolocation": false,
    "default_class_duration_min": 60,
    "belt_system": "ibjjf",
    "attendance_streak_enabled": true,
    "ai_insights_enabled": true
  }'::jsonb,

  -- Contact / address
  email                 text,
  phone                 text,
  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  postal_code           text,

  trial_ends_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_academies_slug ON academies(slug);
CREATE INDEX idx_academies_status ON academies(status);
CREATE INDEX idx_academies_stripe_customer ON academies(stripe_customer_id);

-- No RLS on academies. Access controlled by:
--   - Service role for writes
--   - Authenticated users can read their own (via members join)
```

### 1.2 members

Junction table linking `auth.users` to `academies`. This is the RBAC table.
A user can belong to multiple academies with different roles.

```sql
CREATE TABLE members (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role-based access
  role                  text NOT NULL DEFAULT 'student'
                        CHECK (role IN ('admin', 'instructor', 'student')),

  -- Profile (denormalized from auth.users for performance)
  display_name          text NOT NULL,
  email                 text NOT NULL,
  avatar_url            text,
  phone                 text,

  -- BJJ-specific
  belt_rank             text NOT NULL DEFAULT 'white'
                        CHECK (belt_rank IN (
                          'white', 'blue', 'purple', 'brown', 'black',
                          'coral', 'red_white', 'red'
                        )),
  stripes               int NOT NULL DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  weight_class          text,  -- e.g., "medio", "pesado"
  date_of_birth         date,
  emergency_contact     text,
  emergency_phone       text,

  -- Student-specific metadata
  student_metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { "goals": ["competition", "fitness"], "injuries": ["knee"], "notes": "" }

  -- Instructor-specific metadata
  instructor_metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { "specialties": ["guard", "leg_locks"], "certifications": [] }

  -- Status
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),

  joined_at             timestamptz NOT NULL DEFAULT now(),
  last_active_at        timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE(academy_id, user_id)
);

CREATE INDEX idx_members_academy ON members(academy_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_academy_role ON members(academy_id, role);
CREATE INDEX idx_members_academy_status ON members(academy_id, status);
CREATE INDEX idx_members_academy_belt ON members(academy_id, belt_rank);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_tenant_isolation" ON members
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 1.3 member_belt_history

Tracks belt promotions for each member. Important for BJJ culture.

```sql
CREATE TABLE member_belt_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  belt_rank             text NOT NULL,
  stripes               int NOT NULL DEFAULT 0,
  promoted_by           uuid REFERENCES members(id),  -- instructor who promoted
  promoted_at           timestamptz NOT NULL DEFAULT now(),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_belt_history_member ON member_belt_history(academy_id, member_id);

ALTER TABLE member_belt_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "belt_history_tenant_isolation" ON member_belt_history
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 1.4 invites

```sql
CREATE TABLE invites (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  email                 text NOT NULL,
  role                  text NOT NULL DEFAULT 'student'
                        CHECK (role IN ('instructor', 'student')),
  token                 text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by            uuid NOT NULL REFERENCES members(id),
  accepted_at           timestamptz,
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_academy ON invites(academy_id);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_tenant_isolation" ON invites
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 2. Scheduling

### 2.1 classes

Recurring class templates (e.g., "Monday 7pm Fundamentals").

```sql
CREATE TABLE classes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  description           text,
  class_type            text NOT NULL DEFAULT 'regular'
                        CHECK (class_type IN (
                          'regular', 'open_mat', 'competition_prep',
                          'private', 'seminar', 'kids'
                        )),
  gi_type               text NOT NULL DEFAULT 'gi'
                        CHECK (gi_type IN ('gi', 'nogi', 'both')),
  belt_level_min        text DEFAULT 'white',  -- minimum belt to attend
  belt_level_max        text DEFAULT 'red',

  -- Recurrence
  day_of_week           int CHECK (day_of_week BETWEEN 0 AND 6),
  start_time            time NOT NULL,
  end_time              time NOT NULL,
  is_recurring          boolean NOT NULL DEFAULT true,

  -- Capacity
  max_students          int,  -- null = unlimited

  -- Default instructor
  default_instructor_id uuid REFERENCES members(id) ON DELETE SET NULL,

  -- Location (for multi-mat academies)
  room                  text,

  -- Tags for filtering
  tags                  text[] NOT NULL DEFAULT '{}',

  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_academy ON classes(academy_id);
CREATE INDEX idx_classes_academy_day ON classes(academy_id, day_of_week);
CREATE INDEX idx_classes_instructor ON classes(default_instructor_id);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_tenant_isolation" ON classes
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 2.2 class_sessions

Individual occurrences of a class. Generated ahead of time or on demand.

```sql
CREATE TABLE class_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  class_id              uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  start_time            time NOT NULL,
  end_time              time NOT NULL,

  -- Can override instructor per session
  instructor_id         uuid REFERENCES members(id) ON DELETE SET NULL,

  -- Session outcome
  status                text NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  attendance_count      int NOT NULL DEFAULT 0,  -- denormalized for dashboards

  -- Instructor notes
  notes                 text,
  topic                 text,  -- what was taught today

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE(class_id, date)
);

CREATE INDEX idx_sessions_academy_date ON class_sessions(academy_id, date);
CREATE INDEX idx_sessions_instructor ON class_sessions(instructor_id);
CREATE INDEX idx_sessions_status ON class_sessions(academy_id, status, date);

ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_tenant_isolation" ON class_sessions
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 2.3 session_techniques

Links techniques taught in a specific session.

```sql
CREATE TABLE session_techniques (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id            uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  technique_id          uuid NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  sort_order            int NOT NULL DEFAULT 0,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE(session_id, technique_id)
);

CREATE INDEX idx_session_techniques_session ON session_techniques(session_id);

ALTER TABLE session_techniques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_techniques_tenant_isolation" ON session_techniques
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 3. Attendance

### 3.1 attendance

```sql
CREATE TABLE attendance (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id            uuid NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- How the check-in happened
  check_in_method       text NOT NULL DEFAULT 'manual'
                        CHECK (check_in_method IN (
                          'manual',        -- instructor marked
                          'self',          -- student self check-in
                          'qr_code',       -- QR scan
                          'geolocation'    -- GPS-based
                        )),
  checked_in_at         timestamptz NOT NULL DEFAULT now(),
  checked_in_by         uuid REFERENCES members(id),  -- who marked (null = self)

  -- Optional geolocation proof
  latitude              decimal(10, 7),
  longitude             decimal(10, 7),

  -- Rating / feedback from student
  rating                int CHECK (rating BETWEEN 1 AND 5),
  feedback              text,

  created_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE(session_id, member_id)
);

CREATE INDEX idx_attendance_academy ON attendance(academy_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_member ON attendance(academy_id, member_id);
CREATE INDEX idx_attendance_date ON attendance(academy_id, checked_in_at);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_tenant_isolation" ON attendance
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());

-- Trigger: update denormalized count on class_sessions
CREATE OR REPLACE FUNCTION update_attendance_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE class_sessions
    SET attendance_count = attendance_count + 1
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE class_sessions
    SET attendance_count = attendance_count - 1
    WHERE id = OLD.session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_attendance_count
  AFTER INSERT OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_attendance_count();
```

---

## 4. Check-Ins (Facility Access)

Separate from class attendance. Tracks when someone enters the academy.

### 4.1 check_ins

```sql
CREATE TABLE check_ins (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  checked_in_at         timestamptz NOT NULL DEFAULT now(),
  checked_out_at        timestamptz,

  -- Method
  method                text NOT NULL DEFAULT 'app'
                        CHECK (method IN ('app', 'qr_code', 'nfc', 'manual', 'kiosk')),

  -- Optional: auto-link to class session if timing matches
  session_id            uuid REFERENCES class_sessions(id),

  latitude              decimal(10, 7),
  longitude             decimal(10, 7),

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_academy ON check_ins(academy_id);
CREATE INDEX idx_checkins_member ON check_ins(academy_id, member_id);
CREATE INDEX idx_checkins_date ON check_ins(academy_id, checked_in_at);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_tenant_isolation" ON check_ins
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 5. Curriculum

### 5.1 techniques

```sql
CREATE TABLE techniques (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  name                  text NOT NULL,
  description           text,

  -- Classification
  position              text NOT NULL
                        CHECK (position IN (
                          'closed_guard', 'open_guard', 'half_guard',
                          'butterfly_guard', 'de_la_riva', 'spider_guard',
                          'lasso_guard', 'x_guard', 'single_leg_x',
                          'mount', 'side_control', 'back_control',
                          'knee_on_belly', 'turtle', 'standing',
                          'north_south', 'other'
                        )),
  category              text NOT NULL
                        CHECK (category IN (
                          'submission', 'sweep', 'pass', 'takedown',
                          'escape', 'transition', 'control', 'defense',
                          'counter', 'setup', 'drill'
                        )),
  sub_category          text,  -- e.g., "choke", "armlock", "leglock"

  -- Difficulty / belt mapping
  belt_level            text NOT NULL DEFAULT 'white',
  difficulty            int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),

  -- Content
  instructions          text,  -- markdown
  key_points            text[],  -- ["control the sleeve", "hip escape first"]

  -- Tags for search
  tags                  text[] NOT NULL DEFAULT '{}',

  is_published          boolean NOT NULL DEFAULT true,
  sort_order            int NOT NULL DEFAULT 0,

  created_by            uuid REFERENCES members(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_techniques_academy ON techniques(academy_id);
CREATE INDEX idx_techniques_position ON techniques(academy_id, position);
CREATE INDEX idx_techniques_category ON techniques(academy_id, category);
CREATE INDEX idx_techniques_belt ON techniques(academy_id, belt_level);
CREATE INDEX idx_techniques_tags ON techniques USING gin(tags);

ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "techniques_tenant_isolation" ON techniques
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 5.2 technique_media

```sql
CREATE TABLE technique_media (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  technique_id          uuid NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,

  media_type            text NOT NULL CHECK (media_type IN ('video', 'image', 'diagram')),
  url                   text NOT NULL,         -- Supabase Storage or external URL
  thumbnail_url         text,
  title                 text,
  duration_seconds      int,                   -- for videos
  sort_order            int NOT NULL DEFAULT 0,
  file_size_bytes       bigint,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technique_media_technique ON technique_media(technique_id);

ALTER TABLE technique_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "technique_media_tenant_isolation" ON technique_media
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 6. Billing & Payments

### 6.1 subscriptions

Academy-level subscription (academy pays BJJFlow).

```sql
CREATE TABLE subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id    text NOT NULL,
  stripe_price_id       text NOT NULL,

  plan                  text NOT NULL,
  status                text NOT NULL
                        CHECK (status IN (
                          'trialing', 'active', 'past_due',
                          'cancelled', 'unpaid', 'incomplete',
                          'incomplete_expired', 'paused'
                        )),

  currency              text NOT NULL,
  amount_cents          int NOT NULL,  -- monthly amount
  interval              text NOT NULL DEFAULT 'month'
                        CHECK (interval IN ('month', 'year')),

  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_end             timestamptz,
  cancel_at             timestamptz,
  cancelled_at          timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_academy ON subscriptions(academy_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_tenant_isolation" ON subscriptions
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 6.2 payments

Individual payment records synced from Stripe.

```sql
CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  subscription_id       uuid REFERENCES subscriptions(id),

  stripe_invoice_id     text UNIQUE,
  stripe_payment_intent_id text,
  stripe_charge_id      text,

  amount_cents          int NOT NULL,
  currency              text NOT NULL,
  status                text NOT NULL
                        CHECK (status IN (
                          'pending', 'succeeded', 'failed', 'refunded', 'disputed'
                        )),

  description           text,
  invoice_url           text,  -- Stripe hosted invoice link
  receipt_url           text,

  period_start          timestamptz,
  period_end            timestamptz,
  paid_at               timestamptz,
  refunded_at           timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_academy ON payments(academy_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(academy_id, status);
CREATE INDEX idx_payments_date ON payments(academy_id, paid_at);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_tenant_isolation" ON payments
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 6.3 student_plans

Student-level billing managed BY the academy (academy charges students).

```sql
CREATE TABLE student_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  plan_name             text NOT NULL,      -- "Monthly Unlimited", "2x/week"
  amount_cents          int NOT NULL,
  currency              text NOT NULL,
  billing_cycle         text NOT NULL DEFAULT 'monthly'
                        CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  classes_per_week      int,                -- null = unlimited

  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),

  starts_at             timestamptz NOT NULL DEFAULT now(),
  next_billing_at       timestamptz,
  ends_at               timestamptz,

  -- Payment method (managed by academy, not Stripe Connect)
  payment_method        text DEFAULT 'external'
                        CHECK (payment_method IN (
                          'external',  -- cash, PIX, bank transfer (academy handles)
                          'stripe'     -- future: Stripe Connect
                        )),
  notes                 text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_plans_academy ON student_plans(academy_id);
CREATE INDEX idx_student_plans_member ON student_plans(member_id);
CREATE INDEX idx_student_plans_status ON student_plans(academy_id, status);
CREATE INDEX idx_student_plans_billing ON student_plans(academy_id, next_billing_at);

ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_plans_tenant_isolation" ON student_plans
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 7. Notifications

### 7.1 notifications

```sql
CREATE TABLE notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  type                  text NOT NULL
                        CHECK (type IN (
                          -- Scheduling
                          'class_reminder', 'class_cancelled', 'class_rescheduled',
                          -- Attendance
                          'streak_milestone', 'attendance_low', 'welcome_back',
                          -- Belt
                          'promotion', 'stripe_earned',
                          -- Billing
                          'payment_due', 'payment_received', 'payment_overdue',
                          'plan_expiring',
                          -- Social
                          'new_member_welcome', 'birthday',
                          -- System
                          'academy_announcement', 'system_update',
                          -- AI
                          'ai_insight', 'ai_recommendation'
                        )),

  title                 text NOT NULL,
  body                  text NOT NULL,
  data                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { "session_id": "...", "action_url": "/schedule/..." }

  -- Delivery channels
  channel               text NOT NULL DEFAULT 'in_app'
                        CHECK (channel IN ('in_app', 'email', 'push', 'sms', 'whatsapp')),
  delivered_at          timestamptz,
  read_at               timestamptz,

  -- Priority for ordering
  priority              text NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Expiry (auto-dismiss old notifications)
  expires_at            timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_member ON notifications(academy_id, member_id);
CREATE INDEX idx_notifications_unread ON notifications(academy_id, member_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(academy_id, type);
CREATE INDEX idx_notifications_created ON notifications(academy_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_tenant_isolation" ON notifications
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 8. Automations

### 8.1 automations

Academy-configurable workflows (e.g., "send reminder 1h before class").

```sql
CREATE TABLE automations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  name                  text NOT NULL,
  description           text,

  -- Trigger
  trigger_type          text NOT NULL
                        CHECK (trigger_type IN (
                          'schedule',          -- cron-based
                          'event',             -- on event occurrence
                          'condition'          -- when condition met
                        )),
  trigger_config        jsonb NOT NULL,
  -- Schedule: { "cron": "0 8 * * 1-5" }
  -- Event: { "event": "member.created", "filters": { "role": "student" } }
  -- Condition: { "metric": "attendance_streak", "operator": ">=", "value": 10 }

  -- Action
  action_type           text NOT NULL
                        CHECK (action_type IN (
                          'send_notification',
                          'send_email',
                          'send_whatsapp',
                          'update_member_status',
                          'create_ai_insight',
                          'webhook'
                        )),
  action_config         jsonb NOT NULL,
  -- { "template": "class_reminder", "channel": "push", "timing": "-60min" }

  is_active             boolean NOT NULL DEFAULT true,

  -- Stats
  last_run_at           timestamptz,
  run_count             int NOT NULL DEFAULT 0,
  error_count           int NOT NULL DEFAULT 0,

  created_by            uuid REFERENCES members(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automations_academy ON automations(academy_id);
CREATE INDEX idx_automations_active ON automations(academy_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_automations_trigger ON automations(academy_id, trigger_type);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_tenant_isolation" ON automations
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 8.2 automation_runs

```sql
CREATE TABLE automation_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  automation_id         uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,

  status                text NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  affected_count        int NOT NULL DEFAULT 0,  -- how many members affected

  error_message         text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_date ON automation_runs(academy_id, started_at DESC);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_tenant_isolation" ON automation_runs
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 8.3 automation_logs

Per-member log entries within a run.

```sql
CREATE TABLE automation_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  run_id                uuid NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  member_id             uuid REFERENCES members(id) ON DELETE SET NULL,

  action                text NOT NULL,
  status                text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_logs_run ON automation_logs(run_id);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_logs_tenant_isolation" ON automation_logs
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 9. AI Insights

### 9.1 ai_insights

AI-generated observations and recommendations for the academy.

```sql
CREATE TABLE ai_insights (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,

  -- What the insight is about
  insight_type          text NOT NULL
                        CHECK (insight_type IN (
                          -- Retention
                          'churn_risk',              -- student likely to leave
                          'engagement_drop',         -- declining attendance
                          'reactivation_opportunity', -- inactive member showing signs

                          -- Performance
                          'promotion_ready',         -- student ready for next belt
                          'plateau_detected',        -- student stuck, needs new challenge
                          'overtraining_risk',       -- too many sessions, injury risk

                          -- Business
                          'revenue_trend',           -- MRR changes
                          'class_optimization',      -- under/over-attended classes
                          'peak_hour_shift',         -- attendance pattern changes
                          'instructor_impact',       -- instructor performance correlation

                          -- Curriculum
                          'technique_gap',           -- skill gap in student base
                          'popular_techniques',      -- trending techniques

                          -- General
                          'custom'
                        )),

  -- Targeting
  target_type           text NOT NULL DEFAULT 'academy'
                        CHECK (target_type IN ('academy', 'member', 'class', 'instructor')),
  target_id             uuid,  -- references the specific entity

  -- Content
  title                 text NOT NULL,
  summary               text NOT NULL,
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Structured data for the frontend to render rich cards
  -- e.g., { "member_name": "João", "attendance_30d": 3, "previous_30d": 12,
  --         "risk_score": 0.87, "suggested_actions": [...] }

  -- Scoring
  confidence            decimal(3, 2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  severity              text NOT NULL DEFAULT 'info'
                        CHECK (severity IN ('info', 'warning', 'critical')),
  priority_score        int NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),

  -- Status
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'dismissed', 'actioned', 'expired')),
  dismissed_by          uuid REFERENCES members(id),
  dismissed_at          timestamptz,

  -- AI metadata
  model_version         text,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_insights_academy ON ai_insights(academy_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(academy_id, insight_type);
CREATE INDEX idx_ai_insights_target ON ai_insights(academy_id, target_type, target_id);
CREATE INDEX idx_ai_insights_active ON ai_insights(academy_id, status)
  WHERE status = 'active';
CREATE INDEX idx_ai_insights_priority ON ai_insights(academy_id, priority_score DESC)
  WHERE status = 'active';

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insights_tenant_isolation" ON ai_insights
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

### 9.2 ai_insight_actions

Tracks what actions were taken on an insight (for AI feedback loop).

```sql
CREATE TABLE ai_insight_actions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  insight_id            uuid NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,

  action_type           text NOT NULL
                        CHECK (action_type IN (
                          'viewed', 'dismissed', 'actioned',
                          'shared', 'feedback_positive', 'feedback_negative'
                        )),
  action_by             uuid NOT NULL REFERENCES members(id),
  notes                 text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insight_actions_insight ON ai_insight_actions(insight_id);

ALTER TABLE ai_insight_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insight_actions_tenant_isolation" ON ai_insight_actions
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 10. Audit & System Tables

### 10.1 audit_log

Tracks all admin/instructor actions for compliance.

```sql
CREATE TABLE audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  actor_id              uuid NOT NULL REFERENCES members(id),

  action                text NOT NULL,
  -- e.g., "member.promoted", "class.created", "settings.updated"

  resource_type         text NOT NULL,
  resource_id           uuid,
  changes               jsonb,  -- { "before": {...}, "after": {...} }

  ip_address            inet,
  user_agent            text,

  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_academy ON audit_log(academy_id);
CREATE INDEX idx_audit_actor ON audit_log(academy_id, actor_id);
CREATE INDEX idx_audit_date ON audit_log(academy_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(academy_id, resource_type, resource_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_tenant_isolation" ON audit_log
  FOR ALL USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
```

---

## 11. Helper Functions

```sql
-- Extract academy_id from JWT
CREATE OR REPLACE FUNCTION get_current_academy_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'academy_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'academies', 'members', 'classes', 'class_sessions',
      'subscriptions', 'student_plans', 'automations', 'techniques'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
```

---

## 12. Indexing Strategy Summary

| Pattern | Index Type | Purpose |
|---|---|---|
| `academy_id` on every table | B-tree | Tenant isolation + partition readiness |
| `(academy_id, date)` | B-tree | Date-range queries (schedule, attendance) |
| `(academy_id, status)` | Partial B-tree | Active-only filtered scans |
| `tags` columns | GIN | Array containment queries |
| `(academy_id, member_id)` | B-tree | Member-scoped lookups |
| `(academy_id, created_at DESC)` | B-tree | Reverse-chrono feeds |
| `stripe_*_id` | B-tree UNIQUE | Webhook idempotency lookups |
| Partial indexes with `WHERE` | B-tree | Reduce index size for hot queries |

---

## 13. Entity Relationship Diagram (Text)

```
auth.users (Supabase managed)
  │
  ├── 1:N ── members ─── N:1 ── academies
  │              │
  │              ├── 1:N ── attendance
  │              ├── 1:N ── check_ins
  │              ├── 1:N ── member_belt_history
  │              ├── 1:N ── student_plans
  │              └── 1:N ── notifications
  │
  academies
  │
  ├── 1:N ── classes ──── 1:N ── class_sessions ── 1:N ── attendance
  │                                    │
  │                                    └── N:M ── techniques
  │                                          (via session_techniques)
  │
  ├── 1:N ── techniques ── 1:N ── technique_media
  │
  ├── 1:N ── subscriptions ── 1:N ── payments
  │
  ├── 1:N ── automations ── 1:N ── automation_runs ── 1:N ── automation_logs
  │
  ├── 1:N ── ai_insights ── 1:N ── ai_insight_actions
  │
  ├── 1:N ── invites
  │
  └── 1:N ── audit_log
```

---

## 14. Multi-Tenant Isolation Checklist

Every tenant-scoped table MUST have:

- [x] `academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE`
- [x] `CREATE INDEX idx_{table}_academy ON {table}(academy_id)`
- [x] `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY`
- [x] RLS policy using `get_current_academy_id()`
- [x] No cross-tenant JOINs possible through RLS

Tables WITHOUT RLS (by design):
- `academies` - queried before tenant context exists (slug lookup)
- `auth.users` - managed by Supabase Auth

Service role (bypasses RLS) used ONLY for:
- Stripe webhook handlers
- Cron jobs (subscription checks)
- Academy creation during onboarding
- Cross-tenant analytics (BJJFlow internal, never exposed)
