
-- QITPES PROCUREMENT & SUPPLY CHAIN SUITE

-- 1. MATERIAL REQUISITIONS (MR)
CREATE TABLE IF NOT EXISTS material_requisitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mr_number TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    item_name TEXT NOT NULL,
    quantity NUMERIC(15,3) DEFAULT 0,
    unit TEXT,
    priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'Urgent', 'Critical')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'RFQ Sent', 'PO Issued', 'Fulfilled', 'Rejected')),
    requested_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RFQ (Request for Quotation) MANAGEMENT
CREATE TABLE IF NOT EXISTS procurement_rfqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_number TEXT UNIQUE NOT NULL,
    mr_id UUID REFERENCES material_requisitions(id) ON DELETE CASCADE,
    vendor_ids UUID[] DEFAULT '{}',
    deadline DATE,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Comparison', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. VENDOR QUOTES (For Comparison & Scoring)
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID REFERENCES procurement_rfqs(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    quoted_rate NUMERIC(15,2) NOT NULL,
    lead_time_days INTEGER,
    payment_terms TEXT,
    is_shortlisted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. MULTI-WAREHOUSE CONTROL
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    location TEXT,
    manager_id UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity NUMERIC(15,3) DEFAULT 0,
    last_inward_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(warehouse_id, inventory_id)
);

-- 5. GRN (Goods Receipt Note) / MATERIAL INWARD
CREATE TABLE IF NOT EXISTS grns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grn_number TEXT UNIQUE NOT NULL,
    po_id UUID REFERENCES purchase_orders(id),
    warehouse_id UUID REFERENCES warehouses(id),
    received_date DATE DEFAULT CURRENT_DATE,
    received_by UUID REFERENCES profiles(id),
    inspection_status TEXT DEFAULT 'Pending' CHECK (inspection_status IN ('Pending', 'Pass', 'Fail', 'Partial')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. VENDOR PERFORMANCE SCORING
CREATE TABLE IF NOT EXISTS vendor_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_name TEXT UNIQUE NOT NULL,
    quality_score INTEGER DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    delivery_score INTEGER DEFAULT 0 CHECK (delivery_score BETWEEN 0 AND 100),
    cost_score INTEGER DEFAULT 0 CHECK (cost_score BETWEEN 0 AND 100),
    overall_rating NUMERIC(3,2) GENERATED ALWAYS AS ((quality_score + delivery_score + cost_score) / 30.0) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
