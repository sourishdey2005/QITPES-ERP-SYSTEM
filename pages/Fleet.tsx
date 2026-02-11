
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Truck, MapPin, Activity, Search, X, Loader2, Plus, ArrowUpRight } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Fleet: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ vehicle_number: '', vehicle_type: 'Dump Truck', current_location: '' });

  const { data: fleet, isLoading } = useQuery({
    queryKey: ['fleet'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fleet').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addVehicle = useMutation({
    mutationFn: async (newVehicle: any) => {
      const { data, error } = await supabase.from('fleet').insert([{
        ...newVehicle,
        status: 'Ready'
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setIsModalOpen(false);
      setFormData({ vehicle_number: '', vehicle_type: 'Dump Truck', current_location: '' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet & Logistics</h1>
          <p className="text-slate-500 text-sm">Deployment oversight and real-time routing management.</p>
        </motion.div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Register Vehicle
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Add Fleet Vehicle</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addVehicle.mutate(formData); }} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Plate Number</label>
                  <input required value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono uppercase" placeholder="MH-12-XX-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Type</label>
                  <select value={formData.vehicle_type} onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm">
                    <option>Dump Truck</option>
                    <option>Concrete Mixer</option>
                    <option>Service Van</option>
                    <option>Excavator Carrier</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Site Deployment</label>
                  <input required value={formData.current_location} onChange={(e) => setFormData({...formData, current_location: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="e.g. Pune Hub" />
                </div>
                <button disabled={addVehicle.isPending} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all">
                  {addVehicle.isPending ? <Loader2 className="animate-spin" /> : <><Truck size={18} /> Register to Fleet</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
         <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-blue-500" /> Active Registry</h3>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-8 py-5">Vehicle Plate</th>
                  <th className="px-8 py-5">Asset Type</th>
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Verification</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
               ) : fleet?.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic">No vehicles detected in enterprise fleet registry.</td>
                 </tr>
               ) : fleet?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 group transition-all">
                     <td className="px-8 py-5 font-black text-slate-900 font-mono tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{v.vehicle_number}</td>
                     <td className="px-8 py-5 text-slate-500">{v.vehicle_type}</td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                           {v.current_location}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 tracking-tight">
                           {v.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <button className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-xl transition-all">
                           <ArrowUpRight size={16} />
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Fleet;
