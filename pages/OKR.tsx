
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Target, Flag, TrendingUp, Users, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const OKR: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ objective: '', owner_name: '', progress: '0' });

  const { data: okrs, isLoading } = useQuery({
    queryKey: ['okrs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('okrs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createOKR = useMutation({
    mutationFn: async (newOKR: any) => {
      const { data, error } = await supabase.from('okrs').insert([newOKR]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      setIsModalOpen(false);
      setFormData({ objective: '', owner_name: '', progress: '0' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance (OKR)</h1>
          <p className="text-slate-500 text-sm">Aligning enterprise objectives with site-level key results.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
           <Plus size={18} /> New Objective
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">New OKR Objective</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createOKR.mutate({...formData, progress: parseFloat(formData.progress)}); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objective</label>
                  <input required value={formData.objective} onChange={(e) => setFormData({...formData, objective: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. Reduce churn by 10%" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner</label>
                  <input required value={formData.owner_name} onChange={(e) => setFormData({...formData, owner_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Person Responsible" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Progress (%)</label>
                  <input required type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({...formData, progress: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <button disabled={createOKR.isPending} type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {createOKR.isPending ? <Loader2 className="animate-spin" /> : 'Set Objective'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {okrs?.map((okr: any, i: number) => (
          <motion.div key={okr.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Target size={24} /></div>
                   <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-red-600 transition-colors">{okr.objective}</h3>
                      <p className="text-xs text-slate-500 font-medium">Objective Owner: {okr.owner_name}</p>
                   </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${okr.status === 'Completed' ? 'bg-green-50 text-green-600' : okr.status === 'At Risk' ? 'bg-red-50 text-red-600' : 'bg-red-50 text-red-600'}`}>
                  {okr.status}
                </span>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <span>Completion Progress</span>
                   <span className="text-slate-900">{okr.progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${okr.progress}%` }} className={`h-full ${okr.progress === 100 ? 'bg-green-500' : okr.progress < 50 ? 'bg-red-500' : 'bg-red-500'}`} />
                </div>
             </div>
             <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-bold text-red-600 uppercase">
                View Key Results <ChevronRight size={14} className="ml-1" />
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OKR;
