
import React from 'react';
import {
  LayoutDashboard, FolderKanban, ShoppingCart, Users, Package, Factory,
  Wrench, Truck, Landmark, Wallet, ReceiptText, PieChart, UserPlus,
  Clock, FileText, Bell, ShieldCheck, Settings, BrainCircuit,
  GitMerge, Target, Building2, Calendar, Coffee, Video, Monitor,
  Coins, UserCheck, ShieldAlert, Sparkles, FileSpreadsheet, Calculator,
  TrendingUp, Briefcase
} from 'lucide-react';
import { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  // Dashboard - accessible to everyone
  { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ['owner', 'director', 'accounting'], group: 'Operations' },

  // Operations - accessible to everyone
  { label: 'Projects', href: '/projects', icon: 'projects', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Planning', href: '/planning', icon: 'planning', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Production', href: '/production', icon: 'production', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Contracts & Sub-Work', href: '/contracts', icon: 'contracts', roles: ['owner', 'director', 'accounting'], group: 'Contracts' },

  // Procurement
  { label: 'Procurement & Supply', href: '/procurement', icon: 'procurement', roles: ['owner', 'director', 'accounting'], group: 'Procurement' },
  { label: 'Inventory Master', href: '/inventory', icon: 'inventory', roles: ['owner', 'director', 'accounting'], group: 'Procurement' },
  { label: 'Purchasing Ledger', href: '/purchasing', icon: 'purchasing', roles: ['owner', 'director', 'accounting'], group: 'Procurement' },
  { label: 'Vendor Matrix', href: '/vendors', icon: 'suppliers', roles: ['owner', 'director', 'accounting'], group: 'Procurement' },

  // Site Wage & Workforce
  { label: 'Site Wages', href: '/site-wages', icon: 'wages', roles: ['owner', 'director', 'accounting'], group: 'HR' },

  // Scheduling & Collaboration Suite
  { label: 'Enterprise Calendar', href: '/calendar', icon: 'calendar', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Meetings & Rooms', href: '/collaboration', icon: 'collaboration', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Roster & Shifts', href: '/roster', icon: 'attendance', roles: ['owner', 'director', 'accounting'], group: 'HR' },

  // Sales & Marketing
  { label: 'Tenders & Biz-Dev', href: '/biz-dev', icon: 'bizdev', roles: ['owner', 'director', 'accounting'], group: 'Sales & Marketing' },
  { label: 'CRM Master', href: '/crm', icon: 'users', roles: ['owner', 'director', 'accounting'], group: 'Sales & Marketing' },

  // Finance
  { label: 'Tally', href: '/tally', icon: 'tally', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Accounting Hub', href: '/ledger', icon: 'ledger', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Cost Centers', href: '/cost-centers', icon: 'costcenters', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Tax Engine', href: '/tax', icon: 'ledger', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Budget & Cost', href: '/budget-control', icon: 'budget', roles: ['owner', 'director', 'accounting'], group: 'Finance' },

  // HR
  { label: 'HR Management', href: '/hr', icon: 'hr', roles: ['owner', 'director', 'accounting'], group: 'HR' },
  { label: 'Performance (OKR)', href: '/okr', icon: 'okr', roles: ['owner', 'director', 'accounting'], group: 'HR' },
  { label: 'Payroll', href: '/payroll', icon: 'payroll', roles: ['owner', 'director', 'accounting'], group: 'HR' },
  { label: 'Workforce Master', href: '/workforce', icon: 'verify', roles: ['owner', 'director', 'accounting'], group: 'HR' },

  // Assets
  { label: 'Machinery', href: '/machinery', icon: 'machinery', roles: ['owner', 'director', 'accounting'], group: 'Assets' },
  { label: 'Fleet & Fuel', href: '/fleet', icon: 'fleet', roles: ['owner', 'director', 'accounting'], group: 'Assets' },

  // Analytics
  { label: 'Executive Monitor', href: '/executive-monitor', icon: 'executive', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },
  { label: 'BI Analytics', href: '/bi', icon: 'bi', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },
  { label: 'AI Strategy', href: '/ai', icon: 'ai', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },
  { label: 'AI Data Analysis', href: '/ai-analysis', icon: 'aianalysis', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },
  { label: 'Data Insights', href: '/data-insights', icon: 'datainsights', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },

  // Admin
  { label: 'Workflows', href: '/workflows', icon: 'workflows', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
  { label: 'User Approval', href: '/access-control', icon: 'access', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
  { label: 'System Reset', href: '/maintenance', icon: 'maintenance', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
  { label: 'Company Settings', href: '/settings', icon: 'settings', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
  { label: 'Audit Logs', href: '/audit', icon: 'audit', roles: ['owner', 'director', 'accounting'], group: 'Admin' },
];

export const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  projects: <FolderKanban size={18} />,
  purchasing: <ShoppingCart size={18} />,
  inventory: <Package size={18} />,
  production: <Factory size={18} />,
  machinery: <Wrench size={18} />,
  fleet: <Truck size={18} />,
  ledger: <Wallet size={18} />,
  hr: <UserPlus size={18} />,
  payroll: <Wallet size={18} />,
  attendance: <Clock size={18} />,
  documents: <FileText size={18} />,
  audit: <ShieldCheck size={18} />,
  settings: <Settings size={18} />,
  ai: <BrainCircuit size={18} />,
  bi: <PieChart size={18} />,
  planning: <Clock size={18} />,
  workflows: <GitMerge size={18} />,
  okr: <Target size={18} />,
  costcenters: <Landmark size={18} />,
  company: <Building2 size={18} />,
  calendar: <Calendar size={18} />,
  collaboration: <Video size={18} />,
  wages: <Coins size={18} />,
  verify: <UserCheck size={18} />,
  budget: <Wallet size={18} />,
  maintenance: <ShieldAlert size={18} />,
  aianalysis: <Sparkles size={18} />,
  datainsights: <FileSpreadsheet size={18} />,
  access: <UserCheck size={18} />,
  tally: <Calculator size={18} />,
  executive: <TrendingUp size={18} />,
  bizdev: <Briefcase size={18} />,
  procurement: <Truck size={18} />,
  contracts: <ShieldCheck size={18} />,
  suppliers: <Building2 size={18} />,
};
