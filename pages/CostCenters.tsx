
import React from 'react';
import { PieChart, Landmark, TrendingUp, DollarSign, ArrowUpRight, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../lib/supabase';

const CostCenters: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Centers</h1>
          <p className="text-slate-500 text-sm">Strategic allocation and tracking of project-level burn rates.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-700">
           Initialize New Center
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Logistics Pune', budget: 1200000, spent: 850000, utilization: 71, icon: <Landmark size={20}/>, color: 'text-blue-600' },
          { name: 'Nagpur Site A', budget: 4500000, spent: 4200000, utilization: 93, icon: <Target size={20}/>, color: 'text-amber-600' },
          { name: 'Corporate HQ', budget: 200000, spent: 150000, utilization: 75, icon: <TrendingUp size={20}/>, color: 'text-green-600' },
        ].map((center, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
               <div className={`p-2 bg-slate-50 ${center.color} rounded-lg`}>{center.icon}</div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CENTER-ID: {Math.floor(Math.random()*900)+100}</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-1">{center.name}</h3>
             <div className="flex justify-between items-end mb-4">
                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase">Utilization</p>
                   <p className="text-2xl font-black text-slate-800">{center.utilization}%</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400 font-bold uppercase">Budget</p>
                   <p className="text-sm font-bold text-slate-900">{formatCurrency(center.budget)}</p>
                </div>
             </div>
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${center.utilization}%` }} className={`h-full ${center.utilization > 90 ? 'bg-red-500' : 'bg-blue-500'}`} />
             </div>
             <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Spent: {formatCurrency(center.spent)}</span>
                <button className="text-blue-600 hover:underline">Full Audit</button>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CostCenters;
