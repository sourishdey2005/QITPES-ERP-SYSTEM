-- ULTRA-MINIMAL UNLOCK SCRIPT
-- Unlocks ONLY the tables required for Directors/Accountants to use the Admin Panel.
-- Skips business modules (machinery, projects, etc.) to avoid errors.

-- 1. ENTERPRISE SETTINGS (Company Profile)
ALTER TABLE IF EXISTS enterprise_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage enterprise settings" ON enterprise_settings;
DROP POLICY IF EXISTS "Authenticated users can read enterprise_settings" ON enterprise_settings;
CREATE POLICY "Allow Full Access Settings" ON enterprise_settings FOR ALL USING (auth.role() = 'authenticated');

-- 2. APPROVED USERS (Access Control Page)
ALTER TABLE IF EXISTS approved_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view all approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can add approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can update approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can delete approved users" ON approved_users;
CREATE POLICY "Allow Full Access Users" ON approved_users FOR ALL USING (auth.role() = 'authenticated');

-- 3. PROFILES (Basic User Data)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Read Profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
