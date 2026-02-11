
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { Plus, Search, Filter, Calendar, MoreHorizontal, ChevronRight, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Projects: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    status: 'Planning'
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createProject = useMutation({
    mutationFn: async (newProject: any) => {
      const { data, error } = await supabase.from('projects').insert([newProject]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setFormData({ name: '', description: '', budget: '', status: 'Planning' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({
      ...formData,
      budget: parseFloat(formData.budget) || 0,
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">2026 Project Master (₹)</h1>
          <p className="text-slate-500">Overseeing site-level operations for {projects?.length || 0} active deployments.</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={18} className="mr-2" /> Initialize Site
        </motion.button>
      </div>

      {/* Modal for adding project */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Initialize New Project Site</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Nagpur Logistics Hub Phase II"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Summary of site operations..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Initial Budget (₹)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="5000000"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <button 
                  disabled={createProject.isPending}
                  type="submit" 
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {createProject.isPending ? <Loader2 className="animate-spin" size={20}/> : 'Initialize Site Registry'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full max-w-sm">
          <Search size={18} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Search 2026 Project Ledger..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <button className="flex items-center px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all">
          <Filter size={16} className="mr-2" /> Site Filters
        </button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project: any, i: number) => (
            <motion.div 
              key={project.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project.status === 'Active' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {project.status}
                  </span>
                  <button className="text-slate-300 hover:text-slate-600 transition-colors"><MoreHorizontal size={20} /></button>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{project.description || 'Standard project documentation pending for 2026 audit.'}</p>
                
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    <span>Fiscal Utilization</span>
                    <span className="text-slate-600">84%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} className="h-2 bg-blue-600 rounded-full" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      <Calendar size={14} className="mr-1.5 text-blue-500" />
                      <span>{project.start_date || 'Jan 2026'}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {formatCurrency(project.budget || 0)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">REF: QIT-26-{project.id.slice(0,4).toUpperCase()}</div>
                <button className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 group-hover:underline">
                  Site Audit <ChevronRight size={14} className="ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
          
          {(!projects || projects.length === 0) && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
               <h3 className="text-lg font-bold text-slate-900">No 2026 Projects Initialized</h3>
               <p className="text-slate-500 mt-1 max-w-xs mx-auto">Start by clicking 'Initialize Site' to begin enterprise tracking.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
