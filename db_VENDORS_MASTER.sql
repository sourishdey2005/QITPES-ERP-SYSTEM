
-- QITPES VENDOR MASTER REGISTRY

CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT CHECK (category IN ('Material', 'Service', 'Subcontractor', 'Equipment')),
    gstin TEXT,
    pan TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    office_address TEXT,
    is_active BOOLEAN DEFAULT true,
    bank_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Migration: Update vendor_performance to link to vendors table if possible
-- For now, we will just ensure the vendors table exists for the new module.
-- ENABLE RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Allow All Access" ON vendors;
CREATE POLICY "Allow All Access" ON vendors FOR ALL USING (true) WITH CHECK (true);
