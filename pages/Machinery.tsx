
import React, { useState } from 'react';
import { Wrench, ShieldAlert, Activity, Gauge, Battery, MoreVertical, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Machinery: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([
    { name: 'JCB Excavator 3DX', site: 'Nagpur Site A', hours: 4200, status: 'Healthy', fuel: 85 },
    { name: 'Tower Crane TC-40', site: 'Pune IT Hub', hours: 1200, status: 'Service Due', fuel: 42 },
    { name: 'Concrete Mixer M20', site: 'Mumbai Site 2', hours: 850, status: 'Healthy', fuel: 92 },
  ]);

  const [formData, setFormData] = useState({ name: '', site: '', hours: '', status: 'Healthy', fuel: 100 });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAssets([{ ...formData, hours: parseInt(formData.hours) || 0 }, ...assets]);
    setIsModalOpen(false);
    setFormData({ name: '', site: '', hours: '', status: 'Healthy', fuel: 100 });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Machinery & Assets</h1>
          <p className="text-slate-500 text-sm">Preventive maintenance and real-time equipment health.</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all"
        >
           <Plus size={18} /> Register Asset
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Asset Registration</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Equipment Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Caterpillar D9 Dozer" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assigned Site</label>
                  <input required value={formData.site} onChange={(e) => setFormData({...formData, site: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Nagpur Site B" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Initial Engine Hours</label>
                  <input required type="number" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Add to Fleet</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Value', value: '₹12.4 Cr', icon: <Activity />, color: 'text-blue-600' },
          { label: 'In Operation', value: `${assets.length} / ${assets.length + 3}`, icon: <Gauge />, color: 'text-green-600' },
          { label: 'Critical Service', value: '1 Unit', icon: <ShieldAlert />, color: 'text-red-600' },
          { label: 'Avg Fuel Efficiency', value: '82%', icon: <Battery />, color: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className={`${stat.color} mb-3`}>{stat.icon}</div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.map((machine, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition-all">
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
                   <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Engine Hours</p>
                      <p className="text-sm font-bold text-slate-800">{machine.hours} Hrs</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fuel Level</p>
                      <div className="flex items-center gap-2">
                         <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${machine.fuel}%` }} />
                         </div>
                         <span className="text-xs font-bold text-slate-700">{machine.fuel}%</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Machinery;
