
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Factory, Zap, Activity, AlertCircle, PlayCircle, StopCircle, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Production: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ unit_name: '', message: '', status_type: 'Info' });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['production_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('production_logs').select('*').order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    }
  });

  const createLog = useMutation({
    mutationFn: async (newLog: any) => {
      const { data, error } = await supabase.from('production_logs').insert([newLog]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_logs'] });
      setIsModalOpen(false);
      setFormData({ unit_name: '', message: '', status_type: 'Info' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plant & Production</h1>
          <p className="text-slate-500 text-sm">Real-time site output and machinery telemetry.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg">
           <Activity size={18} /> Log Activity
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Log Production Activity</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createLog.mutate(formData); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Name</label>
                  <input required value={formData.unit_name} onChange={(e) => setFormData({...formData, unit_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. Mixing Plant B" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status Type</label>
                  <select value={formData.status_type} onChange={(e) => setFormData({...formData, status_type: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option>Info</option><option>Success</option><option>Warning</option><option>Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message</label>
                  <textarea required value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none h-24" placeholder="Description of event..." />
                </div>
                <button disabled={createLog.isPending} type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center">
                  {createLog.isPending ? <Loader2 className="animate-spin" /> : 'Commit Log'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
             <h3 className="font-bold text-slate-800">Unit Activity Logs</h3>
             <span className="text-[10px] font-bold text-green-600 animate-pulse">● LIVE STREAM</span>
           </div>
           <div className="p-4 space-y-4 h-[400px] overflow-y-auto">
             {logs?.map((log: any) => (
               <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="mt-0.5">
                    {log.status_type === 'Error' ? <StopCircle className="text-red-500" /> : log.status_type === 'Warning' ? <AlertCircle className="text-amber-500" /> : <PlayCircle className="text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{log.unit_name}</p>
                    <p className="text-xs text-slate-500">{log.message}</p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</span>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6 text-center py-20 text-slate-400">Production Analytics Engine Initializing...</h3>
        </div>
      </div>
    </div>
  );
};

export default Production;
