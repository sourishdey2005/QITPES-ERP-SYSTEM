-- FIX: Ensure Profiles are created and Owner has access
-- Run this script in Supabase SQL Editor

-- 1. Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'accounting'), -- Default role
    new.email
  );
  
  -- Also add to approved_users as Pending if not exists
  INSERT INTO public.approved_users (email, full_name, role, is_active, initial_password)
  VALUES (
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'accounting'),
    CASE WHEN new.email = 'abhradeephazra99@gmail.com' THEN true ELSE false END, -- Only owner is auto-active
    'Pending Approval'
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FIX OWNER PROFILE MANUALLY (If already registered but no profile)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'owner'
FROM auth.users
WHERE email = 'abhradeephazra99@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'owner';

-- 4. Allow public to insert PENDING requests into approved_users
DROP POLICY IF EXISTS "Allow public registration requests" ON approved_users;
CREATE POLICY "Allow public registration requests" ON approved_users
  FOR INSERT
  WITH CHECK (
    is_active = false -- Only allow inactive inputs (pending requests)
  );

-- 5. Ensure Login Page can read status (already done, but reinforcing)
DROP POLICY IF EXISTS "Enable read access for all users" ON approved_users;
CREATE POLICY "Enable read access for all users" ON approved_users
  FOR SELECT
  USING (true);
