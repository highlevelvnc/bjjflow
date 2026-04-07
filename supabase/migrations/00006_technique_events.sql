-- ============================================================================
-- BJJFlow — Technique Events (Student Performance)
-- ============================================================================
-- Tracks each attempt / success / submission a student executes per technique.
-- Used to power the student performance radar dashboard at /aluno/performance.
--
-- The 6 MVP techniques are referenced by `technique_slug` (a stable
-- identifier) so we don't pollute the academy's `techniques` catalog table.
-- ============================================================================

CREATE TABLE public.technique_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Stable slug identifier (e.g. 'arm-triangle', 'rear-naked-choke').
  -- The display name (PT-BR) is mapped on the client.
  technique_slug text NOT NULL,

  event_type    text NOT NULL
                CHECK (event_type IN ('attempt', 'success', 'submission')),

  -- Optional context (free text — round, partner, notes)
  notes         text,

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technique_events_member  ON public.technique_events (academy_id, member_id, created_at DESC);
CREATE INDEX idx_technique_events_slug    ON public.technique_events (academy_id, technique_slug);
CREATE INDEX idx_technique_events_type    ON public.technique_events (academy_id, event_type);

ALTER TABLE public.technique_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY technique_events_tenant_isolation
  ON public.technique_events
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
