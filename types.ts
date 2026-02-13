export type UserRole = 'owner' | 'director' | 'accounting';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  company_id?: string;
  branch_id?: string;
  permissions: string[];
  avatar_url: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  gstin: string;
  subscription_tier: 'Standard' | 'Premium' | 'Enterprise';
  settings: any;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold';
  budget: number;
}

export interface Workflow {
  id: string;
  name: string;
  trigger_module: string;
  is_active: boolean;
}

export interface OKR {
  id: string;
  objective: string;
  key_result: string;
  target_value: number;
  current_value: number;
  quarter: string;
  year: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: 'Operations' | 'Finance' | 'HR' | 'Assets' | 'Analytics' | 'Admin' | 'Sales & Marketing' | 'Procurement';
}