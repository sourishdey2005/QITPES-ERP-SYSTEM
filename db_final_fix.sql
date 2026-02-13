-- FINAL FIX SCRIPT: Run this to solve all login/registration issues

-- 1. Fix the missing "initial_password" column error
ALTER TABLE approved_users ADD COLUMN IF NOT EXISTS initial_password TEXT;

-- 2. Ensure Owner has the correct initial password set
UPDATE approved_users 
SET initial_password = 'Ahazra@987', role = 'owner', is_active = true
WHERE email = 'abhradeephazra99@gmail.com';

-- 3. KEY FIX: Allow Login Page to read the approved users list
-- Without this, the Login page sees an "empty" list and rejects everyone
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON approved_users;
CREATE POLICY "Enable read access for all users" ON approved_users
  FOR SELECT
  USING (true);

-- 4. Grant explicit permissions to Anonymous users (required for Login page)
GRANT SELECT ON approved_users TO anon;
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON approved_users TO service_role;

-- 5. Helper function for extra safety
CREATE OR REPLACE FUNCTION is_email_approved(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
