
-- QITPES ERP - ENTERPRISE SCHEMA (v2026.22)

-- 1. PROFILES & CORE IDENTITY
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT,
  phone TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. EMPLOYEES (CORE RESOURCE)
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT,
  gross_salary NUMERIC(15,2) DEFAULT 0,
  monthly_deductions NUMERIC(15,2) DEFAULT 0,
  employee_status TEXT DEFAULT 'Active' CHECK (employee_status IN ('Active', 'On Leave', 'Terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. BUDGET & COST CONTROL
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  fiscal_year INT NOT NULL,
  allocated_amount NUMERIC(15,2) DEFAULT 0,
  spent_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(department, fiscal_year)
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  department TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petty_cash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  handler_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  frequency TEXT DEFAULT 'Monthly',
  due_day INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_revision_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES budget_allocations(id) ON DELETE CASCADE,
  old_amount NUMERIC(15,2),
  new_amount NUMERIC(15,2),
  reason TEXT,
  revised_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capital_expenditure (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  category TEXT,
  purchase_date DATE,
  status TEXT DEFAULT 'Purchased',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_cost_breakdown (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  category TEXT NOT NULL,
  planned_amount NUMERIC(15,2) DEFAULT 0,
  actual_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. WORKFORCE & HR MODULES
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES departments(id),
  head_id UUID REFERENCES profiles(id),
  budget_limit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_appraisals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  appraiser_id UUID REFERENCES profiles(id),
  score INT CHECK (score BETWEEN 1 AND 10),
  feedback TEXT,
  appraisal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  old_role TEXT,
  new_role TEXT,
  old_salary NUMERIC(12,2),
  new_salary NUMERIC(12,2),
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  requested_by UUID REFERENCES profiles(id),
  current_location TEXT,
  target_location TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exit_clearances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  cleared_by UUID REFERENCES profiles(id),
  it_cleared BOOLEAN DEFAULT false,
  hr_cleared BOOLEAN DEFAULT false,
  finance_cleared BOOLEAN DEFAULT false,
  comments TEXT,
  status TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Cleared', 'Retained')),
  exit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grievances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Resolved', 'Dismissed')),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT DEFAULT 'All',
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_url TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. CONTRACTORS & SITE WAGES
CREATE TABLE IF NOT EXISTS contract_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0,
  site_location TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES contract_workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Absent')),
  UNIQUE(worker_id, attendance_date)
);

-- 6. LEAVE & HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  type TEXT DEFAULT 'National' CHECK (type IN ('National', 'Regional', 'Emergency')),
  branch_id TEXT DEFAULT 'All',
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  casual_leave_balance NUMERIC(4,1) DEFAULT 12,
  sick_leave_balance NUMERIC(4,1) DEFAULT 10,
  paid_leave_balance NUMERIC(4,1) DEFAULT 15,
  year INTEGER DEFAULT 2026,
  UNIQUE(employee_id, year)
);

-- 7. COLLABORATION (MEETINGS & ROOMS)
CREATE TABLE IF NOT EXISTS conference_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4,
  location TEXT,
  equipment JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  room_id UUID REFERENCES conference_rooms(id),
  organizer_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  department TEXT DEFAULT 'General',
  agenda_url TEXT,
  status TEXT DEFAULT 'Scheduled'
);

-- 8. SHIFT & ROSTER ENGINE
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  allowance_multiplier NUMERIC(3,2) DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  assignment_date DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  UNIQUE(employee_id, assignment_date)
);

-- 9. ENTERPRISE SETTINGS
CREATE TABLE IF NOT EXISTS enterprise_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legal_name TEXT DEFAULT 'QITPES International Pvt Ltd',
  gstin TEXT DEFAULT '27AAACQ1234F1Z5',
  pan TEXT DEFAULT 'AAACQ1234F',
  website TEXT DEFAULT 'www.qitpes.erp',
  address TEXT DEFAULT 'Site 4, Phase 2, Hinjewadi IT Park, Pune, Maharashtra 411057',
  primary_hub TEXT DEFAULT 'Pune Headquarters',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. FINANCE & LEDGER
