
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
  AlertTriangle
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date();
  const currentPayMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysUntilPay = Math.ceil((nextPayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 1. Fetch Employees
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('status', 'Active').order('full_name');
      if (error) throw error;
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
  const [newStaff, setNewStaff] = useState({ employee_id: '', full_name: '', department: 'Operations', gross_salary: '' });
  const addStaff = useMutation({
    mutationFn: async (staff: any) => {
      const { data, error } = await supabase.from('employees').insert([staff]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAddStaffOpen(false);
      setNewStaff({ employee_id: '', full_name: '', department: 'Operations', gross_salary: '' });
      setFormError(null);
    },
    onError: (error: any) => {
      setFormError(error.message || "Failed to register staff member.");
    }
  });

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    const salary = parseFloat(newStaff.gross_salary);
    if (isNaN(salary) || salary <= 0) {
      setFormError("Please enter a valid gross salary amount.");
      return;
    }

    addStaff.mutate({
      employee_id: newStaff.employee_id.trim(),
      full_name: newStaff.full_name.trim(),
      department: newStaff.department,
      gross_salary: salary,
      status: 'Active'
    });
  };

  // 4. Mutation: Bulk Authorize Payroll
  const runPayroll = useMutation({
    mutationFn: async () => {
      if (!employees || employees.length === 0) throw new Error("No active employees found in registry.");
      
      const records = employees.map(emp => ({
        employee_id: emp.id,
        pay_month: currentPayMonth,
        gross_amount: emp.gross_salary,
        net_amount: emp.gross_salary * 0.88, // 12% statutory deductions (PF/PT/TDS)
        status: 'Paid',
        payment_date: new Date().toISOString()
      }));

      const { data, error } = await supabase.from('payroll_records').upsert(records, { onConflict: 'employee_id, pay_month' }).select();
      if (error) throw error;

      // Automatically post to Finance Transactions
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
    const paidThisMonth = payrollHistory?.filter(r => r.pay_month === currentPayMonth).length || 0;
    return { totalSalaries, paidThisMonth };
  }, [employees, payrollHistory, currentPayMonth]);

  const filteredStaff = employees?.filter(e => 
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Payroll Hub</h1>
          <p className="text-slate-500 text-sm">Automated salary engine with statutory compliance for {currentPayMonth}.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsAddStaffOpen(true)}
             className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all"
           >
             <Plus size={18} /> Add Payee
           </button>
           <button 
             onClick={() => setIsPayModalOpen(true)}
             className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center gap-2 transition-all"
           >
             <Landmark size={18} /> Initiate Pay Cycle
           </button>
        </div>
      </div>

      {/* Forecast & Liability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem label="Next Pay Day" value={nextPayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} sub={`${daysUntilPay} days left`} icon={<Calendar size={20} className="text-blue-500" />} />
        <StatItem label="Monthly Liability" value={formatCurrency(stats.totalSalaries)} sub="Gross Pipeline" icon={<TrendingUp size={20} className="text-slate-400" />} />
        <StatItem label="Authorized" value={`${stats.paidThisMonth} / ${employees?.length || 0}`} sub="Cycle Completion" icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
        <StatItem label="Staff Headcount" value={employees?.length || 0} sub="Active Payees" icon={<Users size={20} className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Interactive Payee List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users size={16} className="text-blue-500" /> Salary Registry
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by name..." 
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none w-48 focus:ring-2 focus:ring-blue-500/20"
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
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Gross (₹)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingEmployees ? (
                    <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                  ) : filteredStaff?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No employees found. Register staff to begin.</td></tr>
                  ) : filteredStaff?.map((emp: any) => {
                    const isPaid = payrollHistory?.some(r => r.employee_id === emp.id && r.pay_month === currentPayMonth);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{emp.full_name}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{emp.employee_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{emp.department}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(emp.gross_salary)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {isPaid ? 'Cycle Complete' : 'Awaiting Cycle'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                             <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Disbursement Timeline */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
               <h3 className="text-white font-bold text-lg mb-1">Payment Queue</h3>
               <p className="text-slate-400 text-xs mb-6 font-medium tracking-tight">System Forecast for {currentPayMonth}</p>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Liability</span>
                    <span className="text-white">{formatCurrency(stats.totalSalaries)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Est. Deductions</span>
                    <span className="text-red-400">{formatCurrency(stats.totalSalaries * 0.12)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Clock size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Countdown</p>
                        <p className="text-lg font-black text-white">{daysUntilPay} Days to Release</p>
                     </div>
                  </div>
               </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Recent Registry Log</h3>
             </div>
             <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                {payrollHistory?.slice(0, 8).map((record: any) => (
                  <div key={record.id} className="p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold">
                        {record.pay_month.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{record.employees?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(record.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-bold text-emerald-600">{formatCurrency(record.net_amount)}</p>
                       <p className="text-[10px] font-bold text-slate-300 uppercase">PAID</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-lg overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Authorize Monthly Payouts</h3>
                  <p className="text-xs text-slate-500 font-medium">Final approval for {currentPayMonth}</p>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4">
                  <AlertCircle className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Compliance Check</p>
                    <p className="text-sm text-amber-700 leading-relaxed font-medium">This will authorize disbursements for <strong>{employees?.length || 0} employees</strong>. This record is permanent and will post to the General Ledger.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/50">
                    <span className="text-xs font-bold text-slate-400 uppercase">Estimated Net Payout</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalSalaries * 0.88)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cycle ID</p>
                      <p className="text-sm font-mono text-slate-900 font-bold">PY-2026-{(today.getMonth()+1).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Authorizer Role</p>
                      <p className="text-sm font-bold text-blue-600 uppercase">Director-Auth</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => runPayroll.mutate()}
                  disabled={runPayroll.isPending || !employees || employees.length === 0}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-black disabled:bg-slate-300 transition-all"
                >
                  {runPayroll.isPending ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Confirm & Authorize Payout</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isAddStaffOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                <button onClick={() => { setIsAddStaffOpen(false); setFormError(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddStaffSubmit} className="p-8 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertTriangle size={16} /> {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</label>
                    <input required value={newStaff.employee_id} onChange={(e) => setNewStaff({...newStaff, employee_id: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-mono" placeholder="EMP-2026-X" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input required value={newStaff.full_name} onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="e.g. Rahul Sharma" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                    <select value={newStaff.department} onChange={(e) => setNewStaff({...newStaff, department: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm">
                      <option>Operations</option><option>Finance</option><option>Engineering</option><option>Logistics</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Base (₹)</label>
                    <input required type="number" value={newStaff.gross_salary} onChange={(e) => setNewStaff({...newStaff, gross_salary: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="50000" />
                  </div>
                </div>
                <button disabled={addStaff.isPending} type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  {addStaff.isPending ? <Loader2 className="animate-spin" /> : 'Register for Payroll'}
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
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
     <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">{icon}</div>
     </div>
     <h3 className="text-xl font-black text-slate-900">{typeof value === 'number' ? formatCurrency(value) : value}</h3>
     <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>
  </div>
);

export default Payroll;
