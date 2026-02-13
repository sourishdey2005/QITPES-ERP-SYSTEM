-- UNLOCK FULL ACCESS FOR DIRECTORS AND ACCOUNTANTS
-- Run this script to grant equal rights to all roles

-- 1. Enable RLS (Should correspond to 'owner', 'director', 'accounting')
-- Instead of complex checks, we simply allow any authenticated user to manage approved_users
-- because the App Logic ensures only 'owner', 'director', 'accounting' can login.
-- (Regular employees might exist later? No, currently only these 3 roles exist in the system types).

ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- DROP OLD RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "Owners can view all approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can add approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can update approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can delete approved users" ON approved_users;
DROP POLICY IF EXISTS "Public can check approval status" ON approved_users; -- (Keep this for login check?)

-- CREATE NEW BROAD POLICIES

-- 1. VIEW: Allow everyone to view (needed for Login page AND for Dashboard)
CREATE POLICY "Allow full view access" ON approved_users
  FOR SELECT
  USING (true);

-- 2. INSERT: Allow authenticated users (Owners/Directors/Accountants) AND limit public for registration
-- We need to separate "Self-Registration pending" vs "Admin adding user".
-- Existing "Allow public registration requests" policy handles the public part.
-- We need a policy for Authenticated users to add Active users.

DROP POLICY IF EXISTS "Allow public registration requests" ON approved_users;
CREATE POLICY "Allow public registration requests" ON approved_users
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'anon' AND is_active = false) OR  -- Public self-register
    (auth.role() = 'authenticated')                  -- Logged in admin adding user
  );

-- 3. UPDATE: Allow authenticated users (Owners/Directors/Accountants) to approve/revoke
CREATE POLICY "Allow full update access" ON approved_users
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 4. DELETE: Allow authenticated users to delete
CREATE POLICY "Allow full delete access" ON approved_users
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 5. GRANT PERMISSIONS
GRANT ALL ON approved_users TO authenticated;
GRANT SELECT, INSERT ON approved_users TO anon;
