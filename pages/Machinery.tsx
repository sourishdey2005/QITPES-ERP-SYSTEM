
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Wrench, MapPin, Gauge, Fuel, Plus, X, Loader2, Zap, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Machinery: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', site_location: '', engine_hours: '', fuel_level: '100' });
  const [editingAsset, setEditingAsset] = useState<any>(null);

  const { data: assets, isLoading, isError, error: fetchError } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const registerAsset = useMutation({
    mutationFn: async (newAsset: any) => {
      const { data, error } = await supabase.from('assets').insert([{
        ...newAsset,
        asset_tag: `AST-${Math.floor(Math.random() * 90000) + 10000}`,
        status: 'Healthy'
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setFormData({ name: '', site_location: '', engine_hours: '', fuel_level: '100' });
      alert('✅ Asset successfully registered to fleet!');
    },
    onError: (error: any) => {
      console.error('Asset registration error:', error);
      alert(`❌ Registration Failed: ${error.message || 'Unable to add asset to fleet. Please check your database connection.'}`);
    }
  });

  const updateAsset = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase.from('assets').update(updates).eq('id', editingAsset.id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setEditingAsset(null);
      setFormData({ name: '', site_location: '', engine_hours: '', fuel_level: '100' });
      alert('✅ Asset successfully updated!');
    },
    onError: (error: any) => {
      console.error('Asset update error:', error);
      alert(`❌ Update Failed: ${error.message}`);
    }
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      alert('🗑️ Asset decommissioned from fleet.');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      alert(`❌ Delete Failed: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, engine_hours: parseFloat(formData.engine_hours), fuel_level: parseFloat(formData.fuel_level) };
    if (editingAsset) {
      updateAsset.mutate(payload);
    } else {
      registerAsset.mutate(payload);
    }
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      site_location: asset.site_location || '',
      engine_hours: asset.engine_hours?.toString() || '',
      fuel_level: asset.fuel_level?.toString() || '100'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Machinery & Plant Assets</h1>
          <p className="text-slate-500 text-sm">Real-time heavy machinery telemetry and maintenance oversight.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Register Asset
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">{editingAsset ? 'Update Fleet Asset' : 'Register New Asset'}</h3>
                <button onClick={() => { setIsModalOpen(false); setEditingAsset(null); setFormData({ name: '', site_location: '', engine_hours: '', fuel_level: '100' }); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipment Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="e.g. Caterpillar D9 Dozer" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Site</label>
                  <input required value={formData.site_location} onChange={(e) => setFormData({ ...formData, site_location: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="e.g. Nagpur Site B" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initial Engine Hours</label>
                    <input required type="number" value={formData.engine_hours} onChange={(e) => setFormData({ ...formData, engine_hours: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fuel Level (%)</label>
                    <input required type="number" min="0" max="100" value={formData.fuel_level} onChange={(e) => setFormData({ ...formData, fuel_level: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
                  </div>
                </div>
                <button disabled={registerAsset.isPending || updateAsset.isPending} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all">
                  {(registerAsset.isPending || updateAsset.isPending) ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> {editingAsset ? 'Update Fleet Asset' : 'Add to Site Fleet'}</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)
        ) : isError ? (
          <div className="col-span-full py-12 bg-red-50 rounded-3xl border border-red-100 text-center text-red-600">
            <AlertTriangle className="mx-auto mb-2" size={32} />
            <p className="font-bold text-lg mb-2">Error Loading Fleet Data</p>
            <pre className="text-xs opacity-90 font-mono bg-red-100/50 p-4 rounded-xl inline-block text-left max-w-2xl overflow-auto">
              {JSON.stringify(fetchError, null, 2)}
            </pre>
          </div>
        ) : assets?.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <Wrench size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-900">No Machinery Registered</h3>
            <p className="text-slate-500 text-sm mt-1">Register heavy equipment to begin live telemetry tracking.</p>
          </div>
        ) : assets?.map((machine: any) => (
          <motion.div key={machine.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  <Zap size={24} />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${machine.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {machine.status}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-lg group-hover:text-red-600 transition-colors">{machine.name}</h3>
              <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-tighter"><MapPin size={12} className="text-red-500" /> {machine.site_location}</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Engine Load</p>
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-red-500" />
                    <span className="text-sm font-black text-slate-900">{machine.engine_hours}h</span>
                  </div>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Fuel Status</p>
                  <div className="flex items-center gap-2">
                    <Fuel size={14} className={`${machine.fuel_level < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                    <span className="text-sm font-black text-slate-900">{machine.fuel_level}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(machine)}
                  className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold uppercase hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => { if (confirm('Are you sure you want to delete this asset?')) deleteAsset.mutate(machine.id); }}
                  className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold uppercase hover:bg-red-100 flex items-center justify-center gap-2"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-red-50 group-hover:scale-110 transition-all duration-700 -z-0"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Machinery;
