
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, ListFilter, Plus, Search, ChevronRight, X, Loader2, AlertCircle, Pencil, Trash2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Planning: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ task_name: '', project_name: '', due_date: '', owner_name: '' });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const saveTask = useMutation({
    mutationFn: async (form: typeof formData) => {
      try {
        setErrorMsg('');

        // 1. Resolve Project ID (Find or Create)
        let projectId;
        const { data: existingProjects, error: searchError } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', form.project_name);

        if (searchError) throw searchError;

        if (existingProjects && existingProjects.length > 0) {
          projectId = existingProjects[0].id;
        } else {
          // Create new project stub if not found
          const { data: newProj, error: createError } = await supabase
            .from('projects')
            .insert([{ name: form.project_name }])
            .select('id')
            .single();

          if (createError) throw createError;
          projectId = newProj.id;
        }

        // 2. Insert or Update Task
        const payload = {
          task_name: form.task_name,
          project_id: projectId,
          due_date: form.due_date,
          owner_name: form.owner_name,
          status: editingTask ? editingTask.status : 'Pending'
        };

        let result;
        if (editingTask) {
          result = await supabase.from('planning_tasks').update(payload).eq('id', editingTask.id).select();
        } else {
          result = await supabase.from('planning_tasks').insert([payload]).select();
        }

        if (result.error) throw result.error;
        return result.data;
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects_list'] });
      setIsFormOpen(false);
      setEditingTask(null);
      setFormData({ task_name: '', project_name: '', due_date: '', owner_name: '' });
      alert(editingTask ? '✅ Task updated successfully!' : '✅ New milestone scheduled!');
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planning_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning_tasks'] });
      alert('🗑️ Task deleted.');
    },
    onError: (err: any) => {
      alert(`❌ Delete Failed: ${err.message}`);
    }
  });

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      task_name: task.task_name,
      project_name: task.projects?.name || '',
      due_date: task.due_date,
      owner_name: task.owner_name
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Planning & Scheduling</h1>
          <p className="text-slate-500 text-sm">Orchestrating 2026 site milestones and resource timelines.</p>
        </div>
        <button onClick={() => { setIsFormOpen(!isFormOpen); setEditingTask(null); setFormData({ task_name: '', project_name: '', due_date: '', owner_name: '' }); }} className={`px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all ${isFormOpen ? 'bg-slate-100 text-slate-600' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          {isFormOpen ? <X size={18} /> : <Plus size={18} />}
          {isFormOpen ? 'Cancel' : 'Schedule Milestone'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{editingTask ? 'Editing Task Details' : 'New Task Details'}</h3>
              {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {errorMsg}</div>}
              <form onSubmit={(e) => { e.preventDefault(); saveTask.mutate(formData); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Name</label>
                    <input required value={formData.task_name} onChange={(e) => setFormData({ ...formData, task_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20" placeholder="e.g. Concrete Pouring" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project</label>
                    <input required list="projects-list" value={formData.project_name} onChange={(e) => setFormData({ ...formData, project_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Type or select project..." />
                    <datalist id="projects-list">
                      {projects?.map((p: any) => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                    <input required type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner</label>
                    <input required value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Person Responsible" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button disabled={saveTask.isPending} type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all">
                    {saveTask.isPending ? <Loader2 className="animate-spin" size={18} /> : (editingTask ? <Pencil size={18} /> : <Plus size={18} />)}
                    {editingTask ? 'Update Task' : 'Schedule Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{task.due_date}</td>
                <td className="px-6 py-4 text-slate-500">{task.owner_name}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  <button onClick={() => handleEdit(task)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => { if (confirm('Are you sure?')) deleteTask.mutate(task.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Planning;
