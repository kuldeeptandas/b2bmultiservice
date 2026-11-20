-- ==============================================================
-- B2B Multi-Service Portal - Supabase Database Schema
-- Run this script in your Supabase Project -> SQL Editor -> Run
-- ==============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    tracking_number TEXT NOT NULL UNIQUE,
    service_id TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_title TEXT NOT NULL,
    user_id TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT NOT NULL,
    applicant_email TEXT,
    business_name TEXT,
    user_role TEXT NOT NULL DEFAULT 'customer',
    agent_code TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    points_paid INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by tracking number and user
CREATE INDEX IF NOT EXISTS idx_applications_tracking ON public.applications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- 3. Portal Services Configurator Table
CREATE TABLE IF NOT EXISTS public.portal_services (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    base_points_cost INTEGER NOT NULL DEFAULT 0,
    base_agent_commission INTEGER NOT NULL DEFAULT 0,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles & Wallet Balance
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- matches auth.users uid or custom id
    email TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'agent' | 'admin'
    business_name TEXT,
    agent_code TEXT,
    wallet_points INTEGER NOT NULL DEFAULT 2500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'credit' | 'debit'
    amount_points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_id TEXT,
    tracking_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);

-- 6. Disable Row Level Security (RLS) for public access or enable open policy
-- Since this is an internal B2B multi-service portal with preset roles, 
-- we allow read/write via the anon key for seamless operations.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Open policies for anon key (safe for prototype / internal B2B portal)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon all on applications" ON public.applications;
    DROP POLICY IF EXISTS "Allow anon all on portal_services" ON public.portal_services;
    DROP POLICY IF EXISTS "Allow anon all on profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow anon all on wallet_transactions" ON public.wallet_transactions;
END $$;

CREATE POLICY "Allow anon all on applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on portal_services" ON public.portal_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on wallet_transactions" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed Initial Demo Applications (if empty)
INSERT INTO public.applications (
    id, tracking_number, service_id, service_category, service_title, user_id, 
    applicant_name, applicant_phone, user_role, status, points_paid, remarks, created_at, updated_at
) VALUES 
('app-seed-01', 'TRK-INS-33214', 'insurance-commercial', 'insurance', 'Commercial Vehicle Comprehensive & TP', 'cust-harman-101', 'Harman Preet', '+91 98765-43210', 'customer', 'Completed', 1850, 'Policy schedule issued. IRDAI verified copy dispatched.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('app-seed-02', 'TRK-LOAN-44102', 'loan-business', 'loan', 'Business Loan (MSME Credit)', 'agent-jaspreet-202', 'Jaspreet Singh (Punjab Partner)', '+91 98140-12345', 'agent', 'Approved', 499, 'HDFC Bank credit committee approved ₹15,00,000 disbursement.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('app-seed-03', 'TRK-GST-55193', 'gst-services', 'gst', 'GST Registration & Monthly Filing', 'cust-harman-101', 'Harman Preet', '+91 98765-43210', 'customer', 'Approved', 999, 'GSTIN allotted: 03AABCG1234F1Z8. Certificate downloaded.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('app-seed-04', 'TRK-MSME-66201', 'msme-udyam', 'msme', 'MSME Udyam Registration Certificate', 'agent-jaspreet-202', 'Jaspreet Singh (Punjab Partner)', '+91 98140-12345', 'agent', 'Completed', 499, 'Official 19-Digit Udyam certificate generated with QR Code.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (tracking_number) DO NOTHING;

-- 8. Real-time Replication (Optional - allows live status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_services;