-- 10. FINANCE & ACCOUNTING UPGRADE
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  category TEXT, -- e.g., 'Current Asset', 'Fixed Asset'
  balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_label TEXT UNIQUE NOT NULL, -- e.g., 'FY 2025-26'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_no TEXT UNIQUE NOT NULL, -- e.g., 'JV-2026-001'
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  financial_year_id UUID REFERENCES financial_years(id),
  status TEXT DEFAULT 'Posted' CHECK (status IN ('Draft', 'Posted', 'Void')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  debit NUMERIC(15,2) DEFAULT 0,
  credit NUMERIC(15,2) DEFAULT 0,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_recon_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_line_id UUID REFERENCES journal_lines(id),
  bank_statement_date DATE,
  reconciled_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  reference TEXT,
  debit NUMERIC(15,2) DEFAULT 0,
  credit NUMERIC(15,2) DEFAULT 0,
  entry_type TEXT CHECK (entry_type IN ('Manual', 'Auto', 'Closing')),
  transaction_id UUID, -- Link to relevant source (e.g., PO id, Payroll id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15,2) NOT NULL,
  category TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_paid BOOLEAN DEFAULT true,
  due_date TIMESTAMP WITH TIME ZONE,
  client_id UUID,
  description TEXT
);

-- 11. INVENTORY & PURCHASING
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT UNIQUE NOT NULL,
  stock_level NUMERIC(12,2) DEFAULT 0,
  reorder_level NUMERIC(12,2) DEFAULT 0,
  unit_price NUMERIC(12,2) DEFAULT 0,
  unit TEXT DEFAULT 'Units',
  cogs NUMERIC(15,2) DEFAULT 0,
  category TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Shipped', 'Delivered')),
  description TEXT,
  delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. PROJECTS & PLANNING
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  contract_value NUMERIC(15,2) DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  budget NUMERIC(15,2) DEFAULT 0,
  estimated_cost NUMERIC(15,2) DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  due_date DATE,
  owner_name TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. ASSETS & MACHINERY
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'Healthy',
  site_location TEXT,
  engine_hours NUMERIC(12,2) DEFAULT 0,
  fuel_level NUMERIC(5,2) DEFAULT 100,
  downtime_hours NUMERIC(10,2) DEFAULT 0,
  fuel_used NUMERIC(12,2) DEFAULT 0,
  distance_traveled NUMERIC(12,2) DEFAULT 0,
  maintenance_cost NUMERIC(15,2) DEFAULT 0,
  actual_output NUMERIC(12,2) DEFAULT 0,
  planned_output NUMERIC(12,2) DEFAULT 0,
  purchase_cost NUMERIC(15,2) DEFAULT 0,
  last_telemetry TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. FLEET LOGISTICS
CREATE TABLE IF NOT EXISTS fleet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  current_location TEXT,
  status TEXT DEFAULT 'Ready' CHECK (status IN ('Ready', 'In Transit', 'Returned', 'Maintenance')),
  last_work_details TEXT,
  odometer_reading NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. PRODUCTION & OPERATIONS
CREATE TABLE IF NOT EXISTS production_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status_type TEXT DEFAULT 'Info' CHECK (status_type IN ('Info', 'Success', 'Warning', 'Error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 16. SALES & CRM
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_spend NUMERIC(15,2) DEFAULT 0,
  last_purchase DATE,
  segment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  value NUMERIC(15,2) DEFAULT 0,
  stage TEXT DEFAULT 'Lead' CHECK (stage IN ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed')),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 17. COMPLIANCE & GOVERNANCE
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_month TEXT NOT NULL,
  type TEXT DEFAULT 'GST',
  cgst NUMERIC(15,2) DEFAULT 0,
  sgst NUMERIC(15,2) DEFAULT 0,
  total_tax NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Filed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  objective TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  progress NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'On Track' CHECK (status IN ('On Track', 'At Risk', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  steps INTEGER DEFAULT 1,
  description TEXT,
  config JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 18. PAYROLL RECORDS
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  pay_month TEXT NOT NULL,
  gross_amount NUMERIC(15,2) NOT NULL,
  deduction_amount NUMERIC(15,2) DEFAULT 0,
  net_amount NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'Paid',
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, pay_month)
);

-- RLS SECTION
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
  END LOOP;
END $$;

-- GLOBAL POLICIES (AUTHENTICATED ACCESS)
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('profiles', 'enterprise_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Global Authenticated Access" ON %I', t);
    EXECUTE format('CREATE POLICY "Global Authenticated Access" ON %I FOR ALL USING (auth.role() = ''authenticated'')', t);
  END LOOP;
END $$;

-- SPECIAL POLICIES
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can read enterprise settings" ON enterprise_settings;
CREATE POLICY "Authenticated users can read enterprise settings" ON enterprise_settings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can manage enterprise settings" ON enterprise_settings;
CREATE POLICY "Owners can manage enterprise settings" ON enterprise_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'owner'))
  OR NOT EXISTS (SELECT 1 FROM enterprise_settings)
);

