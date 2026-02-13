
-- QITPES CONTRACTS & SUBCONTRACT MANAGEMENT SUITE

-- 1. CLIENT CONTRACT REPOSITORY
CREATE TABLE IF NOT EXISTS client_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contract_number TEXT UNIQUE NOT NULL,
    contract_date DATE DEFAULT CURRENT_DATE,
    total_value NUMERIC(15,2) DEFAULT 0,
    scope_of_work TEXT,
    retention_percentage NUMERIC(5,2) DEFAULT 5.0,
    performance_guarantee NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. SUBCONTRACTOR WORK ORDERS
CREATE TABLE IF NOT EXISTS subcontracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    subcontractor_name TEXT NOT NULL,
    work_order_number TEXT UNIQUE NOT NULL,
    wo_date DATE DEFAULT CURRENT_DATE,
    wo_value NUMERIC(15,2) DEFAULT 0,
    service_tax_applicable BOOLEAN DEFAULT true,
    retention_percentage NUMERIC(5,2) DEFAULT 5.0,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RUNNING ACCOUNT (RA) BILLS
CREATE TABLE IF NOT EXISTS running_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_type TEXT CHECK (contract_type IN ('Client', 'Subcontractor')),
    contract_id UUID NOT NULL, -- Logical link to client_contracts or subcontracts
    bill_number TEXT NOT NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    gross_amount NUMERIC(15,2) DEFAULT 0,
    retention_deduction NUMERIC(15,2) DEFAULT 0,
    tds_deduction NUMERIC(15,2) DEFAULT 0,
    other_deductions NUMERIC(15,2) DEFAULT 0,
    net_payable NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Certified', 'Paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. VARIATION ORDERS (SCOPE CHANGES)
CREATE TABLE IF NOT EXISTS variation_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id UUID NOT NULL, -- Link to client_contracts or subcontracts
    vo_number TEXT NOT NULL,
    vo_date DATE DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    impact_value NUMERIC(15,2) DEFAULT 0, -- Positive for extra, negative for deduction
    approval_status TEXT DEFAULT 'Draft' CHECK (approval_status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. CONTRACT CLAIMS
CREATE TABLE IF NOT EXISTS contract_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id UUID NOT NULL,
    claim_number TEXT NOT NULL,
    claim_type TEXT CHECK (claim_type IN ('EOT', 'Extra Item', 'Price Escalation', 'Direct Loss')),
    value NUMERIC(15,2) DEFAULT 0,
    justification TEXT,
    status TEXT DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'In negotiation', 'Settled', 'Rejected')),
    settled_value NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RETENTION & SECURITY MONITORING
CREATE TABLE IF NOT EXISTS security_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL,
    deposit_type TEXT CHECK (deposit_type IN ('EMD', 'Security Deposit', 'Retention Money', 'Performance Bond')),
    amount NUMERIC(15,2) DEFAULT 0,
    release_date DATE,
    is_released BOOLEAN DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;

-- POLICIES (Allow All for ERP Internal Sync)
CREATE POLICY "Allow All Access" ON client_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON subcontracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON running_bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON variation_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON contract_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON security_deposits FOR ALL USING (true) WITH CHECK (true);
