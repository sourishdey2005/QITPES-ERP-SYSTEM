
import React from 'react';
import { Target, Flag, TrendingUp, Users, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const OKR: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance (OKR)</h1>
          <p className="text-slate-500 text-sm">Aligning enterprise objectives with site-level key results.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
           <Plus size={18} /> New Objective
        </button>
      </div>

      <div className="space-y-4">
        {[
          { objective: 'Complete Nagpur Site A Foundation', status: 'On Track', progress: 85, owner: 'A. Hazra' },
          { objective: 'Reduce Procurement Burn Rate by 12%', status: 'At Risk', progress: 42, owner: 'S. Verma' },
          { objective: 'Digitalize Warehouse Log System', status: 'Completed', progress: 100, owner: 'D. Sen' },
        ].map((okr, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={24} /></div>
                   <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{okr.objective}</h3>
                      <p className="text-xs text-slate-500 font-medium">Objective Owner: {okr.owner}</p>
                   </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${okr.status === 'Completed' ? 'bg-green-50 text-green-600' : okr.status === 'At Risk' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {okr.status}
                </span>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <span>Completion Progress</span>
                   <span className="text-slate-900">{okr.progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${okr.progress}%` }} className={`h-full ${okr.progress === 100 ? 'bg-green-500' : okr.progress < 50 ? 'bg-red-500' : 'bg-blue-500'}`} />
                </div>
             </div>
             <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex -space-x-2">
                   {[1,2,3].map(j => <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U{j}</div>)}
                </div>
                <button className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-widest group-hover:underline">
                   View Key Results <ChevronRight size={14} className="ml-1" />
                </button>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OKR;
