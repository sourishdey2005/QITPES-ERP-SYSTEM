-- QITPES ERP SYSTEM - MASTER PRODUCTION SCHEMA
-- TARGET: Supabase PostgreSQL
-- PROJECT ID: asvkyztwnjgeajoyccuo

-- 0. INITIAL SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE IDENTITY: PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. OPERATIONS: PROJECTS & PLANNING
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Completed', 'On Hold', 'Cancelled')),
  budget NUMERIC(15, 2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  status TEXT DEFAULT 'Todo',
  priority TEXT DEFAULT 'Medium'
);

-- 4. PROCUREMENT: VENDORS & POs
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  gst_number TEXT,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  project_id UUID REFERENCES projects(id),
  total_amount NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ASSETS & LOGISTICS
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- Machinery, Fleet, IT
  status TEXT DEFAULT 'Operational'
);

CREATE TABLE IF NOT EXISTS vehicle_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  driver_name TEXT,
  log_date DATE DEFAULT CURRENT_DATE,
  fuel_cost NUMERIC(10, 2)
);

-- 6. FINANCE & LEDGER
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  balance NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. HR & PAYROLL
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT,
  designation TEXT,
  salary NUMERIC(15, 2),
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Present'
);

-- 8. SYSTEM & AUDIT
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Owners manage all projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'director'))
);
CREATE POLICY "Accounting manage finance" ON finance_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'accounting'))
);

-- 10. AUTOMATION: TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'ERP User'), 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'accounting'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_finance_project ON finance_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);