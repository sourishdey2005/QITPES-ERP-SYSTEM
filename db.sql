
-- QITPES ERP - MASTER ENTERPRISE SCHEMA (v2026.14)
-- HCM, PAYROLL, FLEET, AND GOVERNANCE

-- 1. FLEET & LOGISTICS (Enhanced Lifecycle)
CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT DEFAULT 'Dump Truck',
  current_location TEXT,
  status TEXT DEFAULT 'Ready' CHECK (status IN ('Ready', 'In Transit', 'Maintenance', 'Returned')),
  odometer_reading NUMERIC(15, 2) DEFAULT 0,
  last_work_details TEXT,
  return_notes TEXT,
  last_updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. HCM: MASTER REGISTRY
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  employment_type TEXT DEFAULT 'Permanent', -- Permanent, Contract, Daily Wage
  basic_salary NUMERIC(15, 2) DEFAULT 0,
  hra NUMERIC(15, 2) DEFAULT 0,
  allowances NUMERIC(15, 2) DEFAULT 0,
  pf_applicable BOOLEAN DEFAULT true,
  esi_applicable BOOLEAN DEFAULT true,
  assigned_project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. HCM: ATTENDANCE & LEAVES
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  check_in TIMESTAMP WITH TIME ZONE DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  work_hours NUMERIC(5, 2),
  ot_hours NUMERIC(5, 2) DEFAULT 0,
  location_telemetry JSONB,
  status TEXT DEFAULT 'Present'
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  leave_type TEXT CHECK (leave_type IN ('Casual', 'Sick', 'Paid', 'Unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by UUID REFERENCES auth.users(id)
);

-- 4. PAYROLL: SAP-STYLE AUTOMATION
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pay_month TEXT NOT NULL, -- e.g. "October 2026"
  total_disbursement NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- Draft, Authorized, Paid
  authorized_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  gross_amount NUMERIC(15, 2),
  deductions NUMERIC(15, 2),
  tax_amount NUMERIC(15, 2),
  net_amount NUMERIC(15, 2),
  project_allocation_id UUID REFERENCES projects(id)
);

-- 5. WORKFLOW ENGINE (Governance Logic)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  steps INTEGER DEFAULT 1,
  config JSONB DEFAULT '[]', -- Approval chain structure
  status TEXT DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS & POLICIES
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full Enterprise Access" ON fleet FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON attendance_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON leave_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON payroll_runs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON payroll_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full Enterprise Access" ON workflows FOR ALL USING (auth.role() = 'authenticated');
