-- GUARANTEED CORE UNLOCK SCRIPT
-- Unlocks key tables we KNOW exist. Skips dangerous loops.

-- 1. ENTERPRISE SETTINGS (Company Profile for Directors)
ALTER TABLE IF EXISTS enterprise_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage enterprise settings" ON enterprise_settings;
DROP POLICY IF EXISTS "Authenticated users can read enterprise_settings" ON enterprise_settings;
CREATE POLICY "Allow Full Access Settings" ON enterprise_settings FOR ALL USING (auth.role() = 'authenticated');

-- 2. APPROVED USERS (Access Control for Directors/Accountants)
ALTER TABLE IF EXISTS approved_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view all approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can add approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can update approved users" ON approved_users;
DROP POLICY IF EXISTS "Owners can delete approved users" ON approved_users;
CREATE POLICY "Allow Full Access Users" ON approved_users FOR ALL USING (auth.role() = 'authenticated');

-- 3. PROFILES
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Read Profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. PROJECTS (Core Module)
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage projects" ON projects;
CREATE POLICY "Allow Full Access Projects" ON projects FOR ALL USING (auth.role() = 'authenticated');

-- 5. ASSETS / MACHINERY (Core Module)
ALTER TABLE IF EXISTS machinery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Full Access Machinery" ON machinery FOR ALL USING (auth.role() = 'authenticated');

-- 6. AUDIT LOGS (If exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Allow Full Access Audit" ON audit_logs FOR ALL USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- 7. WORKFLOWS (If exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflows') THEN
    EXECUTE 'ALTER TABLE workflows ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Allow Full Access Workflows" ON workflows FOR ALL USING (auth.role() = ''authenticated'')';
  END IF;
END $$;
