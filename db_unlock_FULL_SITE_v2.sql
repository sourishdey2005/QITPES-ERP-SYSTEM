-- MASTER UNLOCK SCRIPT v2
-- Grants full access to ALL tables for ALL authenticated users (Owner, Director, Accounting)

-- 1. UNLOCK CORE MANAGEMENT TABLES
ALTER TABLE IF EXISTS approved_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON approved_users;
CREATE POLICY "Global access for authenticated users" ON approved_users
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS enterprise_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON enterprise_settings;
CREATE POLICY "Global access for authenticated users" ON enterprise_settings
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON audit_logs;
CREATE POLICY "Global access for authenticated users" ON audit_logs
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON workflows;
CREATE POLICY "Global access for authenticated users" ON workflows
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. UNLOCK ALL OTHER DATABASE TABLES
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('profiles') -- Profiles usually has its own specific logic
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Global Authenticated Access" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Global access for authenticated users" ON %I', t);
    EXECUTE format('CREATE POLICY "Global access for authenticated users" ON %I FOR ALL USING (auth.role() = ''authenticated'')', t);
  END LOOP;
END $$;

-- 3. PROFILES ACCESS (Everyone can see everyone, but only edit own)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can select profiles" ON profiles;
CREATE POLICY "Everyone can select profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. ENSURE ADMIN MODULES ARE ACCESSIBLE IN UI
-- (This part is already handled in constants.tsx and DashboardLayout.tsx)
