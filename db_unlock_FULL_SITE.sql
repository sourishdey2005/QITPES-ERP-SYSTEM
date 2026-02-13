-- MASTER UNLOCK SCRIPT
-- Grants full access to 'enterprise_settings' and other system tables for ALL authenticated users (Directors/Accountants)

-- 1. ENTERPRISE SETTINGS
ALTER TABLE IF EXISTS enterprise_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage enterprise settings" ON enterprise_settings;
DROP POLICY IF EXISTS "Authenticated users can read enterprise settings" ON enterprise_settings;

CREATE POLICY "Allow full access to enterprise_settings" ON enterprise_settings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 2. AUDIT LOGS (If Table Exists)
-- Assuming table name is 'audit_logs' or similar from context
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view audit logs" ON audit_logs;

CREATE POLICY "Allow full access to audit_logs" ON audit_logs
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 3. WORKFLOWS
ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage workflows" ON workflows;

CREATE POLICY "Allow full access to workflows" ON workflows
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 4. OKRS (Performance) - Ensure broad access
ALTER TABLE IF EXISTS okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to okrs" ON okrs
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 5. GENERIC UNLOCK FOR ALL BUSINESS MODULES
-- (Projects, Finances, Assets usually rely on 'authenticated' check already, but let's reinforce for key tables)

-- Helper macro to unlock a table
CREATE OR REPLACE FUNCTION unlock_table(tbl text) RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Unlock %I" ON %I', tbl, tbl);
  EXECUTE format('CREATE POLICY "Unlock %I" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl, tbl);
END;
$$ LANGUAGE plpgsql;

-- Unlock key module tables
SELECT unlock_table('projects');
SELECT unlock_table('assets');
SELECT unlock_table('employees');
SELECT unlock_table('departments');
SELECT unlock_table('budget_allocations');
SELECT unlock_table('ledger_entries');
SELECT unlock_table('inventory');
SELECT unlock_table('purchase_orders');
SELECT unlock_table('machinery');
SELECT unlock_table('production_logs');
SELECT unlock_table('campaigns'); -- CRM/Sales
SELECT unlock_table('leads');

-- Cleanup
DROP FUNCTION unlock_table(text);
