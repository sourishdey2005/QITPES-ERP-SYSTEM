
-- QITPES ERP - SCHEDULING & COLLABORATION SCHEMA (v2026.20)

-- 0. EMPLOYEES CORE
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT,
  gross_salary NUMERIC(12,2) DEFAULT 0,
  monthly_deductions NUMERIC(12,2) DEFAULT 0,
  employee_status TEXT DEFAULT 'Active' CHECK (employee_status IN ('Active', 'On Leave', 'Terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NEW: CONTRACT WORKER REGISTRY
CREATE TABLE IF NOT EXISTS contract_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  trade TEXT NOT NULL, -- e.g., 'Mason', 'Electrician', 'Labour'
  daily_wage NUMERIC(10,2) NOT NULL DEFAULT 0,
  site_location TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NEW: DAILY ATTENDANCE LOG FOR CONTRACTORS
CREATE TABLE IF NOT EXISTS contract_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES contract_workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Absent')),
  UNIQUE(worker_id, attendance_date)
);

-- 1. HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  type TEXT DEFAULT 'National' CHECK (type IN ('National', 'Regional', 'Emergency')),
  branch_id TEXT DEFAULT 'All',
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. LEAVE MANAGEMENT
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  casual_leave_balance NUMERIC(4,1) DEFAULT 12,
  sick_leave_balance NUMERIC(4,1) DEFAULT 10,
  paid_leave_balance NUMERIC(4,1) DEFAULT 15,
  year INTEGER DEFAULT 2026,
  UNIQUE(employee_id, year)
);

-- 3. SMART MEETINGS & ROOMS
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

-- 4. SHIFT & ROSTER ENGINE
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

-- RLS Enablement
ALTER TABLE contract_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_attendance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Contract Access" ON contract_workers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Attendance Access" ON contract_attendance FOR ALL USING (auth.role() = 'authenticated');
