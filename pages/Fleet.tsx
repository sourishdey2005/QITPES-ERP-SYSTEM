
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Truck, MapPin, Fuel, ShieldCheck, Activity, Search, Filter, X, Loader2 } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-slate-900">Fleet & Fuel Logistics</h1>
          <p className="text-slate-500 text-sm">Monitoring vehicle deployments and active routing logs.</p>
        </motion.div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Fleet Vehicle</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addVehicle.mutate(formData); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Plate Number</label>
                  <input required value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono" placeholder="MH-12-XX-0000" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Type</label>
                  <select value={formData.vehicle_type} onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option>Dump Truck</option>
                    <option>Concrete Mixer</option>
                    <option>Service Van</option>
                    <option>Excavator Carrier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Deployment Site</label>
                  <input required value={formData.current_location} onChange={(e) => setFormData({...formData, current_location: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Enter Site Name" />
                </div>
                <button disabled={addVehicle.isPending} type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  {addVehicle.isPending ? <Loader2 className="animate-spin" /> : 'Register Vehicle'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Active Fleet Registry</h3>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4">Vehicle ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Current Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Registered</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
               {fleet?.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">No vehicles in active fleet. Register your first vehicle to begin tracking.</td>
                 </tr>
               ) : fleet?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 group transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-900 font-mono tracking-tighter group-hover:text-blue-600">{v.vehicle_number}</td>
                     <td className="px-6 py-4 text-slate-500 font-medium">{v.vehicle_type}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                           <MapPin size={14} className="text-red-500" /> {v.current_location}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-600">
                           {v.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right text-slate-400 font-medium">{new Date(v.created_at).toLocaleDateString()}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

// Helper components for the modal
const Plus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default Fleet;
