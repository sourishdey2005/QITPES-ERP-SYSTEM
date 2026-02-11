
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, ListFilter, Plus, Search, ChevronRight, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Planning: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ task_name: '', project_id: '', due_date: '', owner_name: '' });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['planning_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('planning_tasks').select('*, projects(name)').order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  const createTask = useMutation({
    mutationFn: async (newTask: any) => {
      const { data, error } = await supabase.from('planning_tasks').insert([newTask]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning_tasks'] });
      setIsModalOpen(false);
      setFormData({ task_name: '', project_id: '', due_date: '', owner_name: '' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Planning & Scheduling</h1>
          <p className="text-slate-500 text-sm">Orchestrating 2026 site milestones and resource timelines.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
          <Plus size={18} /> Schedule Milestone
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Schedule Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(formData); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Name</label>
                  <input required value={formData.task_name} onChange={(e) => setFormData({...formData, task_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. Concrete Pouring" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project</label>
                  <select required value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="">Select Project</option>
                    {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                    <input required type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner</label>
                    <input required value={formData.owner_name} onChange={(e) => setFormData({...formData, owner_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Person Responsible" />
                  </div>
                </div>
                <button disabled={createTask.isPending} type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {createTask.isPending ? <Loader2 className="animate-spin" /> : 'Schedule Task'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Task Name</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks?.map((task: any) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                <td className="px-6 py-4 font-semibold text-slate-900">{task.task_name}</td>
                <td className="px-6 py-4 text-slate-500">{task.projects?.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{task.due_date}</td>
                <td className="px-6 py-4 text-slate-500">{task.owner_name}</td>
                <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-slate-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Planning;
