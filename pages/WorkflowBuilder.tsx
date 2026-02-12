
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  GitMerge, Plus, ArrowRight, UserCheck, ShieldAlert,
  X, Loader2, Activity, LayoutGrid, CheckCircle2,
  Settings, Zap, ShieldCheck, Pencil, Trash2
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const WorkflowBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
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

  const saveWorkflow = useMutation({
    mutationFn: async (wfData: any) => {
      // Professional step-config generation
      const stepsConfig = Array.from({ length: parseInt(wfData.steps) }, (_, i) => ({
        stage: i + 1,
        role: i === 0 ? 'Department Head' : 'Executive Director',
        action: 'Approve'
      }));

      const payload = {
        name: wfData.name,
        module: wfData.module,
        steps: parseInt(wfData.steps),
        description: wfData.description,
        config: stepsConfig,
        status: editingWorkflow ? editingWorkflow.status : 'Active'
      };

      let result;
      if (editingWorkflow) {
        result = await supabase.from('workflows').update(payload).eq('id', editingWorkflow.id).select();
      } else {
        result = await supabase.from('workflows').insert([payload]).select();
      }

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsModalOpen(false);
      setEditingWorkflow(null);
      setFormData({ name: '', module: 'Procurement', steps: '1', description: '' });
      alert(editingWorkflow ? '✅ Protocol updated successfully!' : '✅ Protocol registered!');
    },
    onError: (err: any) => {
      alert("Operational Fault: " + err.message);
    }
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workflows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      alert('🗑️ Protocol decommissioned.');
    },
    onError: (err: any) => {
      alert(`❌ Delete Failed: ${err.message}`);
    }
  });

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      module: workflow.module || 'Procurement',
      steps: workflow.steps?.toString() || '1',
      description: workflow.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    saveWorkflow.mutate(formData);
  };

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Automation Protocols</h1>
          <p className="text-slate-500 text-sm font-medium">Standardize governance and multi-stage verification across site modules.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-8 py-3.5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-500/30 hover:bg-orange-700 transition-all gap-3"
        >
          <Plus size={18} /> Initialize Logic Node
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard label="Active Protocols" value={workflows?.length || 0} icon={<Zap size={24} />} trend="Global Sync" />
        <MetricCard label="Logic Nodes" value={workflows?.reduce((s: any, w: any) => s + (w.steps || 0), 0) || 0} icon={<LayoutGrid size={24} />} trend="Automated" />
        <MetricCard label="Governance Health" value="100%" icon={<ShieldCheck size={24} />} trend="Verified" color="text-orange-600" />
      </div>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingWorkflow ? 'Update Protocol' : 'Logic Configuration'}</h3>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Design automated approval chain</p>
                </div>
                <button onClick={() => { setIsModalOpen(false); setEditingWorkflow(null); setFormData({ name: '', module: 'Procurement', steps: '1', description: '' }); }} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Identifier</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-slate-900 focus:ring-8 focus:ring-orange-500/5 transition-all text-lg" placeholder="e.g. Asset Acquisition Level 4" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enterprise Module</label>
                    <select value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                      <option>Procurement</option><option>HRM</option><option>Finance</option><option>Logistics</option><option>Assets</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Levels</label>
                    <input required type="number" min="1" max="5" value={formData.steps} onChange={(e) => setFormData({ ...formData, steps: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trigger Context</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none text-sm font-medium resize-none" placeholder="Describe the operational state that triggers this logic..." />
                </div>
                <button disabled={saveWorkflow.isPending} type="submit" className="w-full py-6 bg-orange-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-orange-500/40 hover:bg-orange-700 transition-all flex items-center justify-center gap-4 group">
                  {saveWorkflow.isPending ? <Loader2 className="animate-spin" /> : <><Zap size={20} className="group-hover:scale-125 transition-transform" /> {editingWorkflow ? 'Update Protocol' : 'Register Protocol'}</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-80 bg-white rounded-[48px] border border-slate-100 animate-pulse" />)
        ) : workflows?.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[64px] border-4 border-dashed border-slate-100 text-center">
            <GitMerge size={64} className="mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Zero Protocols Detected</h3>
            <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-black">Begin by initializing your first enterprise logic node.</p>
          </div>
        ) : workflows?.map((wf: any, i: number) => (
          <motion.div
            key={wf.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="p-5 bg-orange-50 text-orange-600 rounded-[24px] group-hover:bg-orange-600 group-hover:text-white transition-all duration-700">
                <GitMerge size={28} />
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${wf.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {wf.status}
              </span>
            </div>

            <div className="relative z-10 flex-1">
              <h3 className="font-black text-slate-900 text-2xl mb-2 group-hover:text-orange-600 transition-colors leading-tight tracking-tight">{wf.name}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-6">{wf.module} ENGINE NODE</p>
              <p className="text-sm text-slate-500 font-medium line-clamp-3 min-h-[60px] leading-relaxed">{wf.description || 'Enterprise-grade governance protocol optimized for real-time site verification.'}</p>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[...Array(Math.min(wf.steps, 3))].map((_, x) => (
                    <div key={x} className="w-8 h-8 rounded-full bg-orange-100 border-4 border-white flex items-center justify-center text-[10px] font-black text-orange-600">
                      {x + 1}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{wf.steps} AUTHORIZATION STAGES</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(wf); }} className="p-2.5 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Decommission protocol "${wf.name}"?`)) deleteWorkflow.mutate(wf.id); }} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Visual background hint */}
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-slate-50 rounded-full group-hover:scale-[2] transition-transform duration-1000 -z-0 opacity-40 group-hover:bg-orange-50" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, trend, color = "text-slate-900" }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-orange-100 transition-all">
    <div className="relative z-10">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      <h3 className={`text-4xl font-black ${color} tracking-tighter`}>{value}</h3>
      <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">● {trend}</p>
    </div>
    <div className="p-5 bg-slate-50 text-slate-200 rounded-3xl group-hover:bg-orange-50 group-hover:text-orange-200 transition-all duration-700 relative z-10">
      {icon}
    </div>
  </div>
);

export default WorkflowBuilder;
