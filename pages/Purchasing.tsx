
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { ShoppingCart, FilePlus, Truck, Search, MoreVertical, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Purchasing: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ po_number: '', vendor_name: '', total_amount: '', status: 'Draft' });

  const { data: pos, isLoading } = useQuery({
    queryKey: ['purchasing'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createPO = useMutation({
    mutationFn: async (newPO: any) => {
      const { data, error } = await supabase.from('purchase_orders').insert([newPO]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing'] });
      setIsModalOpen(false);
      setFormData({ po_number: '', vendor_name: '', total_amount: '', status: 'Draft' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Management</h1>
          <p className="text-slate-500 text-sm">Centralized procurement and vendor relations portal.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
          <FilePlus size={18} /> New Purchase Order
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Issue Purchase Order</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createPO.mutate({...formData, total_amount: parseFloat(formData.total_amount)}); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PO Number</label>
                  <input required value={formData.po_number} onChange={(e) => setFormData({...formData, po_number: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="PO-2026-001" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vendor Name</label>
                  <input required value={formData.vendor_name} onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Tata Steel Ltd." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Amount (₹)</label>
                  <input required type="number" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="0" />
                </div>
                <button disabled={createPO.isPending} type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {createPO.isPending ? <Loader2 className="animate-spin" /> : 'Confirm PO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Procured Value</p>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(pos?.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) || 0)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active POs</p>
          <h3 className="text-2xl font-bold text-slate-900">{pos?.length || 0}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg fulfillment</p>
          <h3 className="text-2xl font-bold text-slate-900">4.2 Days</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
             <tr>
               <th className="px-6 py-4">PO Reference</th>
               <th className="px-6 py-4">Vendor</th>
               <th className="px-6 py-4">Amount</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Created At</th>
               <th className="px-6 py-4"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 text-sm">
             {pos?.map((po: any) => (
               <tr key={po.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4 font-mono font-bold text-blue-600">{po.po_number}</td>
                 <td className="px-6 py-4 font-bold text-slate-900">{po.vendor_name}</td>
                 <td className="px-6 py-4 font-bold">{formatCurrency(po.total_amount)}</td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${po.status === 'Draft' ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-600'}`}>
                      {po.status}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-slate-500">{new Date(po.created_at).toLocaleDateString()}</td>
                 <td className="px-6 py-4"><MoreVertical size={16} className="text-slate-400" /></td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default Purchasing;
