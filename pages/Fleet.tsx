
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Truck, MapPin, Activity, Search, X, Loader2, Plus, ArrowUpRight, Edit3, CheckCircle2, AlertTriangle, Settings2 } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Fleet: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const [formData, setFormData] = useState({ vehicle_number: '', vehicle_type: 'Dump Truck', current_location: '' });
  const [updateData, setUpdateData] = useState({ status: 'Ready', work_details: '', location: '' });

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
      const { data, error } = await supabase.from('fleet').insert([newVehicle]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setIsModalOpen(false);
      setFormData({ vehicle_number: '', vehicle_type: 'Dump Truck', current_location: '' });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, last_work_details, current_location }: any) => {
      const { data, error } = await supabase.from('fleet')
        .update({ status, last_work_details, current_location, updated_at: new Date() })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setIsUpdateModalOpen(false);
      setSelectedVehicle(null);
    }
  });

  const handleOpenUpdate = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setUpdateData({ 
      status: vehicle.status, 
      work_details: vehicle.last_work_details || '', 
      location: vehicle.current_location || '' 
    });
    setIsUpdateModalOpen(true);
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-black">Fleet & Logistics Core</h1>
          <p className="text-slate-500 text-sm">Deployment oversight and real-time lifecycle management.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Register Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Assets" value={fleet?.length || 0} icon={<Truck size={20} />} color="blue" />
        <StatCard label="In Transit" value={fleet?.filter(v => v.status === 'In Transit').length || 0} icon={<Activity size={20} />} color="emerald" />
        <StatCard label="In Service" value={fleet?.filter(v => v.status === 'Maintenance').length || 0} icon={<Settings2 size={20} />} color="amber" />
        <StatCard label="Ready Pool" value={fleet?.filter(v => v.status === 'Ready').length || 0} icon={<CheckCircle2 size={20} />} color="indigo" />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
         <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-blue-500" /> Active Operational Registry</h3>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-8 py-5">Vehicle Plate</th>
                  <th className="px-8 py-5">Asset Type</th>
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
               ) : fleet?.length === 0 ? (
                 <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic">No vehicles detected in enterprise fleet registry.</td></tr>
               ) : fleet?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 group transition-all">
                     <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="font-black text-slate-900 font-mono tracking-tighter uppercase">{v.vehicle_number}</span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">ID: {v.id.slice(0,8)}</span>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-slate-500 font-bold">{v.vehicle_type}</td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                           <MapPin size={14} className="text-slate-400" />
                           {v.current_location || 'Not Specified'}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          v.status === 'Ready' ? 'bg-green-50 text-green-600' :
                          v.status === 'In Transit' ? 'bg-blue-50 text-blue-600' :
                          v.status === 'Maintenance' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                           {v.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleOpenUpdate(v)}
                          className="flex items-center gap-2 ml-auto px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-xs"
                        >
                           <Edit3 size={14} /> Update Status
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Fleet Vehicle</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addVehicle.mutate(formData); }} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plate Number</label>
                  <input required value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono uppercase" placeholder="MH-12-XX-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                  <select value={formData.vehicle_type} onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option>Dump Truck</option><option>Concrete Mixer</option><option>Service Van</option><option>Excavator Carrier</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Deployment Site</label>
                  <input required value={formData.current_location} onChange={(e) => setFormData({...formData, current_location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="e.g. Nagpur Phase II" />
                </div>
                <button disabled={addVehicle.isPending} type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                  {addVehicle.isPending ? <Loader2 className="animate-spin" /> : <><Truck size={18} /> Confirm Registration</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* UPDATE STATUS MODAL */}
        {isUpdateModalOpen && selectedVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Vehicle Status Update</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">{selectedVehicle.vehicle_number}</p>
                </div>
                <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</label>
                       <select 
                         value={updateData.status} 
                         onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                         className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                       >
                         <option value="Ready">Ready (In Pool)</option>
                         <option value="In Transit">In Transit (Active Work)</option>
                         <option value="Returned">Returned (Awaiting Clean)</option>
                         <option value="Maintenance">Maintenance (Workshop)</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Site</label>
                       <input 
                         value={updateData.location} 
                         onChange={(e) => setUpdateData({...updateData, location: e.target.value})}
                         className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
                         placeholder="e.g. Pune Hub"
                       />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work / Return Details</label>
                    <textarea 
                      value={updateData.work_details}
                      onChange={(e) => setUpdateData({...updateData, work_details: e.target.value})}
                      className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-blue-500/10 transition-all"
                      placeholder="Enter details of trip, load carried, or return inspection notes..."
                    />
                 </div>

                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase">Enterprise Policy: All status changes are logged in the 2026 Audit Trail for insurance compliance.</p>
                 </div>

                 <button 
                   onClick={() => updateStatus.mutate({ id: selectedVehicle.id, status: updateData.status, last_work_details: updateData.work_details, current_location: updateData.location })}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                 >
                    {updateStatus.isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Commit Asset Update</>}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all cursor-default group">
    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:bg-blue-600 group-hover:text-white transition-colors`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-xl font-black text-slate-900">{value}</h3>
    </div>
  </div>
);

export default Fleet;
