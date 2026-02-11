
import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Search, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../lib/supabase';

const GeneralLedger: React.FC = () => {
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
           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md hover:bg-blue-700">
             <Landmark size={16} /> Journal Entry
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-4 flex-1">
             <div className="relative w-full max-w-sm">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="text" placeholder="Search account or reference..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
             </div>
             <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600"><Filter size={18} /></button>
           </div>
           <div className="text-sm font-bold text-slate-500">FY 2026 Q3 Ledger</div>
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
             {[
               { ref: 'GL-1042', acct: 'HDFC Bank - Current', dr: 450000, cr: 0, bal: 1250000, date: 'Oct 04, 2026' },
               { ref: 'GL-1043', acct: 'Sales Revenue - Sites', dr: 0, cr: 125000, bal: 2450000, date: 'Oct 04, 2026' },
               { ref: 'GL-1044', acct: 'Vendor Payable - Tata', dr: 50000, cr: 0, bal: 400000, date: 'Oct 05, 2026' },
               { ref: 'GL-1045', acct: 'Wages & Salaries', dr: 820000, cr: 0, bal: 820000, date: 'Oct 05, 2026' },
             ].map((row, i) => (
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
