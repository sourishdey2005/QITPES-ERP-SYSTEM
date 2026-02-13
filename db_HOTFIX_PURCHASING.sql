-- QITPES ERP - PURCHASING SCHEMA HOTFIX
-- Use this script if you see "Could not find the 'vendor_name' column" errors.

BEGIN;

-- 1. Ensure the table exists with the correct columns
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    vendor_name TEXT NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Shipped', 'Delivered')),
    description TEXT,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. If table exists but column is missing, add it explicitly
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_orders' 
        AND column_name = 'vendor_name'
    ) THEN
        ALTER TABLE public.purchase_orders ADD COLUMN vendor_name TEXT NOT NULL DEFAULT 'Pending Vendor';
    END IF;
END $$;

-- 3. Force Schema Cache Reload
-- PostgREST (Supabase API) sometimes needs a DDL trigger to refresh its understanding of the table.
COMMENT ON TABLE public.purchase_orders IS 'QITPES Enterprise Purchase Orders - Last Sync: 2026';

-- 4. Re-apply Global Unlock Policy for this table
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global access for authenticated users" ON public.purchase_orders;
CREATE POLICY "Global access for authenticated users" ON public.purchase_orders 
    FOR ALL USING (auth.role() = 'authenticated');

COMMIT;
