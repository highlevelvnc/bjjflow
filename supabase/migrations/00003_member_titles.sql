-- ─────────────────────────────────────────────────────────────────────────────
-- Member Titles / Championships
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_titles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title         text NOT NULL,
  competition   text NOT NULL,
  category      text,
  weight_class  text,
  placement     text NOT NULL DEFAULT 'gold' CHECK (placement IN ('gold', 'silver', 'bronze', 'other')),
  date          date NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_titles_academy ON member_titles(academy_id);
CREATE INDEX idx_member_titles_member  ON member_titles(member_id);

-- RLS
ALTER TABLE member_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_titles_select" ON member_titles
  FOR SELECT USING (academy_id = get_current_academy_id());

CREATE POLICY "member_titles_insert" ON member_titles
  FOR INSERT WITH CHECK (academy_id = get_current_academy_id() AND is_academy_admin());

CREATE POLICY "member_titles_delete" ON member_titles
  FOR DELETE USING (academy_id = get_current_academy_id() AND is_academy_admin());
