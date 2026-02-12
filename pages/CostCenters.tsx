
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { PieChart, Landmark, TrendingUp, DollarSign, ArrowUpRight, Target, X, Loader2, Edit2, Trash2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const CostCenters: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', budget: '' });

  const { data: centers, isLoading } = useQuery({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const upsertCenter = useMutation({
    mutationFn: async (center: any) => {
      if (editingId) {
        const { data, error } = await supabase.from('cost_centers').update(center).eq('id', editingId).select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('cost_centers').insert([center]).select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] });
      closeModal();
    }
  });

  const deleteCenter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_centers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost_centers'] });
    }
  });

  const openModal = (center?: any) => {
    if (center) {
      setEditingId(center.id);
      setFormData({ name: center.name, budget: center.budget.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: '', budget: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', budget: '' });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Centers</h1>
          <p className="text-slate-500 text-sm">Strategic allocation and tracking of project-level burn rates.</p>
        </div>
        <button onClick={() => openModal()} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-orange-700">
          Initialize New Center
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Update Cost Center' : 'New Cost Center'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); upsertCenter.mutate({ ...formData, budget: parseFloat(formData.budget) }); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Center Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. Pune Logistics" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Budget (₹)</label>
                  <input required type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="0" />
                </div>
                <button disabled={upsertCenter.isPending} type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {upsertCenter.isPending ? <Loader2 className="animate-spin" /> : editingId ? 'Update Center' : 'Initialize Center'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers?.map((center: any, i: number) => {
          const utilization = center.budget > 0 ? Math.round((center.spent / center.budget) * 100) : 0;
          return (
            <motion.div key={center.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Target size={20} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CENTER-ID: {center.id.slice(0, 6).toUpperCase()}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(center)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                  <button onClick={() => { if (confirm('Purge this cost center?')) deleteCenter.mutate(center.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{center.name}</h3>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Utilization</p>
                  <p className="text-2xl font-black text-slate-800">{utilization}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Budget</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(center.budget)}</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${utilization}%` }} className={`h-full ${utilization > 90 ? 'bg-red-500' : 'bg-orange-500'}`} />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Spent: {formatCurrency(center.spent)}</span>
                <button className="text-orange-600 hover:underline">Full Audit</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CostCenters;
