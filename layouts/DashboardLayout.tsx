
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Menu, X, ChevronRight } from 'lucide-react';
// Fix: Cast motion to any to resolve property 'initial', 'animate', etc. missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, ICON_MAP } from '../constants';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import AIAssistant from '../components/AIAssistant';

const motion = motionBase as any;

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role: userRole, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const groupedNav = NAV_ITEMS.filter(item => {
    if (!userRole) return false;
    if (userRole === 'owner') return true;
    const equivalentRoles = ['owner', 'director', 'accountant'];
    if (equivalentRoles.includes(userRole)) {
      return item.roles.some(role => equivalentRoles.includes(role));
    }
    return item.roles.includes(userRole);
  }).reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col z-50 overflow-hidden shadow-sm"
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
            <span className="text-white font-bold">Q</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 font-bold text-slate-800 tracking-tight whitespace-nowrap"
              >
                QITPES ERP
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.h3
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 whitespace-nowrap"
                  >
                    {group}
                  </motion.h3>
                ) : (
                  <motion.div key="collapsed" className="h-4" />
                )}
              </AnimatePresence>
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-lg transition-all group relative ${
                          isActive
                            ? 'bg-red-50 text-red-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={!sidebarOpen ? item.label : ''}
                      >
                        <span className={`${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          {ICON_MAP[item.icon]}
                        </span>
                        <AnimatePresence mode="wait">
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="ml-3 text-sm whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 w-1 h-6 bg-red-600 rounded-r-full"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
           <button
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
           >
             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
             title="Logout"
           >
             <LogOut size={20} />
             {sidebarOpen && <span className="ml-3 text-sm font-medium">Sign Out</span>}
           </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Enterprise Command (Search or Ask AI)..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="flex flex-col items-end mr-1">
                <span className="text-sm font-semibold text-slate-700">{user?.email?.split('@')[0] || 'User'}</span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{userRole}</span>
              </div>
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center overflow-hidden border border-blue-100 group-hover:border-blue-300 transition-all">
                <User size={20} className="text-red-600" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-8 max-w-7xl mx-auto"
            >
               <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default DashboardLayout;
