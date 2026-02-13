
-- SQL SCRIPT: Fix Profile Creation on New User Sign-Up
-- This script addresses a common issue where the handle_new_user trigger
-- fails due to RLS policies, preventing profiles from being created.

-- 1. Redefine the function with SECURITY DEFINER
-- This makes the function execute with the permissions of the user who defined it (postgres),
-- bypassing the RLS limitations of the calling user (anon/authenticated role).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- <<< THE CRITICAL FIX
SET search_path = public
AS $$
BEGIN
  -- First, check if the email is in the approved_users table
  IF EXISTS (SELECT 1 FROM approved_users WHERE email = NEW.email AND is_active = true) THEN
    -- If approved and active, create a profile with the designated role
    INSERT INTO public.profiles (id, full_name, email, role)
    SELECT NEW.id, au.full_name, NEW.email, au.role
    FROM approved_users au
    WHERE au.email = NEW.email;
  ELSE
    -- If not pre-approved, create a profile with a default 'pending' role
    -- This ensures the user exists in profiles but has no rights yet.
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'pending');
    -- Also, add them to the approved_users table as an inactive user
    INSERT INTO public.approved_users (id, email, full_name, role, is_active)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'accounting', false)
    ON CONFLICT (email) DO NOTHING; -- Avoid errors if a pending request already exists
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Attach the trigger to auth.users (no changes here, but good to confirm)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Allow all authenticated users to read profiles (for collaboration features)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Grant insert permissions for registration requests
DROP POLICY IF EXISTS "Allow public registration requests" ON approved_users;
CREATE POLICY "Allow public registration requests" ON approved_users
  FOR INSERT
  WITH CHECK (
    is_active = false AND approved_by IS NULL
  );

-- Notify that the script has been updated
-- (You would run this script in your Supabase SQL editor)
-- SELECT 'Successfully updated the handle_new_user trigger and policies.';
