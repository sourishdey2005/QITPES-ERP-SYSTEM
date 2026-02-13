
-- QITPES BUSINESS DEVELOPMENT & TENDERING SUITE

-- 1. RATE ANALYSIS MASTER LIBRARY
CREATE TABLE IF NOT EXISTS rate_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_description TEXT NOT NULL,
    unit TEXT DEFAULT 'Unit',
    material_cost NUMERIC(15,2) DEFAULT 0,
    labor_cost NUMERIC(15,2) DEFAULT 0,
    markup_percentage NUMERIC(5,2) DEFAULT 15.00,
    total_rate NUMERIC(15,2) GENERATED ALWAYS AS ((material_cost + labor_cost) * (1 + markup_percentage/100)) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. BOQ (Bill of Quantities) ESTIMATION
CREATE TABLE IF NOT EXISTS boq_estimates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES rate_analysis(id),
    quantity NUMERIC(15,3) DEFAULT 0,
    item_rate NUMERIC(15,2) NOT NULL,
    total_amount NUMERIC(15,2) GENERATED ALWAYS AS (quantity * item_rate) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. COMPETITOR ANALYSIS
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    competitor_name TEXT NOT NULL,
    quoted_amount NUMERIC(15,2),
    technical_score NUMERIC(5,2),
    strengths TEXT,
    weaknesses TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. BID APPROVAL WORKFLOW
CREATE TABLE IF NOT EXISTS bid_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES profiles(id),
    approver_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewing', 'Approved', 'Rejected')),
    comments TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Extension to tenders table for tracking
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS boq_status TEXT DEFAULT 'Draft' CHECK (boq_status IN ('Draft', 'Estimated', 'Finalized'));
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS bid_validity_days INTEGER DEFAULT 90;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS emd_amount NUMERIC(15,2) DEFAULT 0;
