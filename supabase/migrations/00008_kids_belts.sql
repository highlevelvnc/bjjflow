-- ─────────────────────────────────────────────────────────────────────────────
-- 00008_kids_belts.sql
-- Add IBJJF kids belts to the members.belt_rank CHECK constraint, and as a
-- side benefit fix a pre-existing silent bug: the original constraint was
-- missing 'red_black', so any attempt to set that adult belt errored at the
-- database even though the app's tRPC enum allowed it.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the (incomplete) old constraint. Use IF EXISTS so this migration is
-- idempotent across environments where the constraint may have been renamed
-- or already replaced.
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_belt_rank_check;

-- Recreate with the full belt list: 9 adult + 12 kids-only (white is shared
-- and only listed once).
ALTER TABLE members ADD CONSTRAINT members_belt_rank_check
  CHECK (belt_rank IN (
    -- adult progression
    'white', 'blue', 'purple', 'brown', 'black',
    'coral', 'red_black', 'red_white', 'red',
    -- kids progression (white shared with adult)
    'gray_white', 'gray', 'gray_black',
    'yellow_white', 'yellow', 'yellow_black',
    'orange_white', 'orange', 'orange_black',
    'green_white', 'green', 'green_black'
  ));

-- NOTE: member_belt_history.belt_rank intentionally has NO check constraint.
-- It stores historical snapshots and we don't want a future schema change
-- to fail historical inserts retroactively.
