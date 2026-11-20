-- ============================================================
-- Migration 004: Pricing Rules, Applications, Status History
-- ============================================================

-- PRICING RULES (admin-configurable, no code change needed)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  vehicle_type    TEXT NOT NULL CHECK (vehicle_type IN (''bike'', ''car'', ''both'')),
  -- Matching criteria (NULL = any)
  make            TEXT,           -- exact match, NULL = any
  model           TEXT,           -- exact match, NULL = any
  cc_min          INT,            -- engine CC range start
  cc_max          INT,            -- engine CC range end
  age_min         INT,            -- vehicle age in years (from reg year)
  age_max         INT,            -- vehicle age in years
  fuel_type       TEXT,           -- petrol, diesel, etc, NULL = any
  -- Pricing
  base_amount     NUMERIC(10,2) NOT NULL CHECK (base_amount >= 0),
  default_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (default_discount_pct >= 0 AND default_discount_pct <= 100),
  max_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 50
    CHECK (max_discount_pct >= 0 AND max_discount_pct <= 100),
  -- Priority: higher priority wins when multiple rules match
  priority        INT NOT NULL DEFAULT 0,
  -- Validity
  valid_from      DATE,
  valid_until     DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rules_vehicle_type ON public.pricing_rules(vehicle_type);
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(is_active);

CREATE TRIGGER pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPLICATIONS
CREATE SEQUENCE IF NOT EXISTS application_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TEXT AS $$
BEGIN
  RETURN ''APP-'' || TO_CHAR(NOW(), ''YYYY'') || ''-'' || LPAD(nextval(''application_number_seq'')::TEXT, 6, ''0'');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number  TEXT NOT NULL UNIQUE DEFAULT public.generate_application_number(),
  customer_id         UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  agent_id            UUID REFERENCES public.agents(id),
  vehicle_id          UUID REFERENCES public.vehicles(id),
  vehicle_type        TEXT NOT NULL CHECK (vehicle_type IN (''bike'', ''car'')),
  insurance_type      TEXT NOT NULL DEFAULT ''third_party'',
  -- Status workflow:
  -- draft -> submitted -> document_review -> documents_verified -> processing
  -- -> policy_ready -> policy_uploaded -> completed
  -- Alternative: document_rejected, reupload_required, cancelled, failed
  status              TEXT NOT NULL DEFAULT ''draft'' CHECK (status IN (
    ''draft'', ''submitted'', ''document_review'', ''documents_verified'',
    ''processing'', ''policy_ready'', ''policy_uploaded'', ''completed'',
    ''document_rejected'', ''reupload_required'', ''cancelled'', ''failed''
  )),
  -- Internal admin notes (never shown to customer unless published)
  internal_notes      TEXT,
  cancellation_reason TEXT,
  submitted_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_customer_id ON public.applications(customer_id);
CREATE INDEX idx_applications_agent_id ON public.applications(agent_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_vehicle_id ON public.applications(vehicle_id);

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPLICATION STATUS HISTORY (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  old_status      TEXT,
  new_status      TEXT NOT NULL,
  changed_by      UUID REFERENCES auth.users(id),
  reason          TEXT,
  is_customer_visible BOOLEAN NOT NULL DEFAULT false,
  note            TEXT,    -- admin/operator internal note
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_status_history_app_id ON public.application_status_history(application_id);
