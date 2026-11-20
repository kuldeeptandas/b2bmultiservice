-- ============================================================
-- Migration 007: Policies and Renewals
-- ============================================================

-- POLICIES
-- CRITICAL: A policy record can ONLY contain a genuine PDF uploaded by authorized admin.
-- The system NEVER generates fake policy numbers or fabricated insurer details.
CREATE TABLE IF NOT EXISTS public.policies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE RESTRICT,
  customer_id      UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  agent_id         UUID REFERENCES public.agents(id),
  vehicle_id       UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  quote_id         UUID REFERENCES public.quotes(id),
  -- Insurer details (supplied by admin from actual policy document, never fabricated)
  policy_number    TEXT,             -- from actual insurer document
  insurer_name     TEXT,             -- from actual insurer document
  insurer_code     TEXT,
  policy_type      TEXT NOT NULL DEFAULT ''third_party'',
  vehicle_type     TEXT NOT NULL,
  -- Policy dates (from actual insurer document)
  policy_start_date DATE,
  policy_expiry_date DATE,
  -- Document (genuine PDF uploaded by admin only)
  storage_bucket   TEXT DEFAULT ''policies'',
  storage_path     TEXT,            -- internal path in private bucket
  original_filename TEXT,
  file_size_bytes  BIGINT,
  -- Status
  status           TEXT NOT NULL DEFAULT ''processing'' CHECK (status IN (
    ''processing'', ''issued'', ''active'', ''expired'', ''cancelled'', ''replaced''
  )),
  -- Upload tracking
  uploaded_by      UUID REFERENCES auth.users(id),
  uploaded_at      TIMESTAMPTZ,
  -- Policy replacement tracking (security: previous docs never silently deleted)
  is_replaced      BOOLEAN NOT NULL DEFAULT false,
  replaced_by      UUID REFERENCES public.policies(id),
  replacement_reason TEXT,
  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policies_application_id ON public.policies(application_id);
CREATE INDEX idx_policies_customer_id ON public.policies(customer_id);
CREATE INDEX idx_policies_vehicle_id ON public.policies(vehicle_id);
CREATE INDEX idx_policies_expiry ON public.policies(policy_expiry_date);
CREATE INDEX idx_policies_status ON public.policies(status);

CREATE TRIGGER policies_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RENEWALS
CREATE TABLE IF NOT EXISTS public.renewals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id        UUID NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
  customer_id      UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_id       UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  agent_id         UUID REFERENCES public.agents(id),
  -- Renewal application (if created)
  renewal_application_id UUID REFERENCES public.applications(id),
  -- Reminder schedule
  reminder_60_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_30_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_15_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_7_sent  BOOLEAN NOT NULL DEFAULT false,
  reminder_3_sent  BOOLEAN NOT NULL DEFAULT false,
  reminder_1_sent  BOOLEAN NOT NULL DEFAULT false,
  -- Status
  status           TEXT NOT NULL DEFAULT ''pending'' CHECK (status IN (
    ''pending'', ''reminded'', ''applied'', ''completed'', ''expired'', ''cancelled''
  )),
  expiry_date      DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_renewals_policy_id ON public.renewals(policy_id);
CREATE INDEX idx_renewals_expiry ON public.renewals(expiry_date);
CREATE INDEX idx_renewals_customer_id ON public.renewals(customer_id);

CREATE TRIGGER renewals_updated_at BEFORE UPDATE ON public.renewals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
