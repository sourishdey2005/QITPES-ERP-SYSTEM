
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { GitMerge, Plus, ArrowRight, UserCheck, ShieldAlert, Clock, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const WorkflowBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', module: 'Procurement', steps: '1' });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createWorkflow = useMutation({
    mutationFn: async (newWF: any) => {
      const { data, error } = await supabase.from('workflows').insert([newWF]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsModalOpen(false);
      setFormData({ name: '', module: 'Procurement', steps: '1' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Engine</h1>
          <p className="text-slate-500">Define multi-level approval chains and automation rules.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">
          <Plus size={18} className="mr-2" /> Create Workflow
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">New Automation Workflow</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createWorkflow.mutate({...formData, steps: parseInt(formData.steps)}); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Workflow Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. PO High-Value Approval" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Module</label>
                  <select value={formData.module} onChange={(e) => setFormData({...formData, module: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option>Procurement</option><option>HR</option><option>Finance</option><option>Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Approval Levels</label>
                  <input required type="number" min="1" max="5" value={formData.steps} onChange={(e) => setFormData({...formData, steps: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <button disabled={createWorkflow.isPending} type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {createWorkflow.isPending ? <Loader2 className="animate-spin" /> : 'Register Workflow'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workflows?.map((wf: any, i: number) => (
          <motion.div 
            key={wf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <GitMerge size={20} />
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${wf.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {wf.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{wf.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{wf.module}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <UserCheck size={14} className="mr-1.5 text-blue-500" />
                {wf.steps} Level Approval
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
