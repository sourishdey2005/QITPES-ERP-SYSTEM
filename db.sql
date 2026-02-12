
-- QITPES ERP - ENTERPRISE SCHEMA (v2026.21)

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

-- 1. CONTRACT WORKER REGISTRY (CLEAN STATE)
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

-- 2. DAILY ATTENDANCE LOG FOR CONTRACTORS
CREATE TABLE IF NOT EXISTS contract_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES contract_workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Absent')),
  UNIQUE(worker_id, attendance_date)
);

-- 3. HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  type TEXT DEFAULT 'National' CHECK (type IN ('National', 'Regional', 'Emergency')),
  branch_id TEXT DEFAULT 'All',
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. LEAVE MANAGEMENT
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  casual_leave_balance NUMERIC(4,1) DEFAULT 12,
  sick_leave_balance NUMERIC(4,1) DEFAULT 10,
  paid_leave_balance NUMERIC(4,1) DEFAULT 15,
  year INTEGER DEFAULT 2026,
  UNIQUE(employee_id, year)
);

-- 5. SMART MEETINGS & ROOMS
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

-- 6. SHIFT & ROSTER ENGINE
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
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

-- Global Policies
CREATE POLICY "Employee Access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Contract Access" ON contract_workers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Attendance Access" ON contract_attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enterprise Read" ON holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Room Access" ON conference_rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Meeting Access" ON meetings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Shift Access" ON shifts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Assignment Access" ON shift_assignments FOR ALL USING (auth.role() = 'authenticated');

-- MISSION CRITICAL OPERATIONAL SEEDS (Excluding Contractors)
INSERT INTO conference_rooms (name, capacity, location, equipment) 
VALUES 
('Boardroom Alpha', 12, 'HQ Floor 4', '["VC", "Projector", "Whiteboard"]'),
('Strategy Hub B', 6, 'Operations Wing', '["VC", "Dual-Monitor"]'),
('Meeting Pod 1', 4, 'Tech Zone', '["Smart Display"]')
ON CONFLICT (name) DO NOTHING;

INSERT INTO shifts (name, start_time, end_time, allowance_multiplier)
VALUES 
('Day Shift', '08:00:00', '20:00:00', 1.0),
('Night Shift', '20:00:00', '08:00:00', 1.25)
ON CONFLICT (name) DO NOTHING;
