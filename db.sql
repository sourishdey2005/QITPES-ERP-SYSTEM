
-- QITPES ERP - FINANCIAL ENGINE EXPANSION
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. FINANCE TRANSACTIONS (For Finance.tsx)
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TAX RECORDS (For TaxEngine.tsx)
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_month TEXT NOT NULL,
  type TEXT CHECK (type IN ('GST', 'TDS', 'Income Tax')),
  cgst NUMERIC DEFAULT 0,
  sgst NUMERIC DEFAULT 0,
  igst NUMERIC DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DROP POLICY IF EXISTS "Full access for authenticated users" ON finance_transactions;
CREATE POLICY "Full access for authenticated users" ON finance_transactions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON tax_records;
CREATE POLICY "Full access for authenticated users" ON tax_records FOR ALL USING (auth.role() = 'authenticated');
