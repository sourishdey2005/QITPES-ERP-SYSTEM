
-- QITPES CRM (CUSTOMER RELATIONSHIP MANAGEMENT) SUITE

-- 1. CLIENTS / CUSTOMERS
CREATE TABLE IF NOT EXISTS crm_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    category TEXT DEFAULT 'Standard' CHECK (category IN ('Standard', 'Premium', 'VIP', 'Government')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Lead')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. LEADS / OPPORTUNITIES
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC(15,2) DEFAULT 0,
    source TEXT,
    stage TEXT DEFAULT 'Discovery' CHECK (stage IN ('Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost')),
    probability INTEGER DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
    assigned_to UUID REFERENCES profiles(id),
    expected_closing DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. INTERACTION LOGS
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
    interaction_type TEXT DEFAULT 'Call' CHECK (interaction_type IN ('Call', 'Email', 'Meeting', 'Note')),
    details TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    logged_by UUID REFERENCES profiles(id)
);

-- 4. CONTRACTS / DOCUMENTS
CREATE TABLE IF NOT EXISTS crm_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
    contract_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    value NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'active', 'expired', 'terminated')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
