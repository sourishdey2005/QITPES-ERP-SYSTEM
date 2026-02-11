
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FolderKanban, IndianRupee, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: React.ReactNode; index: number }> = ({ title, value, trend, icon, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-blue-600">
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center">
      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <ArrowUpRight size={14} className="mr-1" /> {trend}
      </span>
      <span className="ml-2 text-xs text-slate-400">FY 2026 Live</span>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: projects } = await supabase.from('projects').select('id', { count: 'exact' });
      const { data: revenue } = await supabase.from('finance_transactions').select('amount').eq('type', 'income');
      const { data: expense } = await supabase.from('finance_transactions').select('amount').eq('type', 'expense');
      const { data: employees } = await supabase.from('profiles').select('id', { count: 'exact' });

      const totalRev = revenue?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalExp = expense?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      return {
        projectCount: projects?.length || 0,
        revenue: totalRev,
        expense: totalExp,
        staffCount: employees?.length || 0
      };
    }
  });

  const { data: recentProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').limit(3).order('created_at', { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="space-y-8 page-transition">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QITPES 2026 Command Center</h1>
          <p className="text-slate-500 mt-1">Real-time enterprise metrics localized for India (₹).</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20"
        >
          Export FY26 Report
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index={0} title="Total Revenue" value={formatCurrency(stats?.revenue || 0)} trend="+18.4%" icon={<IndianRupee size={20} />} />
        <StatCard index={1} title="Total Expenses" value={formatCurrency(stats?.expense || 0)} trend="-2.1%" icon={<TrendingUp size={20} />} />
        <StatCard index={2} title="Active Projects" value={(stats?.projectCount || 0).toString()} trend="+4" icon={<FolderKanban size={20} />} />
        <StatCard index={3} title="Total Workforce" value={(stats?.staffCount || 0).toString()} trend="Growing" icon={<Users size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6">Financial Growth Cycle (₹) - 2026</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan 26', rev: 4500, exp: 2100 },
                { name: 'Feb 26', rev: 5200, exp: 2300 },
                { name: 'Mar 26', rev: 7100, exp: 3100 },
                { name: 'Apr 26', rev: 9400, exp: 4100 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="rev" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6">Site Allocation Status</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ name: 'In Operation', value: 70 }, { name: 'Finalized', value: 30 }]} innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value">
                  {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
             <div className="flex items-center text-xs text-slate-500 font-medium">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div> In Operation
             </div>
             <div className="flex items-center text-xs text-slate-500 font-medium">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div> Finalized
             </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active 2026 Projects</h2>
          <button className="text-blue-600 text-sm font-bold hover:underline uppercase tracking-tight transition-all">Enterprise View</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Master</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Status</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation (₹)</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentProjects?.map((project: any, i: number) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                key={project.id} 
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{project.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(project.budget)}</td>
                <td className="px-6 py-4">
                  <button className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-all">
                    <ChevronRight size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Dashboard;
