
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { PieChart as PieIcon, TrendingUp, Filter, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const DATA = [
  { name: 'Jan', rev: 4000, exp: 2400 },
  { name: 'Feb', rev: 3000, exp: 1398 },
  { name: 'Mar', rev: 2000, exp: 9800 },
  { name: 'Apr', rev: 2780, exp: 3908 },
  { name: 'May', rev: 1890, exp: 4800 },
  { name: 'Jun', rev: 2390, exp: 3800 },
];

const BIAnalytics: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enterprise BI Analytics</h1>
          <p className="text-slate-500 text-sm">Advanced data visualization for strategic 2026 decision making.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2">
             <Calendar size={16} /> Last 6 Months
           </button>
           <button className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2">
             <Filter size={16} /> Advanced Filter
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">Revenue vs Expenses (Monthly)</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={DATA}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                 <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                 <Bar dataKey="rev" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="exp" fill="#ef4444" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">Growth Trend (FY 2026)</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={DATA}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                 <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                 <Tooltip />
                 <Area type="monotone" dataKey="rev" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BIAnalytics;
