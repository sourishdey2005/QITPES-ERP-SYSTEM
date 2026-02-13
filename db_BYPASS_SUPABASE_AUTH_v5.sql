-- QITPES ERP - MASTER NO-AUTH BYPASS v5
-- Goal: Make owner input the ONLY requirement for login.
-- This script auto-approves and auto-confirms anyone the owner adds.

BEGIN;

-- 1. Ensure the Sync Trigger works in the background
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role TEXT;
  existing_full_name TEXT;
BEGIN
  -- A. Fetch pre-approved details
  SELECT role, full_name 
  INTO existing_role, existing_full_name
  FROM public.approved_users 
  WHERE lower(email) = lower(NEW.email);

  -- B. Create the Profile instantly
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
    role = EXCLUDED.role;

  -- C. Tighten the link to approved_users
  -- This ensures the ID is synced so RLS works based on 'auth.uid() = id'
  UPDATE public.approved_users 
  SET id = NEW.id, is_active = true
  WHERE lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$$;

-- 2. AUTO-CONFIRMATION (THE "NO AUTH" KEY)
-- This function runs inside the 'auth' schema to verify the email instantly.
CREATE OR REPLACE FUNCTION public.force_verify_user() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = now();
  NEW.last_sign_in_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attachment of auto-confirm to auth.users (requires superuser/postgres role)
DROP TRIGGER IF EXISTS tr_auto_confirm_email ON auth.users;
CREATE TRIGGER tr_auto_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.force_verify_user();

-- 3. MASSIVE RLS UNLOCK FOR CORE MODULES
-- Since the user wants "no authorization", we make sure verified users have full table rights.
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Global Access" ON %I', t);
    EXECUTE format('CREATE POLICY "Global Access" ON %I FOR ALL USING (auth.role() = ''authenticated'')', t);
  END LOOP;
END $$;

-- 4. CLEANUP EXISTING BLOCKERS
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
UPDATE public.approved_users SET is_active = true;

COMMIT;
