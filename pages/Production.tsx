
import React from 'react';
import { Factory, Zap, Activity, AlertCircle, PlayCircle, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Production: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plant & Production</h1>
          <p className="text-slate-500 text-sm">Real-time site output and machinery telemetry.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2">
             <Activity size={18} /> Live Monitor
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Zap size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Production Efficiency</p>
              <h3 className="text-2xl font-bold text-slate-900">94.8%</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Factory size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Active Lines</p>
              <h3 className="text-2xl font-bold text-slate-900">12 / 14</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Downtime Incidents</p>
              <h3 className="text-2xl font-bold text-slate-900">2 Pending</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between">
             <h3 className="font-bold text-slate-800">Unit Activity Logs</h3>
             <span className="text-[10px] font-bold text-green-600 animate-pulse">● LIVE STREAM</span>
           </div>
           <div className="p-4 space-y-4">
             {[
               { unit: 'Casting Unit 4', msg: 'Started operation cycle', time: '2 mins ago', icon: <PlayCircle className="text-green-500" /> },
               { unit: 'Mixing Plant B', msg: 'Material shortage alert', time: '14 mins ago', icon: <AlertCircle className="text-amber-500" /> },
               { unit: 'Crane 08', msg: 'Shutdown for maintenance', time: '1 hour ago', icon: <StopCircle className="text-red-500" /> },
             ].map((log, i) => (
               <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="mt-0.5">{log.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{log.unit}</p>
                    <p className="text-xs text-slate-500">{log.msg}</p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{log.time}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">Output Target vs Actual</h3>
           <div className="space-y-6">
             {[
               { label: 'Cement Block (Units)', target: 10000, actual: 8500, color: 'bg-blue-500' },
               { label: 'Steel Reinforcement (Tons)', target: 200, actual: 195, color: 'bg-emerald-500' },
               { label: 'Aggregate Mix (Cu.M)', target: 500, actual: 320, color: 'bg-amber-500' },
             ].map((item, i) => (
               <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                    <span>{item.label}</span>
                    <span>{Math.round((item.actual/item.target)*100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.actual/item.target)*100}%` }} className={`h-full ${item.color}`} />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-medium">
                    <span>Target: {item.target}</span>
                    <span>Actual: {item.actual}</span>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Production;
