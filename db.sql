
-- QITPES ERP SYSTEM - ENTERPRISE BI SCHEMA (30-KPI OPTIMIZED)
-- VERSION: 2026.9

-- 1. CORE IDENTITY
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'accounting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. PROJECTS (Client & Overrun tracking)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT DEFAULT 'Internal',
  description TEXT,
  budget NUMERIC(15, 2) DEFAULT 0,
  estimated_cost NUMERIC(15, 2) DEFAULT 0,
  contract_value NUMERIC(15, 2) DEFAULT 0,
  paid_amount NUMERIC(15, 2) DEFAULT 0, -- For Contractor Status
  completion_percentage NUMERIC(5, 2) DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FINANCE (Double-entry & Aging)
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  fixed_cost NUMERIC(15, 2) DEFAULT 0,
  variable_cost NUMERIC(15, 2) DEFAULT 0, -- For Break-even
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  client_id UUID REFERENCES projects(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  is_paid BOOLEAN DEFAULT true,
  invoice_number TEXT, -- For Fraud Detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. INVENTORY (Turnover & Reorder)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  opening_stock NUMERIC(12, 2) DEFAULT 0,
  purchased_qty NUMERIC(12, 2) DEFAULT 0,
  sold_qty NUMERIC(12, 2) DEFAULT 0,
  stock_level NUMERIC(12, 2) DEFAULT 0,
  reorder_level NUMERIC(12, 2) DEFAULT 100,
  unit_price NUMERIC(12, 2) DEFAULT 0,
  cogs NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ASSETS (Depreciation & Telemetry)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  purchase_cost NUMERIC(15, 2) DEFAULT 0,
  useful_life INTEGER DEFAULT 5, -- Years
  engine_hours NUMERIC(12, 1) DEFAULT 0,
  downtime_hours NUMERIC(12, 1) DEFAULT 0,
  maintenance_cost NUMERIC(15, 2) DEFAULT 0,
  fuel_used NUMERIC(12, 2) DEFAULT 0,
  distance_traveled NUMERIC(12, 2) DEFAULT 0,
  planned_output NUMERIC(12, 2) DEFAULT 100,
  actual_output NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'Healthy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. HR & PERFORMANCE
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  gross_salary NUMERIC(15, 2) DEFAULT 0,
  attendance_rate NUMERIC(5, 2) DEFAULT 100,
  labour_hours NUMERIC(10, 2) DEFAULT 0,
  output_units NUMERIC(10, 2) DEFAULT 0, -- For Labour Productivity
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access" ON finance_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access" ON inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access" ON assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access" ON employees FOR ALL USING (auth.role() = 'authenticated');
