
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { Receipt, ShieldCheck, FileText, IndianRupee, Plus, X, Loader2 } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const TaxEngine: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ filing_month: 'October 2026', type: 'GST', cgst: '', sgst: '', status: 'Filed' });

  const { data: taxRecords, isLoading } = useQuery({
    queryKey: ['tax_records'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tax_records').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addRecord = useMutation({
    mutationFn: async (record: any) => {
      const total = (parseFloat(record.cgst) || 0) + (parseFloat(record.sgst) || 0);
      const { data, error } = await supabase.from('tax_records').insert([{ ...record, total_tax: total }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax_records'] });
      setIsModalOpen(false);
      setFormData({ filing_month: 'October 2026', type: 'GST', cgst: '', sgst: '', status: 'Filed' });
    }
  });

  const totals = React.useMemo(() => {
    if (!taxRecords) return { credits: 0, count: 0 };
    const credits = taxRecords.reduce((s: number, r: any) => s + Number(r.total_tax), 0);
    return { credits, count: taxRecords.length };
  }, [taxRecords]);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Engine & Compliance</h1>
          <p className="text-slate-500 text-sm">Managing GST, TDS, and Corporate Tax for Indian operations.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
             <Plus size={16} /> Log Tax Filing
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">New Tax Filing Record</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addRecord.mutate(formData); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filing Month</label>
                  <input required value={formData.filing_month} onChange={(e) => setFormData({...formData, filing_month: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. October 2026" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CGST (₹)</label>
                    <input required type="number" value={formData.cgst} onChange={(e) => setFormData({...formData, cgst: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SGST (₹)</label>
                    <input required type="number" value={formData.sgst} onChange={(e) => setFormData({...formData, sgst: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                </div>
                <button disabled={addRecord.isPending} type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center">
                   {addRecord.isPending ? <Loader2 className="animate-spin" /> : 'Log Compliance Record'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Accumulated Tax Credits" value={totals.credits} icon={<Receipt />} color="bg-green-50 text-green-600" />
        <StatCard label="Active Filings" value={totals.count} icon={<FileText />} color="bg-red-50 text-red-600" />
        <StatCard label="Compliance Status" value="Compliant" icon={<ShieldCheck />} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
           <h3 className="font-bold text-slate-800">Tax History Registry - FY 2026</h3>
        </div>
        <div className="p-6 space-y-4">
           {taxRecords?.length === 0 ? (
             <div className="text-center py-10 text-slate-400 font-medium">No records found. Initialize your first filing above.</div>
           ) : taxRecords?.map((row: any) => (
             <div key={row.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-200 transition-all">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white rounded-lg border border-slate-200"><FileText size={20} className="text-slate-400" /></div>
                   <div>
                     <p className="font-bold text-slate-900">{row.filing_month}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">CGST: {formatCurrency(row.cgst)} | SGST: {formatCurrency(row.sgst)}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-slate-900">{formatCurrency(row.total_tax)}</p>
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-700">{row.status}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
     <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
     <h3 className="text-xl font-bold text-slate-900">{typeof value === 'number' ? formatCurrency(value) : value}</h3>
  </div>
);

export default TaxEngine;
