-- ============================================================================
-- BJJFlow — Billing Schema Alignment + Payment Block
-- ============================================================================
-- 1. Aligns the student_plans columns with what the tRPC router expects
--    (the original 00001 schema diverged from the code).
-- 2. Adds `block_after_days_overdue` to academies so admins can configure
--    automatic check-in/portal blocking when payments are overdue.
-- ============================================================================

-- ─── 1. STUDENT_PLANS column rename + retype ────────────────────────────────

-- Drop old CHECK constraints (constraint names follow PG convention)
ALTER TABLE public.student_plans
  DROP CONSTRAINT IF EXISTS student_plans_billing_cycle_check,
  DROP CONSTRAINT IF EXISTS student_plans_payment_method_check,
  DROP CONSTRAINT IF EXISTS student_plans_status_check;

-- Rename columns to match router/types
ALTER TABLE public.student_plans RENAME COLUMN plan_name TO name;
ALTER TABLE public.student_plans RENAME COLUMN starts_at TO start_date;
ALTER TABLE public.student_plans RENAME COLUMN ends_at  TO end_date;

-- Convert timestamptz → date
ALTER TABLE public.student_plans
  ALTER COLUMN start_date TYPE date USING start_date::date,
  ALTER COLUMN start_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN end_date   TYPE date USING end_date::date;

-- Add price (numeric) + created_by
ALTER TABLE public.student_plans
  ADD COLUMN IF NOT EXISTS price      numeric(10,2),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- Backfill price from amount_cents
UPDATE public.student_plans SET price = amount_cents / 100.0 WHERE price IS NULL;
ALTER TABLE public.student_plans ALTER COLUMN price SET NOT NULL;

-- Drop legacy columns no longer used
ALTER TABLE public.student_plans
  DROP COLUMN IF EXISTS amount_cents,
  DROP COLUMN IF EXISTS classes_per_week,
  DROP COLUMN IF EXISTS next_billing_at;

-- New CHECK constraints matching the application
ALTER TABLE public.student_plans
  ADD CONSTRAINT student_plans_billing_cycle_check
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual', 'one_time'));

-- Update default before changing the constraint
ALTER TABLE public.student_plans ALTER COLUMN payment_method SET DEFAULT 'pix';
UPDATE public.student_plans
   SET payment_method = 'pix'
 WHERE payment_method NOT IN ('cash', 'pix', 'stripe', 'other');

ALTER TABLE public.student_plans
  ADD CONSTRAINT student_plans_payment_method_check
    CHECK (payment_method IN ('cash', 'pix', 'stripe', 'other'));

UPDATE public.student_plans SET status = 'cancelled' WHERE status = 'past_due';

ALTER TABLE public.student_plans
  ADD CONSTRAINT student_plans_status_check
    CHECK (status IN ('active', 'paused', 'cancelled'));


-- ─── 2. ACADEMIES — payment block configuration ─────────────────────────────

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS block_after_days_overdue int NOT NULL DEFAULT 7;

COMMENT ON COLUMN public.academies.block_after_days_overdue IS
  '0 = never block. >0 = block check-in and student portal access if any payment is overdue by at least this many days.';
