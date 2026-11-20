-- ============================================================
-- Migration 003: Vehicles and Insurance Companies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_type        TEXT NOT NULL CHECK (vehicle_type IN (''bike'', ''car'')),
  registration_number TEXT NOT NULL,
  make                TEXT,
  model               TEXT,
  variant             TEXT,
  fuel_type           TEXT CHECK (fuel_type IN (''petrol'', ''diesel'', ''electric'', ''cng'', ''lpg'', ''hybrid'')),
  engine_cc           INT,
  manufacturing_year  INT,
  registration_date   DATE,
  chassis_number      TEXT,
  engine_number       TEXT,
  registered_owner    TEXT,
  color               TEXT,
  -- RC document info
  rc_extracted_data   JSONB,              -- raw OCR output
  rc_verified         BOOLEAN NOT NULL DEFAULT false,
  rc_verified_by      UUID REFERENCES auth.users(id),
  rc_verified_at      TIMESTAMPTZ,
  -- Insurance info
  existing_insurer    TEXT,
  existing_policy_number TEXT,
  policy_expiry_date  DATE,
  ncb_status          TEXT,              -- No Claim Bonus
  -- Metadata
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX idx_vehicles_registration ON public.vehicles(registration_number);
CREATE INDEX idx_vehicles_type ON public.vehicles(vehicle_type);

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INSURANCE COMPANIES (informational directory only -- not partners unless explicitly authorized)
CREATE TABLE IF NOT EXISTS public.insurance_companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  short_name   TEXT,
  logo_url     TEXT,
  website_url  TEXT,
  description  TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  is_featured  BOOLEAN NOT NULL DEFAULT false,
  -- Note: is_partner MUST only be set by Super Admin after genuine authorized arrangement
  is_partner   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER insurance_companies_updated_at BEFORE UPDATE ON public.insurance_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
