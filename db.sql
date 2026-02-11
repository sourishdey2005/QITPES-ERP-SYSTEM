
-- QITPES ERP - ROBUST DATABASE INITIALIZATION
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create Role Enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure Multi-tenancy Tables exist
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

-- 3. Create/Repair Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all enterprise columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- 4. Robust Auth Trigger Function
-- SET search_path is critical for SECURITY DEFINER functions in Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  default_role user_role := 'accounting';
  chosen_role_text text;
  final_role user_role;
BEGIN
  -- 1. Extract role from metadata
  chosen_role_text := new.raw_user_meta_data->>'role';
  
  -- 2. Map string to enum safely
  IF chosen_role_text = 'owner' THEN
    final_role := 'owner';
  ELSIF chosen_role_text = 'director' THEN
    final_role := 'director';
  ELSIF chosen_role_text = 'accounting' THEN
    final_role := 'accounting';
  ELSE
    final_role := default_role;
  END IF;

  -- 3. Insert or Update profile
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
    role = EXCLUDED.role,
    updated_at = now();

  RETURN new;
END;
$$;

-- 5. Re-bind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Enable RLS and set default policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Grant access to the trigger
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
