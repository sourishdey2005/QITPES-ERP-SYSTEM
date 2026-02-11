
-- QITPES ERP SYSTEM - COMPLETE PRODUCTION SCHEMA
-- TARGET: SUPABASE POSTGRESQL
-- VERSION: 2026.4

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. CORE IDENTITY
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
  budget NUMERIC(15, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('Planning', 'Active', 'Completed', 'On Hold')) DEFAULT 'Planning',
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
  stock_level NUMERIC(12, 2) DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  unit_price NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. FINANCIAL SUITE
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit NUMERIC(15, 2) DEFAULT 0,
  credit NUMERIC(15, 2) DEFAULT 0,
  balance NUMERIC(15, 2) DEFAULT 0,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  budget NUMERIC(15, 2) DEFAULT 0,
  spent NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_month TEXT NOT NULL,
  type TEXT CHECK (type IN ('GST', 'TDS', 'Income Tax')),
  cgst NUMERIC(15, 2) DEFAULT 0,
  sgst NUMERIC(15, 2) DEFAULT 0,
  igst NUMERIC(15, 2) DEFAULT 0,
  total_tax NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. HR & PAYROLL MODULES
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  status TEXT DEFAULT 'Active',
  gross_salary NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  pay_month TEXT NOT NULL,
  gross_amount NUMERIC(15, 2) NOT NULL,
  net_amount NUMERIC(15, 2) NOT NULL,
  status TEXT DEFAULT 'Paid',
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, pay_month)
);

CREATE TABLE IF NOT EXISTS okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  objective TEXT NOT NULL,
  owner_name TEXT,
  progress NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'On Track',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ASSET & LOGISTICS
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  site_location TEXT,
  engine_hours NUMERIC(12, 1) DEFAULT 0,
  fuel_level NUMERIC(5, 2) DEFAULT 0,
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

-- 7. SECURITY (RLS)
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Idempotent Policy Helper
CREATE OR REPLACE FUNCTION secure_table_for_authenticated(tbl TEXT) 
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "Access for authenticated users" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Full access for authenticated users" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Access for authenticated users" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl);
END;
$$ LANGUAGE plpgsql;

-- Apply Security to all tables
SELECT secure_table_for_authenticated('profiles');
SELECT secure_table_for_authenticated('projects');
SELECT secure_table_for_authenticated('planning_tasks');
SELECT secure_table_for_authenticated('inventory');
SELECT secure_table_for_authenticated('purchase_orders');
SELECT secure_table_for_authenticated('finance_transactions');
SELECT secure_table_for_authenticated('ledger_entries');
SELECT secure_table_for_authenticated('cost_centers');
SELECT secure_table_for_authenticated('tax_records');
SELECT secure_table_for_authenticated('employees');
SELECT secure_table_for_authenticated('payroll_records');
SELECT secure_table_for_authenticated('okrs');
SELECT secure_table_for_authenticated('assets');
SELECT secure_table_for_authenticated('fleet');

-- 8. AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'accounting'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
