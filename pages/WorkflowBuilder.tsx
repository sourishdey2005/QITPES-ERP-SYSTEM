
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { GitMerge, Plus, ArrowRight, UserCheck, ShieldAlert, Clock, X, Loader2, ListFilter, Activity, LayoutGrid } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const WorkflowBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    module: 'Procurement', 
    steps: '1', 
    description: '' 
  });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const createWorkflow = useMutation({
    mutationFn: async (newWF: any) => {
      const { data, error } = await supabase.from('workflows').insert([{
        name: newWF.name,
        module: newWF.module,
        steps: parseInt(newWF.steps),
        description: newWF.description,
        status: 'Active'
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsModalOpen(false);
      setFormData({ name: '', module: 'Procurement', steps: '1', description: '' });
    },
    onError: (err: any) => {
      alert("Registration Error: " + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    createWorkflow.mutate(formData);
  };

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automation Workflow Engine</h1>
          <p className="text-slate-500 text-sm">Define multi-level governance chains and operational logic.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all gap-2"
        >
          <Plus size={18} /> Design New Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-6 rounded-[32px] text-white flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Protocols</p>
               <h3 className="text-3xl font-black">{workflows?.length || 0}</h3>
            </div>
            <Activity size={40} className="text-blue-500/20 absolute -right-2 -bottom-2" />
         </div>
         <div className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Logic Steps</p>
               <h3 className="text-3xl font-black text-slate-900">{workflows?.reduce((s:any,w:any) => s + (w.steps || 0), 0) || 0}</h3>
            </div>
            <LayoutGrid size={32} className="text-slate-100" />
         </div>
         <div className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Governance Integrity</p>
               <h3 className="text-3xl font-black text-blue-600">100%</h3>
            </div>
            <UserCheck size={32} className="text-slate-100" />
         </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logic Registration</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Define site-level authority</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all shadow-sm"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Identifier</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="e.g. CapEx High-Value Approval" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Module</label>
                    <select value={formData.module} onChange={(e) => setFormData({...formData, module: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm">
                      <option>Procurement</option><option>HR</option><option>Finance</option><option>Operations</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval Levels</label>
                    <input required type="number" min="1" max="5" value={formData.steps} onChange={(e) => setFormData({...formData, steps: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Context</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium" placeholder="Describe the trigger condition for this protocol..." />
                </div>
                <button disabled={createWorkflow.isPending} type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  {createWorkflow.isPending ? <Loader2 className="animate-spin" /> : <><GitMerge size={20} /> Register Workflow</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />)
        ) : workflows?.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center">
             <GitMerge size={48} className="mx-auto text-slate-200 mb-4" />
             <h3 className="text-xl font-bold text-slate-400">Zero Automation Nodes Detected</h3>
             <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-black">Initialize first protocol to begin governance.</p>
          </div>
        ) : workflows?.map((wf: any, i: number) => (
          <motion.div 
            key={wf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-[20px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <GitMerge size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${wf.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {wf.status}
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-xl mb-2 group-hover:text-blue-600 transition-colors">{wf.name}</h3>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-4">{wf.module} COMPONENT</p>
            
            <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[40px] mb-8">{wf.description || 'Enterprise governance protocol for multi-level verification.'}</p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                   {[...Array(Math.min(wf.steps, 3))].map((_, x) => (
                     <div key={x} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600">
                        {x+1}
                     </div>
                   ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wf.steps} STAGES</span>
              </div>
              <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
            </div>
            
            {/* Visual background hint */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-1000 -z-0 opacity-50" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
