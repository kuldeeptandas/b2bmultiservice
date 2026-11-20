-- ============================================================
-- Migration 005: Document Types and Documents
-- ============================================================

-- DOCUMENT TYPES (admin configurable)
CREATE TABLE IF NOT EXISTS public.document_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,     -- rc_front, rc_back, prev_policy, id_proof, etc.
  display_name TEXT NOT NULL,
  description  TEXT,
  is_required  BOOLEAN NOT NULL DEFAULT false,
  vehicle_type TEXT CHECK (vehicle_type IN (''bike'', ''car'', ''both'')),
  allowed_mimes TEXT[] NOT NULL DEFAULT ARRAY[''application/pdf'', ''image/jpeg'', ''image/png'', ''image/jpg''],
  max_size_mb  INT NOT NULL DEFAULT 5,
  display_order INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER document_types_updated_at BEFORE UPDATE ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default document types
INSERT INTO public.document_types (name, display_name, description, is_required, vehicle_type, display_order) VALUES
  (''rc_front'',       ''RC Front'',                 ''Registration Certificate (Front side)'',     true,  ''both'', 1),
  (''rc_back'',        ''RC Back'',                  ''Registration Certificate (Back side)'',      false, ''both'', 2),
  (''prev_policy'',    ''Previous Insurance Policy'', ''Previous insurance policy document'',        false, ''both'', 3),
  (''id_proof'',       ''Identity Proof'',            ''Aadhaar, PAN, Passport, Driving Licence'',   false, ''both'', 4),
  (''address_proof'',  ''Address Proof'',             ''Utility bill, bank statement, etc.'',        false, ''both'', 5),
  (''other'',          ''Other Document'',            ''Any other supporting document'',             false, ''both'', 6)
ON CONFLICT (name) DO NOTHING;

-- DOCUMENTS (private storage, never public)
CREATE TABLE IF NOT EXISTS public.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  agent_id        UUID REFERENCES public.agents(id),
  document_type_id UUID NOT NULL REFERENCES public.document_types(id),
  uploader_id     UUID NOT NULL REFERENCES auth.users(id),
  -- Storage info (never expose raw paths to clients without auth check)
  original_filename TEXT NOT NULL,
  storage_bucket  TEXT NOT NULL DEFAULT ''documents'',
  storage_path    TEXT NOT NULL,       -- internal path in private bucket
  mime_type       TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  -- Verification
  status          TEXT NOT NULL DEFAULT ''uploaded'' CHECK (status IN (
    ''uploaded'', ''under_review'', ''verified'', ''rejected'', ''reupload_required'', ''archived''
  )),
  verified_by     UUID REFERENCES auth.users(id),
  verified_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Security
  checksum_sha256 TEXT,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  archive_reason  TEXT,
  archived_by     UUID REFERENCES auth.users(id),
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_documents_customer_id ON public.documents(customer_id);
CREATE INDEX idx_documents_status ON public.documents(status);

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
