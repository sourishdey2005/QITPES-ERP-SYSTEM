
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { Landmark, Search, Download, Filter, X, Loader2 } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const GeneralLedger: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ account_name: '', debit: '', credit: '', reference: '' });

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ledger_entries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const postEntry = useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await supabase.from('ledger_entries').insert([entry]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      setIsModalOpen(false);
      setFormData({ account_name: '', debit: '', credit: '', reference: '' });
    }
  });

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
          <p className="text-slate-500 text-sm">Comprehensive double-entry transaction history.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-orange-700 transition-all">
             <Landmark size={16} /> Journal Entry
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">New Journal Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); postEntry.mutate({...formData, debit: parseFloat(formData.debit) || 0, credit: parseFloat(formData.credit) || 0}); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Name</label>
                  <input required value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" placeholder="Bank Account" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reference</label>
                  <input required value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" placeholder="INV-2026-X" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Debit (₹)</label>
                    <input type="number" value={formData.debit} onChange={(e) => setFormData({...formData, debit: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Credit (₹)</label>
                    <input type="number" value={formData.credit} onChange={(e) => setFormData({...formData, credit: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <button disabled={postEntry.isPending} type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center">
                   {postEntry.isPending ? <Loader2 className="animate-spin" /> : 'Post to Ledger'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
           <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-sm">
             <Search size={16} className="text-slate-400 mr-2" />
             <input type="text" placeholder="Search Ledger..." className="w-full text-sm outline-none" />
           </div>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-6 py-4">Ref Code</th>
               <th className="px-6 py-4">Account Name</th>
               <th className="px-6 py-4">Debit (Dr)</th>
               <th className="px-6 py-4">Credit (Cr)</th>
               <th className="px-6 py-4">Date</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 text-sm">
             {ledger?.map((row: any) => (
               <tr key={row.id} className="hover:bg-slate-50/50">
                 <td className="px-6 py-4 font-mono font-medium text-slate-400">{row.reference}</td>
                 <td className="px-6 py-4 font-bold text-slate-900">{row.account_name}</td>
                 <td className="px-6 py-4 text-emerald-600 font-medium">{row.debit > 0 ? formatCurrency(row.debit) : '-'}</td>
                 <td className="px-6 py-4 text-red-600 font-medium">{row.credit > 0 ? formatCurrency(row.credit) : '-'}</td>
                 <td className="px-6 py-4 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedger;
