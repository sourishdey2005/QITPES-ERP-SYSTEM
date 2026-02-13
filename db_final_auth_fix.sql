
-- FINAL DATABASE SYNC & AUTH FIX
-- Run this in Supabase SQL Editor to fix the "Database Error" and "Login Reset" issues.

-- 1. Ensure profiles table has email column (required by some triggers)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Fix the New User Trigger to NOT reset approved status
-- This trigger will now respect existing approved_users records added by the owner.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_is_active BOOLEAN;
BEGIN
  -- Check if owner already pre-approved this email
  SELECT role, is_active INTO v_role, v_is_active 
  FROM public.approved_users 
  WHERE email = NEW.email;

  -- Create/Update profile
  -- Use the pre-approved role if available, otherwise use metadata or default
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    NEW.email, 
    COALESCE(v_role, NEW.raw_user_meta_data->>'role', 'accounting')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  -- Ensure they exist in approved_users table
  -- If they were added by owner, this DO NOTHING preserves is_active = true
  INSERT INTO public.approved_users (email, full_name, role, is_active)
  VALUES (
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    COALESCE(v_role, NEW.raw_user_meta_data->>'role', 'accounting'), 
    false -- Start as false only if completely new
  )
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Update RLS policies to be more permissive for the system master email
-- This ensures the owner can ALWAYS manage users even if profile syncing lags.

-- Approved Users RLS
DROP POLICY IF EXISTS "Owners can add approved users" ON approved_users;
CREATE POLICY "Owners can add approved users" ON approved_users
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'abhradeephazra99@gmail.com'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owners can view all approved users" ON approved_users;
CREATE POLICY "Owners can view all approved users" ON approved_users
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'abhradeephazra99@gmail.com'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owners can update approved users" ON approved_users;
CREATE POLICY "Owners can update approved users" ON approved_users
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'abhradeephazra99@gmail.com'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- 4. Ensure the owner's own record is correctly set
UPDATE approved_users SET role = 'owner', is_active = true WHERE email = 'abhradeephazra99@gmail.com';
UPDATE profiles SET role = 'owner' WHERE email = 'abhradeephazra99@gmail.com';

-- 5. Revoke public registration inserts (we moved to owner-only)
DROP POLICY IF EXISTS "Allow public registration requests" ON approved_users;
