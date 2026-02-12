
-- QITPES ERP - SCHEDULING & COLLABORATION SCHEMA (v2026.17)

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

-- 2. LEAVE MANAGEMENT (Enhanced)
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
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  location TEXT,
  equipment JSONB DEFAULT '[]', -- ['VC', 'Whiteboard', 'Projector']
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

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  rsvp_status TEXT DEFAULT 'Pending' CHECK (rsvp_status IN ('Pending', 'Accepted', 'Declined', 'Tentative')),
  UNIQUE(meeting_id, employee_id)
);

-- 4. SHIFT & ROSTER ENGINE
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- 'Morning', 'Evening', 'Night'
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

-- 5. NOTIFICATIONS (Real-time Hub)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT, -- 'Meeting', 'Leave', 'Payroll', 'System'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Enablement
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employee Access" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enterprise Read" ON holidays FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enterprise Full" ON holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Leave Balance Access" ON leave_balances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Meeting Access" ON meetings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Room Access" ON conference_rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Shift Access" ON shifts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Assignment Access" ON shift_assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Notification Access" ON notifications FOR ALL USING (auth.uid() = user_id);

-- MISSION CRITICAL SEED DATA
-- Populate rooms for dropdowns
INSERT INTO conference_rooms (name, capacity, location, equipment) 
VALUES 
('Boardroom Alpha', 12, 'HQ Floor 4', '["VC", "Projector", "Whiteboard"]'),
('Strategy Hub B', 6, 'Operations Wing', '["VC", "Dual-Monitor"]'),
('Meeting Pod 1', 4, 'Tech Zone', '["Smart Display"]')
ON CONFLICT DO NOTHING;

-- Populate shifts for dropdowns
INSERT INTO shifts (name, start_time, end_time, allowance_multiplier)
VALUES 
('Morning Dispatch', '08:00:00', '16:00:00', 1.0),
('Evening Sync', '16:00:00', '00:00:00', 1.1),
('Night Watch', '00:00:00', '08:00:00', 1.25)
ON CONFLICT DO NOTHING;
