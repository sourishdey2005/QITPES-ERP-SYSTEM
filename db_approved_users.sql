-- User Access Management System
-- Add this to your existing db.sql or run separately

-- Table to store approved users who can access the system
CREATE TABLE IF NOT EXISTS approved_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'accounting' CHECK (role IN ('owner', 'director', 'accounting')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the owner's email as pre-approved
INSERT INTO approved_users (email, full_name, role, is_active)
VALUES ('abhradeephazra99@gmail.com', 'Abhradeeep Hazra', 'owner', true)
ON CONFLICT (email) DO NOTHING;

-- RLS Policies for approved_users table
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Only owners can view all approved users
DROP POLICY IF EXISTS "Owners can view all approved users" ON approved_users;
CREATE POLICY "Owners can view all approved users" ON approved_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only owners can insert new approved users
DROP POLICY IF EXISTS "Owners can add approved users" ON approved_users;
CREATE POLICY "Owners can add approved users" ON approved_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only owners can update approved users
DROP POLICY IF EXISTS "Owners can update approved users" ON approved_users;
CREATE POLICY "Owners can update approved users" ON approved_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only owners can delete approved users
DROP POLICY IF EXISTS "Owners can delete approved users" ON approved_users;
CREATE POLICY "Owners can delete approved users" ON approved_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Function to check if email is approved before registration
CREATE OR REPLACE FUNCTION is_email_approved(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
