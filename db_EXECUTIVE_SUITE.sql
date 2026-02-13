
-- QITPES EXECUTIVE MONITORING SUITE - DATABASE LAYER

-- 1. COMPANY TARGETS (Monthly/Annual)
CREATE TABLE IF NOT EXISTS company_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    revenue_target NUMERIC(15,2) DEFAULT 0,
    profit_target NUMERIC(15,2) DEFAULT 0,
    new_contracts_target INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Achieved', 'Missed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TENDER PIPELINE TRACKING
CREATE TABLE IF NOT EXISTS tenders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_no TEXT UNIQUE NOT NULL,
    authority_name TEXT NOT NULL,
    description TEXT,
    estimated_value NUMERIC(15,2) DEFAULT 0,
    bid_submission_date DATE,
    technical_status TEXT DEFAULT 'Preparation' CHECK (technical_status IN ('Preparation', 'Submitted', 'Qualified', 'Disqualified')),
    financial_status TEXT DEFAULT 'Pending' CHECK (financial_status IN ('Pending', 'L1', 'L2', 'L3', 'Lost')),
    probability_percentage INTEGER DEFAULT 50,
    assigned_manager UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PROJECT RISK HEATMAP DATA
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    risk_title TEXT NOT NULL,
    description TEXT,
    impact_level INTEGER CHECK (impact_level BETWEEN 1 AND 5), -- 1: Low, 5: Critical
    probability_level INTEGER CHECK (probability_level BETWEEN 1 AND 5),
    mitigation_plan TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Mitigated', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed some initial targets for 2026
INSERT INTO company_targets (period_start, period_end, revenue_target, profit_target, new_contracts_target)
VALUES ('2026-01-01', '2026-12-31', 50000000, 15000000, 12)
ON CONFLICT DO NOTHING;

-- Seed a sample tender
INSERT INTO tenders (tender_no, authority_name, description, estimated_value, bid_submission_date, technical_status, financial_status, probability_percentage)
VALUES ('TND/2026/088', 'NHAI Highway Authority', 'Smart Toll Integration Phase 4', 12500000, '2026-04-15', 'Submitted', 'Pending', 75)
ON CONFLICT DO NOTHING;
