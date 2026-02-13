-- SAFER MASTER UNLOCK SCRIPT
-- Grants full access to vital tables, skipping any that don't exist yet without error.

CREATE OR REPLACE FUNCTION safely_unlock_table(tbl_name text) RETURNS void AS $$
BEGIN
  -- Check if table exists first
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl_name) THEN
    
    -- 1. Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
    
    -- 2. Drop potential restrictive policies (Policy names might vary, so we drop specific known ones or rely on new broad one)
    -- We'll try to drop common restrictive names if they exist, but ignore errors if policy doesn't exist
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Owners can manage %I" ON %I', tbl_name, tbl_name);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Unlock %I" ON %I', tbl_name, tbl_name);
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3. Create formatted broad policy
    -- "Allow Select/Insert/Update/Delete for Authenticated Users"
    BEGIN
        EXECUTE format('CREATE POLICY "Unlock %I" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl_name, tbl_name);
    EXCEPTION WHEN duplicate_object THEN NULL; -- Policy already exists
    END;
    
    RAISE NOTICE 'Unlocked table: %', tbl_name;
  ELSE
    RAISE NOTICE 'Table % does not exist, skipping.', tbl_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to all potential tables
SELECT safely_unlock_table('enterprise_settings');
SELECT safely_unlock_table('approved_users');
SELECT safely_unlock_table('profiles');
SELECT safely_unlock_table('projects');
SELECT safely_unlock_table('assets');
SELECT safely_unlock_table('employees');
SELECT safely_unlock_table('departments');
SELECT safely_unlock_table('budget_allocations');
SELECT safely_unlock_table('ledger_entries');
SELECT safely_unlock_table('inventory');
SELECT safely_unlock_table('purchase_orders');
SELECT safely_unlock_table('machinery');
SELECT safely_unlock_table('production_logs');
SELECT safely_unlock_table('campaigns');
SELECT safely_unlock_table('leads');
SELECT safely_unlock_table('audit_logs');
SELECT safely_unlock_table('workflows');
SELECT safely_unlock_table('okrs');

-- Cleanup
DROP FUNCTION safely_unlock_table(text);
