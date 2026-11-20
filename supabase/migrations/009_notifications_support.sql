-- ============================================================
-- Migration 009: Notifications and Support Tickets
-- ============================================================

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT ''info'' CHECK (type IN (
    ''info'', ''success'', ''warning'', ''error'', ''action_required''
  )),
  category     TEXT NOT NULL CHECK (category IN (
    ''registration'', ''application'', ''document'', ''quote'', ''policy'',
    ''renewal'', ''support'', ''referral'', ''system''
  )),
  -- Link to related entity
  entity_type  TEXT,     -- ''application'', ''policy'', ''document'', etc.
  entity_id    UUID,
  link_url     TEXT,
  -- Read status
  is_read      BOOLEAN NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,
  -- Delivery
  delivered_in_app   BOOLEAN NOT NULL DEFAULT false,
  delivered_email    BOOLEAN NOT NULL DEFAULT false,
  delivered_sms      BOOLEAN NOT NULL DEFAULT false,
  delivered_whatsapp BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- SUPPORT TICKETS
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   TEXT NOT NULL UNIQUE DEFAULT (''TKT-'' || TO_CHAR(NOW(), ''YYYY'') || ''-'' || LPAD(nextval(''ticket_number_seq'')::TEXT, 5, ''0'')),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  customer_id     UUID REFERENCES public.customers(id),
  agent_id        UUID REFERENCES public.agents(id),
  assigned_to     UUID REFERENCES auth.users(id),
  -- Related entity
  application_id  UUID REFERENCES public.applications(id),
  category        TEXT NOT NULL CHECK (category IN (
    ''payment'', ''application'', ''documents'', ''policy'', ''renewal'',
    ''quote'', ''technical'', ''other''
  )),
  subject         TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT ''medium'' CHECK (priority IN (''low'', ''medium'', ''high'', ''urgent'')),
  status          TEXT NOT NULL DEFAULT ''open'' CHECK (status IN (
    ''open'', ''assigned'', ''in_progress'', ''waiting_for_customer'', ''resolved'', ''closed''
  )),
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_assigned_to ON public.support_tickets(assigned_to);

CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SUPPORT MESSAGES
CREATE TABLE IF NOT EXISTS public.support_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  message     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,   -- internal notes not shown to customer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_ticket_id ON public.support_messages(ticket_id);
