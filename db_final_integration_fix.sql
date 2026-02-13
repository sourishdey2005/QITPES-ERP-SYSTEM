-- FINAL INTEGRATION FIX: Registration -> Approval -> Login Flow
-- This script ensures the profiles table is ready and the trigger correctly places new registrations into the pending list.

-- 0. Ensure profiles table has the email column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 1. Ensure 'email' is UNIQUE in approved_users to handle ON CONFLICT properly
-- (If there are duplicates already, we clean them up first)
DELETE FROM public.approved_users 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as entry_number
        FROM public.approved_users
    ) t WHERE entry_number > 1
);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'approved_users_email_key'
    ) THEN
        ALTER TABLE public.approved_users ADD CONSTRAINT approved_users_email_key UNIQUE (email);
    END IF;
END $$;

-- 2. RE-INSTALL MASTER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Create Profile
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New ERP User'),
    COALESCE(new.raw_user_meta_data->>'role', 'accounting'),
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  
  -- B. Create/Link Approval Record
  INSERT INTO public.approved_users (id, email, full_name, role, is_active, initial_password)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New ERP User'),
    COALESCE(new.raw_user_meta_data->>'role', 'accounting'),
    CASE WHEN new.email = 'abhradeephazra99@gmail.com' THEN true ELSE false END, -- Only owner is auto-active
    'Pending Approval'
  )
  ON CONFLICT (email) DO UPDATE SET 
    id = EXCLUDED.id; -- Link the actual Auth ID if the owner pre-approved the email
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BACKFILL: Pick up any existing users who aren't in the list yet
INSERT INTO public.approved_users (id, email, full_name, role, is_active, initial_password)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Legacy User'),
  COALESCE(raw_user_meta_data->>'role', 'accounting'),
  CASE WHEN email = 'abhradeephazra99@gmail.com' THEN true ELSE false END,
  'Pending Approval'
FROM auth.users
ON CONFLICT (email) DO NOTHING;

-- 5. UNLOCK RLS FOR AUTHENTICATED USERS (OWNER/DIRECTOR)
ALTER TABLE public.approved_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Full Access Users" ON public.approved_users;
CREATE POLICY "Allow Full Access Users" ON public.approved_users
  FOR ALL
  USING (auth.role() = 'authenticated');
