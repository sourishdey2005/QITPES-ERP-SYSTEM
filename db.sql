
-- QITPES ERP - DATABASE FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Ensure the enum exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'director', 'accounting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure profiles table is ready
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'accounting',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. UPDATED Defensize Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role user_role := 'accounting';
  chosen_role_text text;
  final_role user_role;
BEGIN
  -- Extract role from metadata safely
  chosen_role_text := new.raw_user_meta_data->>'role';
  
  -- Map string to enum safely
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

-- 4. Re-bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Ensure RLS doesn't block the trigger (Trigger runs as DEFINER, but let's be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for service role" ON profiles;
CREATE POLICY "Enable all access for service role" ON profiles FOR ALL USING (true);
