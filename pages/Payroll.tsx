
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
  Landmark,
  Calendar,
  IndianRupee,
  Loader2,
  Users,
  AlertCircle,
  X,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Edit2,
  Save,
  Percent,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);
  const [tempDeductionValue, setTempDeductionValue] = useState<string>('');

  const today = new Date();
  const currentPayMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysUntilPay = Math.ceil((nextPayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 1. Fetch Employees - Filter by the new employee_status field
  const { data: employees, isLoading: loadingEmployees, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('employee_status', 'Active').order('full_name');
      if (error) {
        console.error("Supabase Error fetching employees:", error);
        throw error;
      }
      return data || [];
    }
  });

  // 2. Fetch Payroll History
  const { data: payrollHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['payroll_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, employees(full_name, employee_id, department)')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // 3. Mutation: Register Staff (Onboarding)
  const [newStaff, setNewStaff] = useState({ employee_id: '', full_name: '', department: 'Operations', gross_salary: '', monthly_deductions: '0', employee_status: 'Active' });
  const addStaff = useMutation({
    mutationFn: async (staff: any) => {
      const { data, error } = await supabase.from('employees').insert([staff]).select();
      if (error) {
        console.error("Supabase Insertion Error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddStaffOpen(false);
      setNewStaff({ employee_id: '', full_name: '', department: 'Operations', gross_salary: '', monthly_deductions: '0', employee_status: 'Active' });
      setFormError(null);
    },
    onError: (error: any) => {
      setFormError(error.message || "Failed to register staff member.");
    }
  });

  // 4. Mutation: Update Individual Deduction
  const updateDeduction = useMutation({
    mutationFn: async ({ id, deductions }: { id: string; deductions: number }) => {
      const { data, error } = await supabase.from('employees').update({ monthly_deductions: deductions }).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingDeductionId(null);
    },
    onError: (error: any) => {
      alert("Update Failed: " + error.message);
    }
  });

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const salary = parseFloat(newStaff.gross_salary);
    const deductions = parseFloat(newStaff.monthly_deductions);

    if (isNaN(salary) || salary <= 0) {
      setFormError("Please enter a valid gross salary amount.");
      return;
    }
    if (isNaN(deductions) || deductions < 0) {
      setFormError("Deductions must be a valid positive number.");
      return;
    }

    addStaff.mutate({
      employee_id: newStaff.employee_id.trim(),
      full_name: newStaff.full_name.trim(),
      department: newStaff.department,
      gross_salary: salary,
      monthly_deductions: deductions,
      employee_status: newStaff.employee_status
    });
  };

  const handleSaveDeduction = (id: string) => {
    const value = parseFloat(tempDeductionValue);
    if (!isNaN(value)) {
      updateDeduction.mutate({ id, deductions: value });
    } else {
      setEditingDeductionId(null);
    }
  };

  // 5. Mutation: Bulk Authorize Payroll
  const runPayroll = useMutation({
    mutationFn: async () => {
      if (!employees || employees.length === 0) throw new Error("No active employees found in registry.");

      const records = employees.map(emp => ({
        employee_id: emp.id,
        pay_month: currentPayMonth,
        gross_amount: emp.gross_salary,
        deduction_amount: emp.monthly_deductions || 0,
        net_amount: (emp.gross_salary || 0) - (emp.monthly_deductions || 0),
        status: 'Paid',
        payment_date: new Date().toISOString()
      }));

      const { data, error } = await supabase.from('payroll_records').upsert(records, { onConflict: 'employee_id, pay_month' }).select();
      if (error) throw error;

      const totalNet = records.reduce((sum, r) => sum + r.net_amount, 0);
      await supabase.from('finance_transactions').insert([{
        description: `Payroll Disbursement - ${currentPayMonth}`,
        amount: totalNet,
        type: 'expense',
        category: 'Personnel Cost'
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_records'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsPayModalOpen(false);
    },
    onError: (err: any) => {
      alert("Payroll Error: " + err.message);
    }
  });

  const stats = useMemo(() => {
    const totalSalaries = employees?.reduce((sum, e) => sum + Number(e.gross_salary), 0) || 0;
    const totalDeductions = employees?.reduce((sum, e) => sum + Number(e.monthly_deductions || 0), 0) || 0;
    const paidThisMonth = payrollHistory?.filter(r => r.pay_month === currentPayMonth).length || 0;
    return { totalSalaries, totalDeductions, paidThisMonth };
  }, [employees, payrollHistory, currentPayMonth]);

  const filteredStaff = employees?.filter(e =>
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Payroll Hub</h1>
          <p className="text-slate-500 text-sm">Precision salary engine with individual deduction control for {currentPayMonth}.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(payrollHistory || []);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Payroll");
              XLSX.writeFile(wb, "Payroll_Report.xlsx");
            }}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-100 flex items-center gap-2 transition-all"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> Add Payee
          </button>
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 flex items-center gap-2 transition-all"
          >
            <Landmark size={18} /> Initiate Pay Cycle
          </button>
        </div>
      </div>

      {employeesError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold">
          <AlertCircle size={20} />
          <span>Critical Schema Error: {employeesError.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem label="Next Pay Day" value={nextPayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} sub={`${daysUntilPay} days left`} icon={<Calendar size={20} className="text-red-500" />} />
        <StatItem label="Monthly Liability" value={formatCurrency(stats.totalSalaries)} sub="Gross Pipeline" icon={<TrendingUp size={20} className="text-slate-400" />} />
        <StatItem label="Cycle Authorizations" value={`${stats.paidThisMonth} / ${employees?.length || 0}`} sub="Cycle Completion" icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
        <StatItem label="Active Payees" value={employees?.length || 0} sub="Site Registry" icon={<Users size={20} className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users size={16} className="text-red-500" /> Professional Salary Registry
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none w-48 focus:ring-2 focus:ring-red-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Gross (₹)</th>
                    <th className="px-6 py-4">Deductions (₹)</th>
                    <th className="px-6 py-4">Net Payout (₹)</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingEmployees ? (
                    <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-red-600" /></td></tr>
                  ) : filteredStaff?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No payees found. Add staff to begin payroll engine.</td></tr>
                  ) : filteredStaff?.map((emp: any) => {
                    const isPaid = payrollHistory?.some(r => r.employee_id === emp.id && r.pay_month === currentPayMonth);
                    const isEditing = editingDeductionId === emp.id;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{emp.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{emp.employee_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(emp.gross_salary)}</td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                autoFocus
                                className="w-24 p-1 border rounded text-xs font-bold focus:ring-2 focus:ring-red-500/20"
                                value={tempDeductionValue}
                                onChange={(e) => setTempDeductionValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveDeduction(emp.id)}
                              />
                              <button onClick={() => handleSaveDeduction(emp.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Save size={14} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                              <span className="text-red-600 font-bold">{formatCurrency(emp.monthly_deductions || 0)}</span>
                              <button
                                onClick={() => { setEditingDeductionId(emp.id); setTempDeductionValue(emp.monthly_deductions?.toString() || '0'); }}
                                className="p-1 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600">
                          {formatCurrency((emp.gross_salary || 0) - (emp.monthly_deductions || 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {isPaid ? 'Cycle Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-1">Cycle Forecasting</h3>
              <p className="text-slate-400 text-xs mb-6 font-medium tracking-tight">Enterprise Projections for {currentPayMonth}</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Total Liability</span>
                  <span className="text-white">{formatCurrency(stats.totalSalaries)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Active Deductions</span>
                  <span className="text-red-400 font-black">{formatCurrency(stats.totalDeductions)}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 border border-red-500/20">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Scheduled Release</p>
                    <p className="text-lg font-black text-white">{daysUntilPay} Days to Disbursement</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-700"></div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-md overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                <button onClick={() => { setIsAddStaffOpen(false); setFormError(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddStaffSubmit} className="p-8 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-pulse">
                    <AlertTriangle size={16} /> {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</label>
                    <input required value={newStaff.employee_id} onChange={(e) => setNewStaff({ ...newStaff, employee_id: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono tracking-tighter" placeholder="EMP-2026-X" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input required value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="e.g. Rahul Sharma" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                    <select value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold">
                      <option>Operations</option><option>Finance</option><option>Engineering</option><option>Logistics</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select value={newStaff.employee_status} onChange={(e) => setNewStaff({ ...newStaff, employee_status: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold">
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-red-600">Base Gross (₹)</label>
                    <input required type="number" value={newStaff.gross_salary} onChange={(e) => setNewStaff({ ...newStaff, gross_salary: e.target.value })} className="w-full p-2.5 bg-red-50/30 border border-red-200 rounded-xl outline-none text-sm font-black" placeholder="50000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-red-600">Deductions (₹)</label>
                    <input required type="number" value={newStaff.monthly_deductions} onChange={(e) => setNewStaff({ ...newStaff, monthly_deductions: e.target.value })} className="w-full p-2.5 bg-red-50/30 border border-red-200 rounded-xl outline-none text-sm font-black text-red-600" placeholder="5000" />
                  </div>
                </div>
                <button disabled={addStaff.isPending} type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all mt-4">
                  {addStaff.isPending ? <Loader2 className="animate-spin" /> : 'Register with Custom Deductions'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatItem = ({ label, value, sub, icon }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-red-200 transition-all">
    <div className="flex items-start justify-between mb-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 transition-colors">{icon}</div>
    </div>
    <h3 className="text-xl font-black text-slate-900">{typeof value === 'number' ? formatCurrency(value) : value}</h3>
    <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
  </div>
);

export default Payroll;
