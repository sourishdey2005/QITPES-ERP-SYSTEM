
import React from 'react';
import { Receipt, ShieldCheck, FileText, IndianRupee, Download, PieChart as PieIcon } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase } from 'framer-motion';
import { formatCurrency } from '../lib/supabase';

const motion = motionBase as any;

const TaxEngine: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Engine & Compliance</h1>
          <p className="text-slate-500 text-sm">Managing GST, TDS, and Corporate Tax for Indian operations.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
             <Download size={16} /> Generate GSTR-1
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'GST Input Credit', value: 854000, icon: <Receipt />, color: 'bg-green-50 text-green-600' },
          { label: 'Pending TDS', value: 42000, icon: <FileText />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Liability Due', value: 245000, icon: <IndianRupee />, color: 'bg-red-50 text-red-600' },
          { label: 'Audit Score', value: '98%', icon: <ShieldCheck />, color: 'bg-blue-50 text-blue-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>{stat.icon}</div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <h3 className="text-xl font-bold text-slate-900">{typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
           <h3 className="font-bold text-slate-800">GST Monthly Summary - 2026</h3>
           <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Active Filling Cycle</div>
        </div>
        <div className="p-6">
           <div className="space-y-4">
              {[
                { month: 'September 2026', cgst: 42000, sgst: 42000, igst: 12000, status: 'Filed' },
                { month: 'August 2026', cgst: 38500, sgst: 38500, igst: 8500, status: 'Filed' },
                { month: 'October 2026 (Est)', cgst: 51000, sgst: 51000, igst: 14000, status: 'Open' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg border border-slate-200"><PieIcon size={20} className="text-slate-400" /></div>
                      <div>
                        <p className="font-bold text-slate-900">{row.month}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">CGST: {formatCurrency(row.cgst)} | SGST: {formatCurrency(row.sgst)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(row.cgst + row.sgst + row.igst)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${row.status === 'Filed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaxEngine;
