-- ============================================================
-- Migration 001: Roles and Permissions
-- ============================================================

-- ROLES
CREATE TABLE IF NOT EXISTS public.roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description  TEXT,
  is_system    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PERMISSIONS
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  module      TEXT NOT NULL,
  action      TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROLE <> PERMISSIONS mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- USER <> ROLES mapping
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seed system roles
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('customer',      'Customer',        'End customer applying for insurance',           true),
  ('agent',         'Agent',           'Approved agent assisting customers',            true),
  ('support_admin', 'Support Admin',   'Handles support tickets',                       true),
  ('ops_admin',     'Operations Admin','Processes applications and uploads policies',   true),
  ('finance_admin', 'Finance Admin',   'Financial reports and ledger access',           true),
  ('agent_manager', 'Agent Manager',   'Manages agents',                                true),
  ('content_admin', 'Content Admin',   'Manages CMS content',                           true),
  ('super_admin',   'Super Admin',     'Full unrestricted system access',               true)
ON CONFLICT (name) DO NOTHING;
