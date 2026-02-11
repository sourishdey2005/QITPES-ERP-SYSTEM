
-- QITPES ERP - FULL ENTERPRISE SCHEMA INITIALIZATION
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. OPERATIONS MODULES
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Planning',
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  due_date DATE,
  owner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  stock_level NUMERIC DEFAULT 0,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status_type TEXT DEFAULT 'Info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. FINANCE MODULES
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. HR MODULES
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  status TEXT DEFAULT 'Active',
  gross_salary NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  objective TEXT NOT NULL,
  owner_name TEXT,
  progress NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'On Track',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ASSET MODULES
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  site_location TEXT,
  engine_hours NUMERIC DEFAULT 0,
  fuel_level NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Healthy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT,
  current_location TEXT,
  status TEXT DEFAULT 'Ready',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  steps INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DROP POLICY IF EXISTS "Full access for authenticated users" ON profiles;
CREATE POLICY "Full access for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON projects;
CREATE POLICY "Full access for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON inventory;
CREATE POLICY "Full access for authenticated users" ON inventory FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON ledger_entries;
CREATE POLICY "Full access for authenticated users" ON ledger_entries FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON employees;
CREATE POLICY "Full access for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON purchase_orders;
CREATE POLICY "Full access for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON production_logs;
CREATE POLICY "Full access for authenticated users" ON production_logs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON planning_tasks;
CREATE POLICY "Full access for authenticated users" ON planning_tasks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON cost_centers;
CREATE POLICY "Full access for authenticated users" ON cost_centers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON okrs;
CREATE POLICY "Full access for authenticated users" ON okrs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON assets;
CREATE POLICY "Full access for authenticated users" ON assets FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON fleet;
CREATE POLICY "Full access for authenticated users" ON fleet FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Full access for authenticated users" ON workflows;
CREATE POLICY "Full access for authenticated users" ON workflows FOR ALL USING (auth.role() = 'authenticated');
