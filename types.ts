
export type UserRole = 'owner' | 'director' | 'accounting';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold';
  budget: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  project_id?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  group: 'Operations' | 'Finance' | 'HR' | 'Assets' | 'Analytics' | 'Admin';
}
