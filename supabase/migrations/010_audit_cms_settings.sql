-- ============================================================
-- Migration 010: Audit Logs, CMS, FAQs, Settings
-- ============================================================

-- AUDIT LOGS (append-only security log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  user_email  TEXT,
  user_role   TEXT,
  action      TEXT NOT NULL,      -- ''document.view'', ''policy.upload'', ''quote.override'', etc.
  module      TEXT NOT NULL,
  record_id   UUID,
  record_type TEXT,               -- ''application'', ''policy'', ''document'', etc.
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Prevent deletion of audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- CMS PAGES
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,   -- ''home'', ''about'', ''faq'', ''terms'', ''privacy'', etc.
  title        TEXT NOT NULL,
  meta_title   TEXT,
  meta_description TEXT,
  content      JSONB NOT NULL DEFAULT ''{}''::JSONB,  -- structured content blocks
  hero_image   TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER cms_pages_updated_at BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed CMS pages
INSERT INTO public.cms_pages (slug, title, meta_title, meta_description, is_published) VALUES
  (''home'', ''Home'', ''MotorSeva - Car & Bike Third-Party Insurance Assistance'', ''Apply for motor third-party insurance assistance for your car or bike.'', true),
  (''about'', ''About Us'', ''About MotorSeva'', ''Learn about MotorSeva and our insurance assistance services.'', true),
  (''faq'', ''Frequently Asked Questions'', ''FAQ - MotorSeva'', ''Common questions about motor third-party insurance.'', true),
  (''contact'', ''Contact Us'', ''Contact MotorSeva'', ''Get in touch with us for insurance assistance.'', true),
  (''privacy-policy'', ''Privacy Policy'', ''Privacy Policy - MotorSeva'', ''Our privacy policy and data protection practices.'', true),
  (''terms-and-conditions'', ''Terms & Conditions'', ''Terms & Conditions - MotorSeva'', ''Terms and conditions of using MotorSeva portal.'', true),
  (''insurance-disclosure'', ''Insurance Disclosure'', ''Insurance Disclosure - MotorSeva'', ''Important disclosures about our insurance assistance services.'', true),
  (''grievance'', ''Grievance / Support'', ''Grievance & Support - MotorSeva'', ''Grievance redressal and support information.'', true)
ON CONFLICT (slug) DO NOTHING;

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT ''general'',
  display_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SETTINGS (key-value store for admin-configurable settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key          TEXT PRIMARY KEY,
  value        TEXT,
  value_json   JSONB,
  data_type    TEXT NOT NULL DEFAULT ''string'' CHECK (data_type IN (''string'', ''number'', ''boolean'', ''json'')),
  category     TEXT NOT NULL DEFAULT ''general'',
  description  TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT false,  -- can be exposed to frontend
  updated_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default settings
INSERT INTO public.settings (key, value, data_type, category, description, is_public) VALUES
  (''site_name'', ''MotorSeva'', ''string'', ''general'', ''Portal display name'', true),
  (''site_tagline'', ''Car & Bike Third-Party Insurance Assistance'', ''string'', ''general'', ''Homepage tagline'', true),
  (''maintenance_mode'', ''false'', ''boolean'', ''general'', ''Enable maintenance mode'', false),
  (''quote_validity_days'', ''30'', ''number'', ''quotation'', ''Number of days a quote is valid'', false),
  (''max_file_size_mb'', ''10'', ''number'', ''documents'', ''Maximum document upload size in MB'', true),
  (''renewal_reminder_days'', ''60,30,15,7,3,1'', ''string'', ''renewals'', ''Comma-separated days before expiry for reminders'', false),
  (''payu_enabled'', ''false'', ''boolean'', ''payment'', ''Enable PayU payment gateway'', false),
  (''email_enabled'', ''false'', ''boolean'', ''notifications'', ''Enable email notifications'', false),
  (''sms_enabled'', ''false'', ''boolean'', ''notifications'', ''Enable SMS notifications'', false),
  (''whatsapp_enabled'', ''false'', ''boolean'', ''notifications'', ''Enable WhatsApp notifications'', false)
ON CONFLICT (key) DO NOTHING;
