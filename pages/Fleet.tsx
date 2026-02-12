
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Truck, MapPin, Activity, Search, X, Loader2, Plus, 
  Settings2, CheckCircle2, AlertTriangle, Edit3, Navigation, 
  History, Gauge, ArrowRightLeft, ClipboardCheck
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Fleet: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  const [formData, setFormData] = useState({ vehicle_number: '', vehicle_type: 'Dump Truck', current_location: '' });
  const [updateData, setUpdateData] = useState({ status: 'Ready', work_details: '', location: '', odometer: '' });

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
    mutationFn: async ({ id, status, last_work_details, current_location, odometer }: any) => {
      const { data, error } = await supabase.from('fleet')
        .update({ 
          status, 
          last_work_details, 
          current_location, 
          odometer_reading: parseFloat(odometer) || 0,
          updated_at: new Date() 
        })
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
      location: vehicle.current_location || '',
      odometer: vehicle.odometer_reading?.toString() || '0'
    });
    setIsUpdateModalOpen(true);
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet & Logistics Lifecycle</h1>
          <p className="text-slate-500 text-sm">Real-time status management and asset telemetry.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-orange-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Register Asset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Assets" value={fleet?.length || 0} icon={<Truck size={20} />} color="blue" />
        <StatCard label="In Transit" value={fleet?.filter(v => v.status === 'In Transit').length || 0} icon={<Navigation size={20} />} color="emerald" />
        <StatCard label="Service Dept" value={fleet?.filter(v => v.status === 'Maintenance').length || 0} icon={<Settings2 size={20} />} color="amber" />
        <StatCard label="Ready Pool" value={fleet?.filter(v => v.status === 'Ready').length || 0} icon={<CheckCircle2 size={20} />} color="indigo" />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
         <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-orange-500" /> Operational Unit Registry
            </h3>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5">Current Deployment</th>
                  <th className="px-8 py-5">Odometer (KM)</th>
                  <th className="px-8 py-5">Lifecycle Status</th>
                  <th className="px-8 py-5 text-right">Operational Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-600" /></td></tr>
               ) : fleet?.length === 0 ? (
                 <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic">No assets detected in enterprise registry.</td></tr>
               ) : fleet?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 group transition-all">
                     <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="font-black text-slate-900 font-mono tracking-tighter uppercase">{v.vehicle_number}</span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{v.vehicle_type}</span>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                           <MapPin size={14} className="text-slate-400" />
                           {v.current_location || 'Hingewadi Hub'}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-600">
                           <Gauge size={14} className="text-slate-400" />
                           {v.odometer_reading?.toLocaleString() || 0}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          v.status === 'Ready' ? 'bg-green-50 text-green-600' :
                          v.status === 'In Transit' ? 'bg-orange-50 text-orange-600' :
                          v.status === 'Maintenance' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                           {v.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleOpenUpdate(v)}
                          className="flex items-center gap-2 ml-auto px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all font-bold text-xs"
                        >
                           <ArrowRightLeft size={14} /> Update Lifecycle
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* UPDATE STATUS MODAL (SAP Style) */}
      <AnimatePresence>
        {isUpdateModalOpen && selectedVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lifecycle Intelligence</h3>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-0.5">{selectedVehicle.vehicle_number} Registry Update</p>
                </div>
                <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-all shadow-sm"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Status</label>
                       <select 
                         value={updateData.status} 
                         onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/5 transition-all"
                       >
                         <option value="Ready">Ready (In Hub)</option>
                         <option value="In Transit">In Transit (Active Dispatch)</option>
                         <option value="Returned">Returned (Awaiting Inspection)</option>
                         <option value="Maintenance">Maintenance (Workshop)</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odometer Update (KM)</label>
                       <input 
                         type="number"
                         value={updateData.odometer} 
                         onChange={(e) => setUpdateData({...updateData, odometer: e.target.value})}
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-black"
                       />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission / Maintenance Log</label>
                    <textarea 
                      value={updateData.work_details}
                      onChange={(e) => setUpdateData({...updateData, work_details: e.target.value})}
                      className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-orange-500/5 transition-all"
                      placeholder="Specify mission details, load specs, or maintenance requirements..."
                    />
                 </div>

                 <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-start gap-3">
                    <ClipboardCheck className="text-orange-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] text-orange-700 font-bold leading-relaxed uppercase">Enterprise Assurance: This update will trigger an audit trail entry in the Global Compliance Ledger.</p>
                 </div>

                 <button 
                   onClick={() => updateStatus.mutate({ 
                     id: selectedVehicle.id, 
                     status: updateData.status, 
                     last_work_details: updateData.work_details, 
                     current_location: updateData.location,
                     odometer: updateData.odometer 
                   })}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                 >
                    {updateStatus.isPending ? <Loader2 className="animate-spin" /> : <><Activity size={18} /> Commit Asset Update</>}
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
  <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-all cursor-default group">
    <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-500`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
  </div>
);

export default Fleet;
