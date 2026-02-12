
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Package, Search, Plus, Filter, ArrowUpRight, AlertTriangle, X, Loader2, MoreVertical } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ sku: '', name: '', category: 'Consumables', stock_level: '', unit: 'Bags', unit_price: '' });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addItem = useMutation({
    mutationFn: async (newItem: any) => {
      const { data, error } = await supabase.from('inventory').insert([newItem]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsModalOpen(false);
      setFormData({ sku: '', name: '', category: 'Consumables', stock_level: '', unit: 'Bags', unit_price: '' });
    }
  });

  const stats = React.useMemo(() => {
    if (!items) return { total: 0, low: 0, val: 0 };
    return {
      total: items.length,
      low: items.filter((i: any) => i.stock_level < 50).length,
      val: items.reduce((acc: number, i: any) => acc + (i.stock_level * i.unit_price), 0)
    };
  }, [items]);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store & Inventory</h1>
          <p className="text-slate-500">Real-time tracking of assets, materials, and consumables.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center shadow-lg transition-all">
          <Plus size={18} className="mr-2" /> Add Item
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Register New Inventory SKU</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addItem.mutate({...formData, stock_level: parseFloat(formData.stock_level), unit_price: parseFloat(formData.unit_price)}); }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SKU Reference</label>
                    <input required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="ITM-2026-X" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Name</label>
                    <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Cement Bags" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                    <input required type="number" value={formData.stock_level} onChange={(e) => setFormData({...formData, stock_level: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price (₹)</label>
                    <input required type="number" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                  </div>
                </div>
                <button disabled={addItem.isPending} type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {addItem.isPending ? <Loader2 className="animate-spin" /> : 'Register Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-4"><Package size={24} /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase">SKU Count</p><h3 className="text-xl font-bold text-slate-900">{stats.total}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mr-4"><AlertTriangle size={24} /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase">Low Stock</p><h3 className="text-xl font-bold text-slate-900">{stats.low}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-4"><ArrowUpRight size={24} /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase">Store Value</p><h3 className="text-xl font-bold text-slate-900">₹{stats.val.toLocaleString()}</h3></div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-sm">
            <Search size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Search Inventory..." className="text-sm outline-none w-full" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="px-6 py-3">Item Details</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Stock Level</th>
              <th className="px-6 py-3">Unit Price</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items?.map((item: any) => (
              <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-[10px] font-mono text-slate-400 block">{item.sku}</span>
                  <span className="font-bold text-slate-900">{item.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{item.category}</td>
                <td className="px-6 py-4 font-bold">{item.stock_level} {item.unit}</td>
                <td className="px-6 py-4">₹{item.unit_price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.stock_level < 50 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {item.stock_level < 50 ? 'Low Stock' : 'Healthy'}
                  </span>
                </td>
                <td className="px-6 py-4"><MoreVertical size={16} className="text-slate-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
