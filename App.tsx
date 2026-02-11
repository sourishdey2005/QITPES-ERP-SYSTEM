
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
  refreshProfile: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Securing Enterprise Session...</p>
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) setRole(data.role as UserRole);
    } catch (e) {
      console.error('Error fetching profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user: session?.user, 
      role, 
      loading, 
      refreshProfile: async () => { if (session) await fetchProfile(session.user.id); } 
    }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/accounts" element={<Finance />} />
          <Route path="/hr" element={<HR />} />
          
          <Route path="*" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-800">Module Under Construction</h1>
              <p className="text-slate-500 mt-2">This module is part of the QITPES ERP 2026 roadmap.</p>
            </div>
          } />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
};

export default App;
