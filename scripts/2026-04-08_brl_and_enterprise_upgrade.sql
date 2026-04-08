-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-04-08 — BRL backfill + manual enterprise upgrade
--
-- One-off operational script. NOT a migration — do NOT add it to the
-- supabase/migrations/ folder. Run it once against the production
-- database (Supabase SQL editor or `psql`) and then leave it in scripts/
-- as documentation.
--
-- Two unrelated changes packaged together because they were requested in
-- the same conversation:
--
--  1. Backfill any existing inventory_items rows that were created with
--     `currency = 'USD'`. The app was defaulting new items to USD due to
--     a bug in the tRPC router (already fixed in code), but the rows
--     written before the fix still need to be updated. The schema column
--     already defaults to 'BRL', so any future inserts are safe.
--
--  2. Upgrade the academy belonging to user 968e3094-2cfc-4dac-8ec5-2448ed9629a2
--     (murilo@rochateam.com) to the top-tier `enterprise` plan for testing.
--
-- Both blocks are written to be idempotent and side-effect free if run
-- twice — re-running just produces 0 affected rows.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. Inventory currency backfill ────────────────────────────────────────

-- Show what we're about to change so the run is auditable in the SQL log.
SELECT
  COUNT(*) AS rows_to_fix,
  array_agg(DISTINCT academy_id) AS affected_academies
FROM inventory_items
WHERE currency = 'USD';

UPDATE inventory_items
   SET currency = 'BRL'
 WHERE currency = 'USD';

-- ─── 2. Upgrade murilo@rochateam.com's academy to enterprise ───────────────
--
-- The user → academy resolution path is:
--   auth.users(id)  →  members(user_id)  →  members(academy_id)  →  academies(id)
--
-- A user can belong to multiple academies in theory, so we resolve all
-- linked academies and update them. In practice this user owns one.
--
-- We DELIBERATELY do not touch `stripe_customer_id` or
-- `stripe_subscription_id` — those are managed by the Stripe webhook.
-- Setting `plan` directly is enough to unlock the top-tier features
-- because the gating reads `academies.plan`.

WITH target_academies AS (
  SELECT DISTINCT m.academy_id
  FROM members m
  WHERE m.user_id = '968e3094-2cfc-4dac-8ec5-2448ed9629a2'
)
UPDATE academies a
   SET plan = 'enterprise',
       updated_at = NOW()
  FROM target_academies t
 WHERE a.id = t.academy_id
   AND a.plan IS DISTINCT FROM 'enterprise'
RETURNING a.id, a.name, a.plan;

-- Sanity check: confirm the user resolved to at least one academy. If
-- this returns 0 rows, the user UUID was wrong and the UPDATE above did
-- nothing — bail out before committing.
DO $$
DECLARE
  resolved_count int;
BEGIN
  SELECT COUNT(DISTINCT academy_id)
    INTO resolved_count
    FROM members
   WHERE user_id = '968e3094-2cfc-4dac-8ec5-2448ed9629a2';

  IF resolved_count = 0 THEN
    RAISE EXCEPTION
      'No academy found for user 968e3094-2cfc-4dac-8ec5-2448ed9629a2 — '
      'check the UUID and try again. Aborting transaction.';
  END IF;

  RAISE NOTICE 'Resolved % academy/academies for the target user.', resolved_count;
END $$;

COMMIT;
