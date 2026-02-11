
import React from 'react';
import { 
  LayoutDashboard, FolderKanban, ShoppingCart, Users, Package, Factory, 
  Wrench, Truck, Landmark, Wallet, ReceiptText, PieChart, UserPlus, 
  Clock, FileText, Bell, ShieldCheck, Settings, BrainCircuit 
} from 'lucide-react';
import { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  // Dashboard
  { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  
  // Operations
  { label: 'Projects', href: '/projects', icon: 'projects', roles: ['owner', 'director'], group: 'Operations' },
  { label: 'Planning', href: '/planning', icon: 'planning', roles: ['owner', 'director'], group: 'Operations' },
  { label: 'Purchasing', href: '/purchasing', icon: 'purchasing', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Vendors', href: '/vendors', icon: 'vendors', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Inventory', href: '/inventory', icon: 'inventory', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Production', href: '/production', icon: 'production', roles: ['owner', 'director'], group: 'Operations' },
  
  // Finance
  { label: 'Accounts', href: '/accounts', icon: 'finance', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Ledger', href: '/ledger', icon: 'ledger', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Payables', href: '/payables', icon: 'payables', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Receivables', href: '/receivables', icon: 'receivables', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Budgeting', href: '/budgeting', icon: 'budgeting', roles: ['owner', 'accounting'], group: 'Finance' },
  
  // HR
  { label: 'HR Management', href: '/hr', icon: 'hr', roles: ['owner', 'director'], group: 'HR' },
  { label: 'Payroll', href: '/payroll', icon: 'payroll', roles: ['owner', 'accounting'], group: 'HR' },
  { label: 'Attendance', href: '/attendance', icon: 'attendance', roles: ['owner', 'director'], group: 'HR' },
  
  // Assets
  { label: 'Machinery', href: '/machinery', icon: 'machinery', roles: ['owner', 'director'], group: 'Assets' },
  { label: 'Fleet', href: '/fleet', icon: 'fleet', roles: ['owner', 'director'], group: 'Assets' },
  { label: 'Assets', href: '/assets', icon: 'assets', roles: ['owner', 'director'], group: 'Assets' },

  // Analytics
  { label: 'BI & Analytics', href: '/bi', icon: 'bi', roles: ['owner', 'director'], group: 'Analytics' },
  { label: 'AI Insights', href: '/ai', icon: 'ai', roles: ['owner'], group: 'Analytics' },
  
  // Admin
  { label: 'Documents', href: '/documents', icon: 'documents', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
  { label: 'Audit Logs', href: '/audit', icon: 'audit', roles: ['owner'], group: 'Admin' },
  { label: 'Settings', href: '/settings', icon: 'settings', roles: ['owner'], group: 'Admin' },
];

export const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  projects: <FolderKanban size={18} />,
  purchasing: <ShoppingCart size={18} />,
  vendors: <Users size={18} />,
  inventory: <Package size={18} />,
  production: <Factory size={18} />,
  machinery: <Wrench size={18} />,
  fleet: <Truck size={18} />,
  assets: <Package size={18} />,
  finance: <Landmark size={18} />,
  ledger: <Wallet size={18} />,
  payables: <ReceiptText size={18} />,
  receivables: <ReceiptText size={18} />,
  budgeting: <PieChart size={18} />,
  hr: <UserPlus size={18} />,
  payroll: <Wallet size={18} />,
  attendance: <Clock size={18} />,
  documents: <FileText size={18} />,
  notifications: <Bell size={18} />,
  audit: <ShieldCheck size={18} />,
  settings: <Settings size={18} />,
  ai: <BrainCircuit size={18} />,
  bi: <PieChart size={18} />,
  planning: <Clock size={18} />,
};
