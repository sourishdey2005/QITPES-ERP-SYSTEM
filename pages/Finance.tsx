
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { IndianRupee, Landmark, CreditCard, Receipt, FileText, Download, Plus } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

const Finance: React.FC = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false });
      return data || [];
    }
  });

  const stats = React.useMemo(() => {
    const income = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const expense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-slate-900">Finance & Indian Accounts</h1>
          <p className="text-slate-500">Managing all corporate ledgers in Indian Rupees (₹).</p>
        </motion.div>
        <div className="flex space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all"
          >
            Report Gen
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-500 font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={18} className="mr-2" /> New Entry
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.balance)}</h3>
          <div className="mt-3 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit font-bold">Live Ledger</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Receivables</p>
          <h3 className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</h3>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payables</p>
          <h3 className="text-2xl font-bold text-red-600">{formatCurrency(stats.expense)}</h3>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-900">Recent Ledger Activity</h3>
           <button className="text-xs text-blue-600 font-bold uppercase hover:underline transition-all">Download Audit Log</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
            <tr>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Amount (₹)</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions?.map((t: any, i: number) => (
              <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                key={t.id} 
                className="text-sm hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                <td className="px-6 py-4 text-slate-500">{t.category}</td>
                <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-4 text-slate-500">{t.transaction_date}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Settled</span>
                </td>
              </motion.tr>
            ))}
            {transactions?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No transactions recorded in the system yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Finance;
