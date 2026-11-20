-- ============================================================
-- Migration 002: User Profiles, Customers, Agents
-- ============================================================

-- Extended user profile (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  mobile         TEXT,
  email          TEXT,
  avatar_url     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_suspended   BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, mobile)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'mobile', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_number TEXT NOT NULL UNIQUE,  -- CUST-2026-000001
  full_name       TEXT NOT NULL,
  mobile          TEXT NOT NULL,
  email           TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  address_line1   TEXT,
  address_line2   TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  referral_code   TEXT UNIQUE,           -- REF-ABC123 (this customer's code)
  referred_by_code TEXT,                 -- referral code used during registration
  referred_by_id  UUID REFERENCES public.customers(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  kyc_status      TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_mobile ON public.customers(mobile);
CREATE INDEX idx_customers_referral_code ON public.customers(referral_code);

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AGENTS
CREATE TABLE IF NOT EXISTS public.agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_number    TEXT NOT NULL UNIQUE,  -- AGT-2026-000001
  full_name       TEXT NOT NULL,
  mobile          TEXT NOT NULL,
  email           TEXT,
  agency_name     TEXT,
  address_line1   TEXT,
  address_line2   TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  agent_code      TEXT UNIQUE,           -- REF-AGT123 (agent's referral code)
  referred_by_code TEXT,
  manager_id      UUID REFERENCES public.agents(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_suspended    BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  total_customers  INT NOT NULL DEFAULT 0,
  total_applications INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_mobile ON public.agents(mobile);
CREATE INDEX idx_agents_agent_code ON public.agents(agent_code);

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEQUENCE helpers for human-readable numbers
CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS agent_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CUST-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('customer_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_agent_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'AGT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('agent_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
