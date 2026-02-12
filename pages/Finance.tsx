
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { IndianRupee, Landmark, Plus, X, Loader2, Search, Filter } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Finance: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', type: 'income', category: 'Project Revenue' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'year' | 'month' | 'day'>('all');
  const [filterValue, setFilterValue] = useState('');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createTransaction = useMutation({
    mutationFn: async (newEntry: any) => {
      const { data, error } = await supabase.from('finance_transactions').insert([newEntry]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', type: 'income', category: 'Project Revenue' });
    }
  });

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t: any) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'all') return true;

      const date = new Date(t.transaction_date);
      if (filterType === 'year' && filterValue) {
        return date.getFullYear().toString() === filterValue;
      }
      if (filterType === 'month' && filterValue) {
        const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        return monthStr === filterValue;
      }
      if (filterType === 'day' && filterValue) {
        const dayStr = date.toISOString().split('T')[0];
        return dayStr === filterValue;
      }
      return true;
    });
  }, [transactions, searchTerm, filterType, filterValue]);

  const stats = React.useMemo(() => {
    const income = filteredTransactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expense = filteredTransactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Indian Accounts</h1>
          <p className="text-slate-500">Managing all corporate ledgers in Indian Rupees (₹).</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold flex items-center shadow-lg transition-all"
        >
          <Plus size={18} className="mr-2" /> New Entry
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">New Financial Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createTransaction.mutate({ ...formData, amount: parseFloat(formData.amount) }); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                  <input required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="e.g. Nagpur Phase II Milestone 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                    <input required type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <option value="income">Receivable (Income)</option>
                      <option value="expense">Payable (Expense)</option>
                    </select>
                  </div>
                </div>
                <button disabled={createTransaction.isPending} type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center">
                  {createTransaction.isPending ? <Loader2 className="animate-spin" /> : 'Record Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatItem label="Filtered Balance" value={stats.balance} color="text-slate-900" bg="bg-white" />
        <StatItem label="Filtered Receivables" value={stats.income} color="text-emerald-600" bg="bg-white" border="border-l-4 border-l-green-500" />
        <StatItem label="Filtered Payables" value={stats.expense} color="text-red-600" bg="bg-white" border="border-l-4 border-l-red-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/30">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search Ledger..."
              className="text-sm outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value as any); setFilterValue(''); }}
              className="text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none bg-white"
            >
              <option value="all">Total Timeline</option>
              <option value="year">By Year</option>
              <option value="month">By Month</option>
              <option value="day">By Day</option>
            </select>

            {filterType === 'year' && (
              <input
                type="number"
                placeholder="Year (2026)"
                className="text-xs p-2 border border-slate-200 rounded-lg w-24 outline-none"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            )}

            {filterType === 'month' && (
              <input
                type="month"
                className="text-xs p-2 border border-slate-200 rounded-lg outline-none"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            )}

            {filterType === 'day' && (
              <input
                type="date"
                className="text-xs p-2 border border-slate-200 rounded-lg outline-none"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            )}
          </div>
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
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No transactions found for the selected time range.</td>
              </tr>
            ) : filteredTransactions.map((t: any) => (
              <tr key={t.id} className="text-sm hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                <td className="px-6 py-4 text-slate-500">{t.category}</td>
                <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-4 text-slate-500">{new Date(t.transaction_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Post Audit</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color, bg, border = "" }: any) => (
  <div className={`${bg} p-6 rounded-xl border border-slate-200 shadow-sm ${border}`}>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h3 className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</h3>
  </div>
);

export default Finance;
