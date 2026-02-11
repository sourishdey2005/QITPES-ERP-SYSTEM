
-- QITPES ERP SYSTEM - PRODUCTION SCHEMA RECOVERY
-- TARGET: SUPABASE POSTGRESQL
-- VERSION: 2026.6 (Schema Cache Fix)

-- 1. CLEANUP (Careful: This drops tables to ensure fresh schema)
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CORE IDENTITY
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. HR & PAYROLL MODULES (Fixed full_name column)
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  status TEXT DEFAULT 'Active',
  gross_salary NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE payroll_records (
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

-- 5. OPERATIONS MODULES
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(15, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('Planning', 'Active', 'Completed', 'On Hold')) DEFAULT 'Planning',
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- 6. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Helper
CREATE OR REPLACE FUNCTION secure_table_for_authenticated(tbl TEXT) 
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "Full access for authenticated users" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Full access for authenticated users" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl);
END;
$$ LANGUAGE plpgsql;

SELECT secure_table_for_authenticated('profiles');
SELECT secure_table_for_authenticated('employees');
SELECT secure_table_for_authenticated('payroll_records');
SELECT secure_table_for_authenticated('projects');
SELECT secure_table_for_authenticated('finance_transactions');
SELECT secure_table_for_authenticated('assets');
SELECT secure_table_for_authenticated('fleet');

-- 7. REFRESH HINT
-- If you still see column missing errors, run: NOTIFY pgrst, 'reload schema';
