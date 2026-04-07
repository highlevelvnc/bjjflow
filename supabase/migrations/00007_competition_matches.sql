-- ============================================================================
-- BJJFlow — Competition Matches
-- ============================================================================
-- Stores individual matches that compose a competition entry (member_titles).
-- Inspired by Abu Dhabi / IBJJF brackets — each title can have N matches with
-- the result, the method (submission/points/decision/dq) and the score.
--
-- Example for a "Ouro" title with 3 fights:
--   Match 1 → win by submission (arm-lock)
--   Match 2 → win by points 2-2 (advantage)
--   Match 3 → win by submission (rear-naked-choke)
-- ============================================================================

CREATE TABLE public.competition_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  title_id        uuid NOT NULL REFERENCES public.member_titles(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Round in the bracket (1 = first fight, 2 = second, ...)
  match_order     integer NOT NULL DEFAULT 1,

  -- Result of the match
  result          text NOT NULL
                  CHECK (result IN ('win', 'loss', 'draw')),

  -- How the match was won/lost
  method          text NOT NULL
                  CHECK (method IN (
                    'submission',
                    'points',
                    'advantage',
                    'penalty',
                    'decision',
                    'dq',
                    'wo'
                  )),

  -- For submissions: arm-lock, rear-naked-choke, triangle, kimura, etc.
  -- For points: free text optional notes ("dominância na guarda")
  submission_type text,

  -- Score (when method = points or advantage)
  points_for      integer,
  points_against  integer,
  advantages_for  integer,
  advantages_against integer,

  -- Time when the finish/result happened (e.g. "2:14")
  finish_time     text,

  opponent_name   text,
  opponent_team   text,

  notes           text,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_competition_matches_title    ON public.competition_matches (title_id, match_order);
CREATE INDEX idx_competition_matches_member   ON public.competition_matches (academy_id, member_id);
CREATE INDEX idx_competition_matches_academy  ON public.competition_matches (academy_id);

ALTER TABLE public.competition_matches ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: a member only sees matches from their own academy
CREATE POLICY competition_matches_select
  ON public.competition_matches
  FOR SELECT
  TO authenticated
  USING (academy_id = get_current_academy_id());

-- Only academy admins/instructors can insert matches
CREATE POLICY competition_matches_insert
  ON public.competition_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  );

CREATE POLICY competition_matches_update
  ON public.competition_matches
  FOR UPDATE
  TO authenticated
  USING (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  )
  WITH CHECK (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  );

CREATE POLICY competition_matches_delete
  ON public.competition_matches
  FOR DELETE
  TO authenticated
  USING (
    academy_id = get_current_academy_id()
    AND is_academy_admin()
  );
