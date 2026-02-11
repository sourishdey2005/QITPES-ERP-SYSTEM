-- QITPES ERP - FULL ROBUST SCHEMA MIGRATION
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. MULTI-TENANCY CORE
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gstin TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'Standard' CHECK (subscription_tier IN ('Standard', 'Premium', 'Enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  is_headquarters BOOLEAN DEFAULT false
);

-- 3. PROFILES (The core user table)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was already there
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- 4. AUTH TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role user_role := 'accounting';
  chosen_role_text text;
  final_role user_role;
BEGIN
  -- Extract role from metadata safely
  chosen_role_text := new.raw_user_meta_data->>'role';
  
  -- Map string to enum safely with a fallback
  CASE chosen_role_text
    WHEN 'owner' THEN final_role := 'owner';
    WHEN 'director' THEN final_role := 'director';
    WHEN 'accounting' THEN final_role := 'accounting';
    ELSE final_role := default_role;
  END CASE;

  -- Insert profile with conflict handling
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'ERP User'),
    final_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER BINDING
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. PERMISSION SYSTEM
CREATE TABLE IF NOT EXISTS permission_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false
);

-- 7. PROJECTS & OPERATIONS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Planning',
  budget NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure company_id exists on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 8. WORKFLOW & APPROVAL ENGINE
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  trigger_module TEXT NOT NULL,
  trigger_condition JSONB,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_role user_role,
  sla_hours INTEGER DEFAULT 24
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  record_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  requested_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. FINANCE
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT,
  amount NUMERIC(15, 2),
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure company_id exists on finance
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 10. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Clean and recreate policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Tenant Data Isolation" ON projects;
DROP POLICY IF EXISTS "Finance Isolation" ON finance_transactions;
DROP POLICY IF EXISTS "Service Role Access" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Tenant Data Isolation" ON projects FOR ALL USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) 
  OR company_id IS NULL -- Allow view if not assigned yet
);
CREATE POLICY "Finance Isolation" ON finance_transactions FOR ALL USING (
  company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  OR company_id IS NULL
);
CREATE POLICY "Service Role Access" ON profiles FOR ALL USING (true);

-- 11. INITIAL DATA
INSERT INTO permission_matrix (role, module, can_view, can_create, can_edit, can_delete, can_approve) VALUES
('owner', 'finance', true, true, true, true, true),
('owner', 'hr', true, true, true, true, true),
('director', 'finance', true, false, false, false, true),
('accounting', 'finance', true, true, true, false, false)
ON CONFLICT DO NOTHING;
