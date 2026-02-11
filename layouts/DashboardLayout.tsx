
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bell, Search, User, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, ICON_MAP } from '../constants';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const userRole = 'owner'; // In real app, get from auth context

  const groupedNav = NAV_ITEMS.filter(item => item.roles.includes(userRole as any)).reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col z-50 overflow-hidden"
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
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

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 whitespace-nowrap"
                  >
                    {group}
                  </motion.h3>
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
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title={!sidebarOpen ? item.label : ''}
                      >
                        <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
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
                            className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
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

        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
           >
             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </span>
              <input 
                type="text" 
                placeholder="Search resources..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="flex flex-col items-end mr-1">
                <span className="text-sm font-medium text-slate-700">Enterprise Admin</span>
                <span className="text-xs text-slate-400 capitalize">{userRole}</span>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-blue-200 transition-all">
                <User size={20} className="text-slate-400 group-hover:text-blue-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
