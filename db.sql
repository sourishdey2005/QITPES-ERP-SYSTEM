
-- QITPES ERP SYSTEM - ENTERPRISE MASTER SCHEMA 2026
-- VERSION: 2026.13 (Global Integrity Edition)

-- 1. CORE IDENTITY
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'accounting',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT DEFAULT 'Internal',
  description TEXT,
  budget NUMERIC(15, 2) DEFAULT 0,
  estimated_cost NUMERIC(15, 2) DEFAULT 0,
  contract_value NUMERIC(15, 2) DEFAULT 0,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  completion_percentage NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FLEET & LOGISTICS
CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT DEFAULT 'Dump Truck',
  current_location TEXT,
  status TEXT DEFAULT 'Ready' CHECK (status IN ('Ready', 'In Transit', 'Maintenance', 'Returned')),
  last_work_details TEXT,
  last_odometer NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. WORKFLOW ENGINE
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  steps INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. FINANCE & LEDGER
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  client_id UUID REFERENCES projects(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  is_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_month TEXT NOT NULL,
  type TEXT DEFAULT 'GST',
  cgst NUMERIC(15, 2) DEFAULT 0,
  sgst NUMERIC(15, 2) DEFAULT 0,
  total_tax NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Filed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. HR & OKR
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  gross_salary NUMERIC(15, 2) DEFAULT 0,
  monthly_deductions NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  objective TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'In Progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Full Enterprise Access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON fleet FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON workflows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON finance_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON tax_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON okrs FOR ALL USING (auth.role() = 'authenticated');
