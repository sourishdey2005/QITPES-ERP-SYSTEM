-- MASTER UNLOCK SCRIPT v3
-- Grants FULL access to EVERY table for EVERY authenticated user (Owner, Director, Accounting)
-- This ensures that "Everything is accessible to all" as requested.

-- 1. UNLOCK ACCESS CONTROL & SETTINGS
ALTER TABLE IF EXISTS approved_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON approved_users;
CREATE POLICY "Global access for authenticated users" ON approved_users
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS enterprise_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON enterprise_settings;
CREATE POLICY "Global access for authenticated users" ON enterprise_settings
  FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON profiles;
CREATE POLICY "Global access for authenticated users" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. UNLOCK ALL OTHER DATABASE TABLES DYNAMICALLY
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
    EXECUTE format('DROP POLICY IF EXISTS "Global Authenticated Access" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Global access for authenticated users" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Global access for all" ON %I', t);
    EXECUTE format('CREATE POLICY "Global access for all" ON %I FOR ALL USING (auth.role() = ''authenticated'')', t);
  END LOOP;
END $$;

-- 3. ENSURE PERMISSIONS ARE GRANTED
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
