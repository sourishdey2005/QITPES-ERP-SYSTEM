
-- SQL SCRIPT: Fix Profile Creation on New User Sign-Up
-- This script makes the user creation trigger more resilient to prevent failures.

-- 1. Redefine the function with SECURITY DEFINER and ON CONFLICT handling
-- SECURITY DEFINER bypasses RLS, and ON CONFLICT prevents crashes from duplicate records.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Executes with superuser privileges
SET search_path = public
AS $$
BEGIN
  -- First, attempt to insert a pending profile. If it already exists, do nothing.
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'pending')
  ON CONFLICT (id) DO NOTHING; -- <<< THE CRITICAL FIX

  -- Second, create or update the user's status in the approval table.
  -- A new user starts as inactive, pending owner approval.
  INSERT INTO public.approved_users (id, email, full_name, role, is_active)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'accounting', false)
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name, -- Ensure name is updated if they re-register
    is_active = false; -- Ensure they are reset to pending if they re-register

  RETURN NEW;
END;
$$;

-- 2. Ensure the trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS Policy for reading profiles (no change, for reference)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. RLS Policy for inserting into approved_users (no change, for reference)
-- The trigger bypasses this, but it could be used by other parts of the app.
DROP POLICY IF EXISTS "Allow public registration requests" ON approved_users;
CREATE POLICY "Allow public registration requests" ON approved_users
  FOR INSERT
  WITH CHECK (
    is_active = false AND approved_by IS NULL
  );

-- Notify that the script has been updated
-- (You would run this script in your Supabase SQL editor)
-- SELECT 'Successfully updated the handle_new_user trigger and policies.';
