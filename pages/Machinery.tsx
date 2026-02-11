
import React from 'react';
import { Wrench, ShieldAlert, Activity, Gauge, Battery, MoreVertical, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Machinery: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Machinery & Assets</h1>
          <p className="text-slate-500 text-sm">Preventive maintenance and real-time equipment health.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
           <Plus size={18} /> Register Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Value', value: '₹12.4 Cr', icon: <Activity />, color: 'text-blue-600' },
          { label: 'In Operation', value: '42 / 45', icon: <Gauge />, color: 'text-green-600' },
          { label: 'Critical Service', value: '3 Units', icon: <ShieldAlert />, color: 'text-red-600' },
          { label: 'Avg Fuel Efficiency', value: '78%', icon: <Battery />, color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className={`${stat.color} mb-3`}>{stat.icon}</div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { name: 'JCB Excavator 3DX', site: 'Nagpur Site A', hours: 4200, status: 'Healthy', fuel: 85 },
          { name: 'Tower Crane TC-40', site: 'Pune IT Hub', hours: 1200, status: 'Service Due', fuel: 42 },
          { name: 'Concrete Mixer M20', site: 'Mumbai Site 2', hours: 850, status: 'Healthy', fuel: 92 },
        ].map((machine, i) => (
          <motion.div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
             <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><Wrench size={32} /></div>
             <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <h3 className="font-bold text-slate-900 text-lg">{machine.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Assigned to: {machine.site}</p>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${machine.status === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {machine.status}
                   </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                   <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Engine Hours</p>
                      <p className="text-sm font-bold text-slate-800">{machine.hours} Hrs</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fuel Level</p>
                      <div className="flex items-center gap-2">
                         <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${machine.fuel}%` }} />
                         </div>
                         <span className="text-xs font-bold text-slate-700">{machine.fuel}%</span>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Machinery;
