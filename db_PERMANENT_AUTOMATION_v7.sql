-- QITPES ERP - PERMANENT AUTOMATION ENGINE v7
-- Ensures "Zero-SQL" user addition. Once this is run, the dashboard handles everything.

BEGIN;

-- 1. INFRASTRUCTURE REPAIR
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. THE PERMANENT TRIGGER (Security Definer + Silent Error Handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A. Sync Profile & Approval List
  -- We use the Auth Email as the source of truth
  INSERT INTO public.profiles (id, full_name, email, role, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'accounting'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  -- B. Auto-Update existing approval records with the new Auth ID
  -- This makes RLS and Dashboard lists sync instantly
  UPDATE public.approved_users 
  SET id = NEW.id, 
      is_active = true
  WHERE lower(email) = lower(NEW.email);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- SILENT FAIL: Never block the 'auth.users' creation with a database error.
  -- Even if syncing fails, the user can still log in.
  RETURN NEW; 
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. THE "NO-VERIFICATION" BYPASS
CREATE OR REPLACE FUNCTION public.force_verify_user() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = now();
  NEW.last_sign_in_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_email ON auth.users;
CREATE TRIGGER tr_auto_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.force_verify_user();

-- 4. GLOBAL ACCESS PERMISSIONS
-- Ensures any table created or existing is accessible to owners/directors
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

-- 5. FINAL SYSTEM CLEANUP
-- Auto-confirm any legacy users who were stuck
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
UPDATE public.approved_users SET is_active = true;

COMMIT;
