-- ============================================================================
-- BJJFlow — Missing Tables Migration
-- ============================================================================
-- Creates 7 tables that are referenced by tRPC routers but were not included
-- in the original 00001_schema.sql migration:
--   1. announcements
--   2. contracts
--   3. events
--   4. inventory_items
--   5. inventory_transactions
--   6. student_payments
--   7. webhooks
--
-- Each table includes:
--   - RLS ENABLE + tenant isolation policies (same pattern as 00002_rls.sql)
--   - updated_at trigger where applicable
--   - Indexes on academy_id and key foreign keys
-- ============================================================================


-- ============================================================================
-- 1. ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE public.announcements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  title           text NOT NULL,
  content         text NOT NULL,
  priority        text NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('normal', 'important', 'urgent')),
  pinned          boolean NOT NULL DEFAULT false,

  -- Author (instructor/admin who created it)
  author_id       uuid REFERENCES public.members(id) ON DELETE SET NULL,

  published_at    timestamptz,
  expires_at      timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_academy    ON public.announcements (academy_id);
CREATE INDEX idx_announcements_published  ON public.announcements (academy_id, published_at DESC);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_tenant_isolation
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 2. CONTRACTS
-- ============================================================================

CREATE TABLE public.contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  title           text NOT NULL,
  content         text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'cancelled')),

  signed_at       timestamptz,
  signature_data  text,          -- base64 signature image or JSON
  signer_ip       text,
  expires_at      timestamptz,

  created_by      uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_academy    ON public.contracts (academy_id);
CREATE INDEX idx_contracts_member     ON public.contracts (member_id);
CREATE INDEX idx_contracts_status     ON public.contracts (academy_id, status);

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contracts_tenant_isolation
  ON public.contracts
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 3. EVENTS
-- ============================================================================

CREATE TABLE public.events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id            uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  title                 text NOT NULL,
  description           text,
  event_type            text NOT NULL DEFAULT 'other'
                        CHECK (event_type IN ('seminar', 'competition', 'social', 'workshop', 'other')),

  start_date            date NOT NULL,
  end_date              date,
  start_time            time,
  end_time              time,

  location              text,
  is_public             boolean NOT NULL DEFAULT false,
  max_participants      int,
  registration_required boolean NOT NULL DEFAULT false,

  created_by            uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_academy     ON public.events (academy_id);
CREATE INDEX idx_events_date        ON public.events (academy_id, start_date);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_tenant_isolation
  ON public.events
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 4. INVENTORY_ITEMS
-- ============================================================================

CREATE TABLE public.inventory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  name                text NOT NULL,
  description         text,
  category            text NOT NULL DEFAULT 'other'
                      CHECK (category IN ('kimono', 'belt', 'rashguard', 'shorts', 'accessory', 'other')),

  price_cents         int NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'BRL',
  stock_quantity      int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,

  sku                 text,
  image_url           text,
  is_active           boolean NOT NULL DEFAULT true,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_items_academy  ON public.inventory_items (academy_id);
CREATE INDEX idx_inventory_items_active   ON public.inventory_items (academy_id, is_active);

CREATE TRIGGER trg_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_tenant_isolation
  ON public.inventory_items
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 5. INVENTORY_TRANSACTIONS
-- ============================================================================

CREATE TABLE public.inventory_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  item_id       uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,

  type          text NOT NULL
                CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity      int NOT NULL,

  member_id     uuid REFERENCES public.members(id) ON DELETE SET NULL,
  price_cents   int,
  notes         text,
  created_by    uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_transactions_academy   ON public.inventory_transactions (academy_id);
CREATE INDEX idx_inv_transactions_item      ON public.inventory_transactions (item_id);
CREATE INDEX idx_inv_transactions_member    ON public.inventory_transactions (member_id);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_transactions_tenant_isolation
  ON public.inventory_transactions
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 6. STUDENT_PAYMENTS
-- ============================================================================

CREATE TABLE public.student_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  plan_id         uuid NOT NULL REFERENCES public.student_plans(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  amount          numeric(10,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'BRL',
  payment_method  text NOT NULL DEFAULT 'pix'
                  CHECK (payment_method IN ('cash', 'pix', 'stripe', 'other')),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),

  due_date        date NOT NULL,
  paid_at         timestamptz,

  -- PIX integration
  pix_code        text,
  pix_qr_data     text,

  notes           text,
  recorded_by     uuid REFERENCES public.members(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_payments_academy   ON public.student_payments (academy_id);
CREATE INDEX idx_student_payments_member    ON public.student_payments (member_id);
CREATE INDEX idx_student_payments_plan      ON public.student_payments (plan_id);
CREATE INDEX idx_student_payments_status    ON public.student_payments (academy_id, status);
CREATE INDEX idx_student_payments_due       ON public.student_payments (academy_id, due_date);

CREATE TRIGGER trg_student_payments_updated_at
  BEFORE UPDATE ON public.student_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_payments_tenant_isolation
  ON public.student_payments
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());


-- ============================================================================
-- 7. WEBHOOKS
-- ============================================================================

CREATE TABLE public.webhooks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id        uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,

  url               text NOT NULL,
  secret            text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events            text[] NOT NULL DEFAULT '{}',
  is_active         boolean NOT NULL DEFAULT true,

  last_triggered_at timestamptz,
  last_status_code  int,
  failure_count     int NOT NULL DEFAULT 0,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhooks_academy   ON public.webhooks (academy_id);
CREATE INDEX idx_webhooks_active    ON public.webhooks (academy_id, is_active);

CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhooks_tenant_isolation
  ON public.webhooks
  FOR ALL
  TO authenticated
  USING (academy_id = get_current_academy_id())
  WITH CHECK (academy_id = get_current_academy_id());
