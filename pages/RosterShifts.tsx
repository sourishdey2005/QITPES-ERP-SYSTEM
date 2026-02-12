
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Clock, Calendar, Users, Plus, X, Loader2, 
  RotateCcw, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Monitor, Coffee, Zap
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const RosterShifts: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: '', shift_id: '' });

  const { data: shifts } = useQuery({
    queryKey: ['shifts_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shifts').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: employees } = useQuery({
    queryKey: ['employees_roster'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, department');
      if (error) throw error;
      return data;
    }
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['shift_assignments', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('*, employees(full_name, department), shifts(name, start_time, end_time)')
        .eq('assignment_date', selectedDate);
      if (error) throw error;
      return data;
    }
  });

  const assignShift = useMutation({
    mutationFn: async (assign: any) => {
      const { data, error } = await supabase.from('shift_assignments').insert([{ ...assign, assignment_date: selectedDate }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift_assignments'] });
      setIsAssignOpen(false);
    }
  });

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Workforce Roster</h1>
          <p className="text-slate-500 text-sm font-medium">Coordinate site shifts, night differentials, and rotation cycles.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest px-4" />
           </div>
           <button 
             onClick={() => setIsAssignOpen(true)}
             className="bg-blue-600 text-white px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3"
           >
             <Plus size={18} /> Assign Deployment
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                   <Monitor size={20} className="text-blue-600" /> Active Site Deployment: {selectedDate}
                </h3>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-6">Staff Identification</th>
                      <th className="px-10 py-6">Division</th>
                      <th className="px-10 py-6">Assigned Shift</th>
                      <th className="px-10 py-6">Time Window</th>
                      <th className="px-10 py-6 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                   {isLoading ? (
                     <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                   ) : assignments?.length === 0 ? (
                     <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">Zero personnel assigned to shifts for this date node.</td></tr>
                   ) : assignments?.map((a: any) => (
                     <tr key={a.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-tight">{a.employees?.full_name}</td>
                        <td className="px-10 py-6 text-slate-500 font-bold">{a.employees?.department}</td>
                        <td className="px-10 py-6">
                           <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             a.shifts?.name === 'Night' ? 'bg-indigo-50 text-indigo-600' :
                             a.shifts?.name === 'Evening' ? 'bg-amber-50 text-amber-600' :
                             'bg-emerald-50 text-emerald-600'
                           }`}>
                              {a.shifts?.name}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-slate-400 font-mono text-xs">{a.shifts?.start_time.slice(0,5)} - {a.shifts?.end_time.slice(0,5)}</td>
                        <td className="px-10 py-6 text-right">
                           <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase">Confirmed</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <RotateCcw size={16} className="text-blue-500" /> Shift Patterns
              </h3>
              <div className="space-y-6">
                 {shifts?.map((s: any) => (
                   <div key={s.id} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between group-hover:bg-white group-hover:border-blue-100 transition-all">
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{s.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-blue-600 uppercase">Load Fact.</p>
                         <p className="text-sm font-black text-slate-900">x{s.allowance_multiplier}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 text-emerald-400 mb-8">
                    <Coffee size={24} fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Health Metrics</span>
                 </div>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">System tracking <span className="text-white font-black">2 Night-Cycle Nodes</span>. Fatigue mitigation protocol is <span className="text-emerald-400 font-black">ACTIVE</span>. Rotate personnel for Q4 optimization.</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isAssignOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Staff Assignment</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Initialize site deployment shift</p>
                </div>
                <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); assignShift.mutate(assignForm); }} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel ID</label>
                  <select required value={assignForm.employee_id} onChange={(e) => setAssignForm({...assignForm, employee_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                    <option value="">Select Staff</option>
                    {employees?.map((e: any) => <option key={e.id} value={e.id}>{e.full_name} ({e.department})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Shift</label>
                  <select required value={assignForm.shift_id} onChange={(e) => setAssignForm({...assignForm, shift_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                    <option value="">Select Shift Node</option>
                    {shifts?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>)}
                  </select>
                </div>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-[24px] flex items-start gap-4">
                   <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                   <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">Enterprise Policy: This assignment will auto-sync with the monthly payroll burn-rate calculations.</p>
                </div>
                <button disabled={assignShift.isPending} type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
                  {assignShift.isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Authorize Deployment</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RosterShifts;
