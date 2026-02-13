
-- QITPES FINANCE & ACCOUNTS SUITE

-- 1. CLIENT INVOICING & GST INTEGRATION
CREATE TABLE IF NOT EXISTS client_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    taxable_amount NUMERIC(15,2) DEFAULT 0,
    gst_percentage NUMERIC(5,2) DEFAULT 18.0,
    gst_amount NUMERIC(15,2) GENERATED ALWAYS AS (taxable_amount * gst_percentage / 100) STORED,
    total_amount NUMERIC(15,2) GENERATED ALWAYS AS (taxable_amount + (taxable_amount * gst_percentage / 100)) STORED,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
    gst_type TEXT CHECK (gst_type IN ('IGST', 'CGST/SGST')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. CASHFLOW FORECASTING
CREATE TABLE IF NOT EXISTS cashflow_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forecast_month DATE NOT NULL,
    projected_inflow NUMERIC(15,2) DEFAULT 0,
    projected_outflow NUMERIC(15,2) DEFAULT 0,
    actual_inflow NUMERIC(15,2) DEFAULT 0,
    actual_outflow NUMERIC(15,2) DEFAULT 0,
    variance NUMERIC(15,2) GENERATED ALWAYS AS ((projected_inflow - projected_outflow) - (actual_inflow - actual_outflow)) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. LEDGER & TRANSACTION JOURNAL
CREATE TABLE IF NOT EXISTS general_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_date DATE DEFAULT CURRENT_DATE,
    account_name TEXT NOT NULL,
    description TEXT,
    debit NUMERIC(15,2) DEFAULT 0,
    credit NUMERIC(15,2) DEFAULT 0,
    reference_type TEXT, -- 'Invoice', 'Bill', 'Salaries', etc.
    reference_id UUID,
    cost_center_id UUID REFERENCES cost_centers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Allow All Access" ON client_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON cashflow_forecasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON general_ledger FOR ALL USING (true) WITH CHECK (true);
