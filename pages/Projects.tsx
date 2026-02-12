
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
  Plus, Search, Filter, Calendar, MoreHorizontal, ChevronRight,
  X, Loader2, Download, Edit2, Trash2, Building2, TrendingUp, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Projects: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    description: '',
    budget: '',
    contract_value: '',
    status: 'Planning'
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects-with-costs'],
    queryFn: async () => {
      const [projResp, costResp] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('project_cost_breakdown').select('*')
      ]);

      if (projResp.error) throw projResp.error;

      return projResp.data?.map(p => {
        const costs = costResp.data?.filter(c => c.project_id === p.id) || [];
        const plannedTotal = costs.reduce((s, c) => s + Number(c.planned_amount), 0);
        const actualTotal = costs.reduce((s, c) => s + Number(c.actual_amount), 0);
        const utilization = plannedTotal > 0 ? Math.min(100, (actualTotal / plannedTotal) * 100) : 0;

        return { ...p, utilization };
      });
    }
  });

  const createProject = useMutation({
    mutationFn: async (newProject: any) => {
      if (editId) {
        const { data, error } = await supabase.from('projects').update(newProject).eq('id', editId).select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('projects').insert([newProject]).select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-costs'] });
      closeModal();
    },
    onError: (error: any) => {
      alert("Submission Failed: " + error.message);
    }
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-costs'] });
    }
  });

  const openModal = (project?: any) => {
    if (project) {
      setEditId(project.id);
      setFormData({
        name: project.name,
        client_name: project.client_name || '',
        description: project.description || '',
        budget: project.budget.toString(),
        contract_value: project.contract_value.toString(),
        status: project.status
      });
    } else {
      setEditId(null);
      setFormData({ name: '', client_name: '', description: '', budget: '', contract_value: '', status: 'Planning' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ name: '', client_name: '', description: '', budget: '', contract_value: '', status: 'Planning' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      contract_value: parseFloat(formData.contract_value) || parseFloat(formData.budget) || 0,
      start_date: editId ? undefined : new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">2026 Project Master (₹)</h1>
          <p className="text-slate-500 font-medium tracking-tight">Overseeing site-level operations for {projects?.length || 0} active deployments.</p>
        </motion.div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(projects || []);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Projects");
              XLSX.writeFile(wb, "Project_Inventory_Report.xlsx");
            }}
            className="flex items-center justify-center px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 font-bold shadow-sm transition-all text-xs uppercase tracking-widest"
          >
            <Download size={18} className="mr-2" /> Export Excel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center justify-center px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-black shadow-lg shadow-orange-500/20 transition-all text-xs uppercase tracking-widest"
          >
            <Plus size={18} className="mr-2" /> Initialize Site
          </motion.button>
        </div>
      </div>

      {/* Modal for adding/editing project */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editId ? 'Update Site Registry' : 'Initialize New Project Site'}</h3>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">Enterprise Configuration Console</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Descriptor</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Nagpur Logistics Hub"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</label>
                    <input
                      required
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="e.g. Mahindra Realty"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Scope</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summary of site operations..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/5 h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Value (₹)</label>
                    <input
                      required
                      type="number"
                      value={formData.contract_value}
                      onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                      placeholder="0"
                      className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-orange-500/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Budget (₹)</label>
                    <input
                      required
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-orange-500/5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-orange-500/5"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <button
                  disabled={createProject.isPending}
                  type="submit"
                  className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 hover:bg-orange-700 transition-all flex items-center justify-center gap-3"
                >
                  {createProject.isPending ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> {editId ? 'Apply Global Updates' : 'Initialize Site Registry'}</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 w-full max-w-md shadow-inner">
          <Search size={18} className="text-slate-400 mr-3" />
          <input type="text" placeholder="Search 2026 Project Ledger..." className="bg-transparent border-none outline-none text-sm font-medium w-full" />
        </div>
        <div className="flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest mr-4">
          <Filter size={16} /> Site Filters
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white border border-slate-100 animate-pulse rounded-[40px]"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects?.map((project: any, i: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-orange-400 hover:shadow-2xl transition-all relative"
            >
              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex flex-col gap-1">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block w-fit ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      project.status === 'Planning' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                      {project.status}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 mt-1">
                      <Building2 size={10} className="text-orange-500" /> {project.client_name || 'Direct Enterprise'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(project)} className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm('Permanently decommission site?')) deleteProject.mutate(project.id); }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-xl mb-2 group-hover:text-orange-600 transition-colors tracking-tighter leading-tight uppercase">{project.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium italic">"{project.description || 'Standard project documentation pending for 2026 audit.'}"</p>

                <div className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-1"><TrendingUp size={10} /> Fiscal Utilization</span>
                      <span className="text-slate-900">{project.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.utilization}%` }}
                        className={`h-full rounded-full ${project.utilization > 90 ? 'bg-red-500' : project.utilization > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-full">
                      <Calendar size={12} className="mr-2 text-orange-500" />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'JAN 2026'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Project Budget</span>
                      <span className="font-black text-slate-900 text-base">{formatCurrency(project.budget || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between relative overflow-hidden group/audit">
                <div className="text-[10px] text-slate-300 uppercase font-black tracking-widest relative z-10">REF: QIT-26-{project.id.slice(0, 4).toUpperCase()}</div>
                <button className="flex items-center text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] relative z-10 hover:text-blue-800 transition-colors">
                  Site Audit <ChevronRight size={14} className="ml-1 group-hover/audit:translate-x-1 transition-transform" />
                </button>
                <div className="absolute inset-x-0 bottom-0 h-0 group-hover/audit:h-full bg-orange-50/50 transition-all duration-500 -z-0"></div>
              </div>
            </motion.div>
          ))}

          {(!projects || projects.length === 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-32 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100">
              <div className="bg-slate-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-200">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Zero Deployment Matrix</h3>
              <p className="text-slate-400 text-xs mt-3 uppercase font-black tracking-[0.3em]">Initialize your first enterprise site node.</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
