
import React from 'react';
import {
  LayoutDashboard, FolderKanban, ShoppingCart, Users, Package, Factory,
  Wrench, Truck, Landmark, Wallet, ReceiptText, PieChart, UserPlus,
  Clock, FileText, Bell, ShieldCheck, Settings, BrainCircuit,
  GitMerge, Target, Building2, Calendar, Coffee, Video, Monitor,
  Coins, UserCheck, ShieldAlert, Sparkles, FileSpreadsheet
} from 'lucide-react';
import { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  // Dashboard
  { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ['owner', 'director', 'accounting'], group: 'Operations' },

  // Operations
  { label: 'Projects', href: '/projects', icon: 'projects', roles: ['owner', 'director'], group: 'Operations' },
  { label: 'Planning', href: '/planning', icon: 'planning', roles: ['owner', 'director'], group: 'Operations' },
  { label: 'Purchasing', href: '/purchasing', icon: 'purchasing', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Production', href: '/production', icon: 'production', roles: ['owner', 'director'], group: 'Operations' },

  // Site Wage & Workforce
  { label: 'Site Wages', href: '/site-wages', icon: 'wages', roles: ['owner', 'accounting', 'director'], group: 'HR' },

  // Scheduling & Collaboration Suite
  { label: 'Enterprise Calendar', href: '/calendar', icon: 'calendar', roles: ['owner', 'director', 'accounting'], group: 'Finance' },
  { label: 'Meetings & Rooms', href: '/collaboration', icon: 'collaboration', roles: ['owner', 'director', 'accounting'], group: 'Operations' },
  { label: 'Roster & Shifts', href: '/roster', icon: 'attendance', roles: ['owner', 'director'], group: 'HR' },

  // Finance
  { label: 'Accounting Hub', href: '/ledger', icon: 'ledger', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Cost Centers', href: '/cost-centers', icon: 'costcenters', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Tax Engine', href: '/tax', icon: 'ledger', roles: ['owner', 'accounting'], group: 'Finance' },
  { label: 'Budget & Cost', href: '/budget-control', icon: 'budget', roles: ['owner', 'director', 'accounting'], group: 'Finance' },

  // HR
  { label: 'HR Management', href: '/hr', icon: 'hr', roles: ['owner', 'director'], group: 'HR' },
  { label: 'Performance (OKR)', href: '/okr', icon: 'okr', roles: ['owner', 'director'], group: 'HR' },
  { label: 'Payroll', href: '/payroll', icon: 'payroll', roles: ['owner', 'accounting'], group: 'HR' },
  { label: 'Workforce Master', href: '/workforce', icon: 'verify', roles: ['owner', 'director', 'accounting'], group: 'HR' },

  // Assets
  { label: 'Machinery', href: '/machinery', icon: 'machinery', roles: ['owner', 'director'], group: 'Assets' },
  { label: 'Fleet & Fuel', href: '/fleet', icon: 'fleet', roles: ['owner', 'director'], group: 'Assets' },

  // Analytics
  { label: 'BI Analytics', href: '/bi', icon: 'bi', roles: ['owner', 'director'], group: 'Analytics' },
  { label: 'AI Strategy', href: '/ai', icon: 'ai', roles: ['owner'], group: 'Analytics' },
  { label: 'AI Data Analysis', href: '/ai-analysis', icon: 'aianalysis', roles: ['owner', 'director'], group: 'Analytics' },
  { label: 'Data Insights', href: '/data-insights', icon: 'datainsights', roles: ['owner', 'director', 'accounting'], group: 'Analytics' },

  // Admin
  { label: 'Workflows', href: '/workflows', icon: 'workflows', roles: ['owner'], group: 'Admin' },
  { label: 'Access Control', href: '/access-control', icon: 'access', roles: ['owner'], group: 'Admin' },
  { label: 'System Reset', href: '/maintenance', icon: 'maintenance', roles: ['owner'], group: 'Admin' },
  { label: 'Company Settings', href: '/settings', icon: 'settings', roles: ['owner'], group: 'Admin' },
  { label: 'Audit Logs', href: '/audit', icon: 'audit', roles: ['owner'], group: 'Admin' },
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
};
