
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import HR from './pages/HR';
import WorkflowBuilder from './pages/WorkflowBuilder';

// New Enterprise Modules
import Planning from './pages/Planning';
import Purchasing from './pages/Purchasing';
import Production from './pages/Production';
import GeneralLedger from './pages/GeneralLedger';
import AccountingHub from './pages/AccountingHub';
import CostCenters from './pages/CostCenters';
import TaxEngine from './pages/TaxEngine';
import OKR from './pages/OKR';
import Payroll from './pages/Payroll';
import Machinery from './pages/Machinery';
import Fleet from './pages/Fleet';
import BIAnalytics from './pages/BIAnalytics';
import AIStrategy from './pages/AIStrategy';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import SiteWages from './pages/SiteWages';
import BudgetCostControl from './pages/BudgetCostControl';
import WorkforceManagement from './pages/WorkforceManagement';
import SystemMaintenance from './pages/SystemMaintenance';
import AccessControl from './pages/AccessControl';

// Scheduling & Collaboration Suite
import EnterpriseCalendar from './pages/EnterpriseCalendar';
import CollaborationSuite from './pages/CollaborationSuite';
import RosterShifts from './pages/RosterShifts';

// AI & Data Analysis
import AIDataAnalysis from './pages/AIDataAnalysis';
import DataInsights from './pages/DataInsights';

import { UserRole } from './types';

interface AuthContextType {
  user: any;
  role: UserRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  refreshProfile: async () => { }
});

export const useAuth = () => useContext(AuthContext);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium tracking-tight">Securing QITPES Session...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userMetadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data) {
        setRole(data.role as UserRole);
      } else if (userMetadata) {
        // Auto-initialize profile from auth metadata if missing
        const { error: insertError } = await supabase.from('profiles').upsert([{
          id: userId,
          full_name: userMetadata.full_name || '',
          role: userMetadata.role || 'accounting'
        }]);
        if (!insertError) setRole(userMetadata.role || 'accounting');
      }
    } catch (e) {
      console.error('Error fetching profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.user_metadata);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.user_metadata);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfileData = async () => {
    if (session) await fetchProfile(session.user.id, session.user.user_metadata);
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user,
      role,
      loading,
      refreshProfile: refreshProfileData
    }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />

        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />

          {/* Operations Group */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/purchasing" element={<Purchasing />} />
          <Route path="/production" element={<Production />} />
          <Route path="/inventory" element={<Inventory />} />

          {/* Collaboration Suite */}
          <Route path="/calendar" element={<EnterpriseCalendar />} />
          <Route path="/collaboration" element={<CollaborationSuite />} />
          <Route path="/roster" element={<RosterShifts />} />

          {/* Finance Group */}
          <Route path="/ledger" element={<AccountingHub />} />
          <Route path="/cost-centers" element={<CostCenters />} />
          <Route path="/tax" element={<TaxEngine />} />
          <Route path="/accounts" element={<Finance />} />
          <Route path="/budget-control" element={<BudgetCostControl />} />

          {/* HR Group */}
          <Route path="/hr" element={<HR />} />
          <Route path="/okr" element={<OKR />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/site-wages" element={<SiteWages />} />
          <Route path="/workforce" element={<WorkforceManagement />} />

          {/* Assets Group */}
          <Route path="/machinery" element={<Machinery />} />
          <Route path="/fleet" element={<Fleet />} />

          {/* Analytics Group */}
          <Route path="/bi" element={<BIAnalytics />} />
          <Route path="/ai" element={<AIStrategy />} />
          <Route path="/ai-analysis" element={<AIDataAnalysis />} />
          <Route path="/data-insights" element={<DataInsights />} />

          {/* Admin Group */}
          <Route path="/workflows" element={<WorkflowBuilder />} />
          <Route path="/maintenance" element={<SystemMaintenance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/access-control" element={<AccessControl />} />

          <Route path="*" element={
            <div className="p-8 text-center py-20">
              <h1 className="text-2xl font-bold text-slate-800">404 - Module Not Found</h1>
              <p className="text-slate-500 mt-2">The requested enterprise node is not registered in the 2026 registry.</p>
            </div>
          } />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
};

export default App;
