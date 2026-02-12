
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
  Users, UserPlus, Calendar, IndianRupee, Search, Filter,
  X, Loader2, CheckCircle2, ChevronRight, Coins, Zap,
  AlertTriangle, Hammer, HandMetal, Construction, Trash2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

type WageTab = 'registry' | 'attendance' | 'payroll';

const SiteWages: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<WageTab>('registry');
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [workerForm, setWorkerForm] = useState({
    worker_id: '',
    full_name: '',
    trade: 'General Labour',
    daily_wage: '500',
    site_location: ''
  });

  // Queries
  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ['contract_workers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contract_workers').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: dailyAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['contract_attendance', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_attendance')
        .select('*')
        .eq('attendance_date', selectedDate);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: monthAttendance, isLoading: loadingMonthData } = useQuery({
    queryKey: ['contract_attendance_month', selectedMonth],
    queryFn: async () => {
      const start = `${selectedMonth}-01`;
      const end = `${selectedMonth}-31`;
      const { data, error } = await supabase
        .from('contract_attendance')
        .select('*, contract_workers(id, full_name, daily_wage, trade)')
        .gte('attendance_date', start)
        .lte('attendance_date', end);
      if (error) throw error;
      return data || [];
    }
  });

  // Mutations
  const addWorker = useMutation({
    mutationFn: async (worker: any) => {
      const { data, error } = await supabase.from('contract_workers').insert([{
        ...worker,
        daily_wage: parseFloat(worker.daily_wage)
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_workers'] });
      setIsWorkerModalOpen(false);
      setWorkerForm({ worker_id: '', full_name: '', trade: 'General Labour', daily_wage: '500', site_location: '' });
    }
  });

  const deleteWorker = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Are you sure you want to decommission this contractor node? All attendance records will be purged.")) return;
      const { error } = await supabase.from('contract_workers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_workers'] });
      queryClient.invalidateQueries({ queryKey: ['contract_attendance'] });
    }
  });

  const toggleAttendance = useMutation({
    mutationFn: async ({ worker_id, date, current_status }: any) => {
      if (current_status === 'none') {
        const { error } = await supabase.from('contract_attendance').insert([{
          worker_id,
          attendance_date: date,
          status: 'Present'
        }]);
        if (error) throw error;
      } else if (current_status === 'Present') {
        const { error } = await supabase.from('contract_attendance')
          .update({ status: 'Absent' })
          .eq('worker_id', worker_id)
          .eq('attendance_date', date);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contract_attendance')
          .delete()
          .eq('worker_id', worker_id)
          .eq('attendance_date', date);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contract_attendance'] })
  });

  // Analytics
  const payrollSummary = useMemo(() => {
    if (!monthAttendance || !workers) return [];
    return workers.map(w => {
      const presentDays = monthAttendance.filter(a => a.worker_id === w.id && a.status === 'Present').length;
      return {
        ...w,
        presentDays,
        totalWage: presentDays * w.daily_wage
      };
    });
  }, [monthAttendance, workers]);

  const totalMonthlyLiability = useMemo(() => payrollSummary.reduce((s, p) => s + p.totalWage, 0), [payrollSummary]);

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Site Wage Engine</h1>
          <p className="text-slate-500 text-sm font-medium">Automated attendance-based payroll node for site contractors.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-200 shadow-xl gap-2">
          {(['registry', 'attendance', 'payroll'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => {
              const data = activeTab === 'payroll' ? payrollSummary : activeTab === 'attendance' ? dailyAttendance : workers;
              const ws = XLSX.utils.json_to_sheet(data || []);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, activeTab);
              XLSX.writeFile(wb, `Site_${activeTab}_Report.xlsx`);
            }}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export {activeTab}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'registry' && (
              <motion.div key="reg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                      <Users size={20} className="text-blue-600" /> Contractor Master Registry
                    </h3>
                    <button onClick={() => setIsWorkerModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">
                      <UserPlus size={14} /> Add Contractor
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-6">Worker Identity</th>
                        <th className="px-10 py-6">Operational Trade</th>
                        <th className="px-10 py-6">Daily Wage Node</th>
                        <th className="px-10 py-6">Site Hub</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                      {loadingWorkers ? (
                        <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                      ) : workers?.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No contractor nodes registered in system.</td></tr>
                      ) : workers?.map((w: any) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-10 py-6">
                            <span className="text-[10px] font-mono text-slate-400 block tracking-widest">{w.worker_id}</span>
                            <span className="font-black text-slate-900 uppercase">{w.full_name}</span>
                          </td>
                          <td className="px-10 py-6 text-slate-500 font-bold uppercase text-xs">{w.trade}</td>
                          <td className="px-10 py-6 font-black text-slate-900">{formatCurrency(w.daily_wage)} / DAY</td>
                          <td className="px-10 py-6 text-slate-400 font-bold">{w.site_location || 'Global Pool'}</td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                              <button
                                onClick={() => deleteWorker.mutate(w.id)}
                                disabled={deleteWorker.isPending}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div key="att" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-600" /> Site Presence:
                      </h3>
                      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-emerald-500/5" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                      <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Present</span>
                      <span className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Absent</span>
                      <span className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-200 rounded-full" /> Not Marked</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                    {workers?.map((w: any) => {
                      const att = dailyAttendance?.find(a => a.worker_id === w.id);
                      const status = att ? att.status : 'none';
                      return (
                        <div key={w.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] group hover:border-blue-200 transition-all flex flex-col justify-between h-48">
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{w.trade}</p>
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{w.full_name}</h4>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleAttendance.mutate({ worker_id: w.id, date: selectedDate, current_status: status })}
                              className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${status === 'Present' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-white text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => toggleAttendance.mutate({ worker_id: w.id, date: selectedDate, current_status: status === 'Absent' ? 'Absent_toggle_back' : 'Present' })}
                              className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${status === 'Absent' ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/20' : 'bg-white text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payroll' && (
              <motion.div key="pay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                      <IndianRupee size={20} className="text-blue-600" /> Wage Liability: <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none outline-none font-black text-blue-600 uppercase" />
                    </h3>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-6">Resource Identity</th>
                        <th className="px-10 py-6">Daily Wage</th>
                        <th className="px-10 py-6">Days Present</th>
                        <th className="px-10 py-6">Total Monthly Payout</th>
                        <th className="px-10 py-6 text-right">Compliance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                      {payrollSummary.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-10 py-6">
                            <span className="font-black text-slate-900 uppercase">{p.full_name}</span>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.trade}</p>
                          </td>
                          <td className="px-10 py-6 text-slate-500 font-bold">{formatCurrency(p.daily_wage)}</td>
                          <td className="px-10 py-6">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">{p.presentDays} DAYS</span>
                          </td>
                          <td className="px-10 py-6 font-black text-slate-900 text-lg">{formatCurrency(p.totalWage)}</td>
                          <td className="px-10 py-6 text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded">Auto-Calculated</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-400 mb-6">
                <Zap size={18} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Fiscal Monitor</span>
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Cycle Liability</h3>
              <p className="text-4xl font-black text-white tracking-tighter mb-1">{formatCurrency(totalMonthlyLiability)}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-8">Estimated QITPES 2026 Site Cost</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Node Status</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Audit Trail</span>
                  <span className="text-blue-400">Enabled</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-[80px]" />
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <HandMetal size={16} className="text-blue-500" /> Dynamic Trades
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Masonry Node', icon: <Hammer />, count: workers?.filter(w => w.trade.toLowerCase().includes('mason')).length || 0 },
                { label: 'Electrical Hub', icon: <Zap />, count: workers?.filter(w => w.trade.toLowerCase().includes('electric')).length || 0 },
                { label: 'General Site', icon: <Construction />, count: workers?.filter(w => w.trade.toLowerCase().includes('labour') || w.trade.toLowerCase().includes('helper')).length || 0 },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">{t.icon}</div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">{t.label}</span>
                  </div>
                  <span className="font-black text-slate-900">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WORKER MODAL */}
      <AnimatePresence>
        {isWorkerModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Register Contractor Node</h3>
                <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addWorker.mutate(workerForm); }} className="p-12 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Code</label>
                    <input required value={workerForm.worker_id} onChange={(e) => setWorkerForm({ ...workerForm, worker_id: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm" placeholder="CW-2026-X" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Legal Name</label>
                    <input required value={workerForm.full_name} onChange={(e) => setWorkerForm({ ...workerForm, full_name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm" placeholder="Suresh Raina" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Trade</label>
                    <select value={workerForm.trade} onChange={(e) => setWorkerForm({ ...workerForm, trade: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-xs">
                      <option>Mason</option><option>Electrician</option><option>Carpenter</option><option>General Labour</option><option>Site Helper</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily Wage Rate (₹)</label>
                    <input required type="number" value={workerForm.daily_wage} onChange={(e) => setWorkerForm({ ...workerForm, daily_wage: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Deployment Site</label>
                  <input value={workerForm.site_location} onChange={(e) => setWorkerForm({ ...workerForm, site_location: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm" placeholder="e.g. Pune Site C" />
                </div>
                <button disabled={addWorker.isPending} type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4">
                  {addWorker.isPending ? <Loader2 className="animate-spin" /> : 'Register Contractor Node'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteWages;
