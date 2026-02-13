
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { Users, Search, Plus, Filter, X, Loader2, Edit2, Trash2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const HR: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ employee_id: '', full_name: '', department: 'Engineering', role: '', gross_salary: '', employee_status: 'Active' });

  const { data: staff, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const onboard = useMutation({
    mutationFn: async (emp: any) => {
      if (editId) {
        const { data, error } = await supabase.from('employees').update(emp).eq('id', editId).select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('employees').insert([emp]).select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    }
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  const openModal = (emp?: any) => {
    if (emp) {
      setEditId(emp.id);
      setFormData({
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        department: emp.department,
        role: emp.role || '',
        gross_salary: emp.gross_salary.toString(),
        employee_status: emp.employee_status
      });
    } else {
      setEditId(null);
      setFormData({ employee_id: '', full_name: '', department: 'Engineering', role: '', gross_salary: '', employee_status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ employee_id: '', full_name: '', department: 'Engineering', role: '', gross_salary: '', employee_status: 'Active' });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR & Workforce</h1>
          <p className="text-slate-500 text-sm">Employee lifecycle and corporate registry management.</p>
        </div>
        <button onClick={() => openModal()} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center shadow-lg transition-all">
          <Plus size={18} className="mr-2" /> Onboard Employee
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{editId ? 'Update Workforce Info' : 'Workforce Onboarding'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); onboard.mutate({...formData, gross_salary: parseFloat(formData.gross_salary)}); }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ID</label>
                    <input required value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" placeholder="EMP-2026-X" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                    <input required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" placeholder="John Doe" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dept</label>
                    <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <option>Engineering</option><option>Operations</option><option>Finance</option><option>HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select value={formData.employee_status} onChange={(e) => setFormData({...formData, employee_status: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Salary (₹)</label>
                  <input required type="number" value={formData.gross_salary} onChange={(e) => setFormData({...formData, gross_salary: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <button disabled={onboard.isPending} type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {onboard.isPending ? <Loader2 className="animate-spin" /> : editId ? 'Save Changes' : 'Confirm Onboarding'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-xs">
            <Search size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Search Staff..." className="text-sm outline-none" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
            <tr>
              <th className="px-6 py-3">Employee Identity</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Salary</th>
              <th className="px-6 py-3">Lifecycle Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff?.map((emp: any) => (
              <tr key={emp.id} className="text-sm hover:bg-slate-50">
                <td className="px-6 py-4">
                  <span className="text-[10px] font-mono text-slate-400 block">{emp.employee_id}</span>
                  <span className="font-bold text-slate-900">{emp.full_name}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{emp.department}</td>
                <td className="px-6 py-4 font-bold">{formatCurrency(emp.gross_salary)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    emp.employee_status === 'Active' ? 'bg-green-50 text-green-600' :
                    emp.employee_status === 'On Leave' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {emp.employee_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openModal(emp)} className="text-red-600 hover:text-blue-800 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { if(confirm('Delete employee?')) deleteEmployee.mutate(emp.id); }} className="text-rose-500 hover:text-rose-700 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HR;
