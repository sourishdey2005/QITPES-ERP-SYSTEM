
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { Landmark, CreditCard, Clock, FileCheck, IndianRupee, Loader2, Users, AlertCircle, X } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  // Fetch employees to process payroll
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('status', 'Active');
      if (error) throw error;
      return data;
    }
  });

  // Fetch past payroll records
  const { data: payrollHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['payroll_records'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payroll_records').select('*, employees(full_name, employee_id)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const runPayroll = useMutation({
    mutationFn: async () => {
      if (!employees || employees.length === 0) throw new Error("No active employees found.");
      
      const records = employees.map(emp => ({
        employee_id: emp.id,
        pay_month: selectedMonth,
        gross_amount: emp.gross_salary,
        net_amount: emp.gross_salary * 0.9, // Simplified: 10% deduction for taxes/benefits
        status: 'Paid'
      }));

      const { data, error } = await supabase.from('payroll_records').insert(records).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_records'] });
      setIsModalOpen(false);
      alert("Payroll processed successfully for " + selectedMonth);
    },
    onError: (error: any) => {
      alert("Error: " + error.message);
    }
  });

  const stats = React.useMemo(() => {
    if (!payrollHistory) return { totalPaid: 0, count: 0 };
    const total = payrollHistory.reduce((s: number, r: any) => s + Number(r.net_amount), 0);
    return { totalPaid: total, count: payrollHistory.length };
  }, [payrollHistory]);

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500 text-sm">Automated salary disbursement based on employee registry.</p>
        </motion.div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <Landmark size={18} /> Initiate Pay Cycle
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Initiate Monthly Payroll</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase">Warning</p>
                    <p className="text-xs text-amber-700">This will generate salary records for all <strong>{employees?.length || 0}</strong> active employees in the system for the selected month.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Disbursement Month</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                  >
                    <option>October 2026</option>
                    <option>November 2026</option>
                    <option>December 2026</option>
                  </select>
                </div>
                <button 
                  onClick={() => runPayroll.mutate()}
                  disabled={runPayroll.isPending || !employees || employees.length === 0}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {runPayroll.isPending ? <Loader2 className="animate-spin" /> : 'Confirm & Process Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Disbursed (FY26)</p>
           <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalPaid)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Headcount</p>
           <h3 className="text-2xl font-bold text-slate-900">{employees?.length || 0} Staff</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Compliance Status</p>
           <h3 className="text-2xl font-bold text-emerald-600">Active</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-800">Pay Status Registry</h3>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Net Payable</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payrollHistory?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium italic">No payroll records detected. Initialize a cycle to begin.</td>
                </tr>
              ) : payrollHistory?.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono font-medium text-slate-400">{row.employees?.employee_id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.employees?.full_name}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{row.pay_month}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(row.net_amount)}</td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-600">
                        {row.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">{new Date(row.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Payroll;