-- SEED DATA
INSERT INTO departments (name, budget_limit) VALUES 
('Technology', 10000000),
('Operations', 8000000),
('Finance', 5000000),
('HR', 3000000)
ON CONFLICT (name) DO NOTHING;

INSERT INTO shifts (name, start_time, end_time, allowance_multiplier) VALUES
('Morning Shift', '08:00:00', '16:00:00', 1.0),
('Evening Shift', '16:00:00', '00:00:00', 1.2),
('Night Shift', '00:00:00', '08:00:00', 1.5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO inventory (sku, name, stock_level, reorder_level, unit_price, unit, category) VALUES 
('CM-001', 'Ultra-Durable Cement', 5000, 1000, 450, 'Bags', 'Construction'),
('ST-001', 'Reinforced Steel T1', 1200, 500, 85000, 'Tons', 'Material'),
('FL-001', 'Hydraulic Fluid X', 450, 100, 1200, 'Liters', 'Consumables')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO projects (name, client_name, contract_value, budget, estimated_cost, completion_percentage, status) VALUES 
('SHRIYUGALARADHA MADHAV BHAKTI PEETH FOUNDATION-MANDIR CONSTRUCTION ANTALA', 'SMBP Foundation', 1750000, 1750000, 1500000, 0, 'Active'),
('Pune Smart Hub', 'Mahindra Realty', 120000000, 85000000, 82000000, 65, 'Active'),
('Nagpur Flyover Extension', 'NHAI', 450000000, 380000000, 375000000, 22, 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO okrs (objective, owner_name, progress, status) VALUES
('Optimize Site Delivery Timeline', 'Arjun Mehta', 75, 'On Track'),
('Reduce Material Wastage by 15%', 'Sarah Khan', 45, 'At Risk'),
('Scale Fleet Efficiency', 'Vikram Singh', 90, 'On Track')
ON CONFLICT DO NOTHING;

INSERT INTO financial_years (year_label, start_date, end_date) VALUES 
('FY 2025-26', '2025-04-01', '2026-03-31')
ON CONFLICT (year_label) DO NOTHING;

INSERT INTO chart_of_accounts (code, name, type, category, balance) VALUES 
('1000', 'HDFC Main Bank A/c', 'Asset', 'Current Asset', 25000000),
('1001', 'Office Petty Cash', 'Asset', 'Current Asset', 50000),
('1200', 'Accounts Receivable', 'Asset', 'Current Asset', 1250000),
('1500', 'Fixed Assets - Machinery', 'Asset', 'Fixed Asset', 45000000),
('2000', 'Accounts Payable', 'Liability', 'Current Liability', 850000),
('2100', 'GST Payable', 'Liability', 'Current Liability', 120000),
('2200', 'TDS Payable', 'Liability', 'Current Liability', 45000),
('3000', 'Equity Capital', 'Equity', 'Equity', 50000000),
('3100', 'Retained Earnings', 'Equity', 'Equity', 15000000),
('4000', 'Sales Revenue', 'Income', 'Operating Income', 2500000),
('4100', 'Service Income', 'Income', 'Operating Income', 800000),
('5000', 'Employee Salaries', 'Expense', 'Operating Expense', 1200000),
('5100', 'Power & Fuel', 'Expense', 'Operating Expense', 250000),
('5200', 'Site Rent', 'Expense', 'Operating Expense', 450000),
('5300', 'Global Travel Exp', 'Expense', 'General Expense', 150000)
ON CONFLICT (code) DO NOTHING;

-- User Access Management System
-- Add this to your existing db.sql or run separately

-- Table to store approved users who can access the system
CREATE TABLE IF NOT EXISTS approved_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'accounting' CHECK (role IN ('owner', 'director', 'accounting')),
  initial_password TEXT, -- Store initial password for owner reference
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the owner's email as pre-approved
INSERT INTO approved_users (email, full_name, role, is_active, initial_password)
VALUES ('abhradeephazra99@gmail.com', 'Abhradeeep Hazra', 'owner', true, 'Ahazra@987')
ON CONFLICT (email) DO UPDATE 
SET initial_password = EXCLUDED.initial_password;

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
