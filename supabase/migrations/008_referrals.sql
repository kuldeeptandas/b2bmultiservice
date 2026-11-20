-- ============================================================
-- Migration 008: Referrals and Earnings
-- ============================================================

-- REFERRAL CLICKS (click attribution before registration)
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  referrer_type TEXT NOT NULL CHECK (referrer_type IN (''customer'', ''agent'')),
  referrer_id   UUID,            -- customer_id or agent_id
  ip_address    TEXT,
  user_agent    TEXT,
  landing_page  TEXT,
  session_id    TEXT,
  converted     BOOLEAN NOT NULL DEFAULT false,
  converted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_converted ON public.referral_clicks(converted);

-- REFERRALS (registration attribution)
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code   TEXT NOT NULL,
  referrer_type   TEXT NOT NULL CHECK (referrer_type IN (''customer'', ''agent'')),
  referrer_id     UUID NOT NULL,
  referee_type    TEXT NOT NULL CHECK (referee_type IN (''customer'', ''agent'')),
  referee_id      UUID NOT NULL,
  click_id        UUID REFERENCES public.referral_clicks(id),
  -- Conversion tracking
  registration_at TIMESTAMPTZ,
  first_application_at TIMESTAMPTZ,
  first_quote_at  TIMESTAMPTZ,
  conversion_at   TIMESTAMPTZ,  -- when a policy was completed
  status          TEXT NOT NULL DEFAULT ''registered'' CHECK (status IN (
    ''registered'', ''applied'', ''quoted'', ''converted'', ''expired''
  )),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);

CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REFERRAL CONVERSIONS
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id     UUID NOT NULL REFERENCES public.referrals(id) ON DELETE RESTRICT,
  application_id  UUID REFERENCES public.applications(id),
  policy_id       UUID REFERENCES public.policies(id),
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (''registration'', ''application'', ''quote'', ''policy_completed'')),
  converted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EARNINGS LEDGER (configurable reward amounts, no actual payout/transfer in MVP)
CREATE TABLE IF NOT EXISTS public.earnings_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  user_type       TEXT NOT NULL CHECK (user_type IN (''customer'', ''agent'')),
  referral_id     UUID REFERENCES public.referrals(id),
  conversion_id   UUID REFERENCES public.referral_conversions(id),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT ''INR'',
  entry_type      TEXT NOT NULL CHECK (entry_type IN (''credit'', ''debit'', ''hold'', ''released'', ''cancelled'')),
  description     TEXT NOT NULL,
  -- Payout status (no actual payout in MVP -- configurable)
  payout_status   TEXT NOT NULL DEFAULT ''pending'' CHECK (payout_status IN (''pending'', ''approved'', ''paid'', ''rejected'', ''cancelled'')),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_user_id ON public.earnings_ledger(user_id);
CREATE INDEX idx_earnings_referral_id ON public.earnings_ledger(referral_id);
