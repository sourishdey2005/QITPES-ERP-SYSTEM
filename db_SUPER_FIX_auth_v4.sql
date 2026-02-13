-- QITPES ERP - MASTER AUTH & DATABASE FIX v4
-- Resolves "Database error saving new user" and "Login Reset" synchronization issues.

-- 1. CLEANUP & PREPARE CORE TABLES
BEGIN;

-- Ensure profiles has all necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Prepare approved_users table
ALTER TABLE public.approved_users ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.approved_users ADD COLUMN IF NOT EXISTS initial_password TEXT;

-- Remove duplicate emails from approved_users before adding unique constraint
DELETE FROM public.approved_users 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at DESC) as entry_number
        FROM public.approved_users
    ) t WHERE entry_number = 1
);

-- Ensure email is unique and lowercase-indexable
DROP INDEX IF EXISTS idx_approved_users_email_lower;
CREATE UNIQUE INDEX idx_approved_users_email_lower ON public.approved_users (lower(email));

-- 2. ROBUST AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role TEXT;
  existing_is_active BOOLEAN;
  existing_full_name TEXT;
BEGIN
  -- A. Check if the user was pre-approved by the owner
  SELECT role, is_active, full_name 
  INTO existing_role, existing_is_active, existing_full_name
  FROM public.approved_users 
  WHERE lower(email) = lower(NEW.email);

  -- B. Create or update the Profile
  -- We use COALESCE to prioritize data in this order:
  -- 1. Metadata from sign-up (what the user typed)
  -- 2. Pre-approved data (what the owner set)
  -- 3. Defaults
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', existing_full_name, split_part(NEW.email, '@', 1)), 
    NEW.email, 
    COALESCE(existing_role, NEW.raw_user_meta_data->>'role', 'accounting')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  -- C. Sync the approved_users table
  -- We ensure that if a record exists, its ID is updated to match the Auth ID.
  -- This creates a tight link between Auth and the Access Control list.
  INSERT INTO public.approved_users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', existing_full_name, split_part(NEW.email, '@', 1)), 
    COALESCE(existing_role, NEW.raw_user_meta_data->>'role', 'accounting'),
    COALESCE(existing_is_active, false) -- Default to false if not pre-approved
  )
  ON CONFLICT (lower(email)) DO UPDATE SET
    id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- 3. RE-INSTALL TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. EMERGENCY OWNER REGISTRATION REPAIR
-- Ensures the owner can always log in and has correct permissions
UPDATE public.approved_users 
SET role = 'owner', is_active = true 
WHERE lower(email) = 'abhradeephazra99@gmail.com';

UPDATE public.profiles 
SET role = 'owner' 
WHERE lower(email) = 'abhradeephazra99@gmail.com';

-- 5. AUTO-CONFIRM EMAILS (OPTIONAL BUT RECOMMENDED FOR INTERNAL ERPs)
-- This eliminates the "Email not confirmed" error for new users.
-- Note: This only affects the trigger logic if you add it to auth.users, 
-- but we can do a global update for existing ones.
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

COMMIT;
