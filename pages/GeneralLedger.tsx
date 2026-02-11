
import React, { useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Search, Download, Filter, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, supabase } from '../lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const GeneralLedger: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    debit: '',
    credit: '',
    reference: ''
  });

  // Mock list - in real app would be a useQuery hook
  const [ledgerData, setLedgerData] = useState([
    { ref: 'GL-1042', acct: 'HDFC Bank - Current', dr: 450000, cr: 0, bal: 1250000, date: 'Oct 04, 2026' },
    { ref: 'GL-1043', acct: 'Sales Revenue - Sites', dr: 0, cr: 125000, bal: 2450000, date: 'Oct 04, 2026' },
    { ref: 'GL-1044', acct: 'Vendor Payable - Tata', dr: 50000, cr: 0, bal: 400000, date: 'Oct 05, 2026' },
    { ref: 'GL-1045', acct: 'Wages & Salaries', dr: 820000, cr: 0, bal: 820000, date: 'Oct 05, 2026' },
  ]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      ref: `GL-${Math.floor(Math.random() * 9000) + 1000}`,
      acct: formData.account_name,
      dr: parseFloat(formData.debit) || 0,
      cr: parseFloat(formData.credit) || 0,
      bal: 2500000, // Dummy calculation for now
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    setLedgerData([newEntry, ...ledgerData]);
    setIsModalOpen(false);
    setFormData({ account_name: '', debit: '', credit: '', reference: '' });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">General Ledger</h1>
          <p className="text-slate-500 text-sm">Comprehensive double-entry transaction history.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
             <Download size={16} /> Export T-Account
           </button>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
           >
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
              <form onSubmit={handleAddEntry} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Account Name</label>
                  <input required value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. ICICI Bank - Payroll Acct" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Debit (₹)</label>
                    <input type="number" value={formData.debit} onChange={(e) => setFormData({...formData, debit: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Credit (₹)</label>
                    <input type="number" value={formData.credit} onChange={(e) => setFormData({...formData, credit: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Post to Ledger</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-4 flex-1">
             <div className="relative w-full max-w-sm">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="text" placeholder="Search account or reference..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
             </div>
             <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"><Filter size={18} /></button>
           </div>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
             <tr>
               <th className="px-6 py-4">Ref Code</th>
               <th className="px-6 py-4">Account Name</th>
               <th className="px-6 py-4">Debit (Dr)</th>
               <th className="px-6 py-4">Credit (Cr)</th>
               <th className="px-6 py-4">Balance</th>
               <th className="px-6 py-4">Date</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 text-sm">
             {ledgerData.map((row, i) => (
               <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                 <td className="px-6 py-4 font-mono font-medium text-slate-400">{row.ref}</td>
                 <td className="px-6 py-4 font-bold text-slate-900">{row.acct}</td>
                 <td className="px-6 py-4 text-emerald-600 font-medium">{row.dr > 0 ? formatCurrency(row.dr) : '-'}</td>
                 <td className="px-6 py-4 text-red-600 font-medium">{row.cr > 0 ? formatCurrency(row.cr) : '-'}</td>
                 <td className="px-6 py-4 font-bold text-slate-700">{formatCurrency(row.bal)}</td>
                 <td className="px-6 py-4 text-slate-500">{row.date}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedger;
