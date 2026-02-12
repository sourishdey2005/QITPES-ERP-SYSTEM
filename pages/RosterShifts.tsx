
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Clock, Calendar, Users, Plus, X, Loader2, 
  RotateCcw, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Monitor, Coffee, Zap, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const RosterShifts: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: '', shift_id: '' });
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '09:00:00', end_time: '17:00:00', allowance_multiplier: '1.0' });

  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shifts').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees_roster'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, department').order('full_name');
      if (error) throw error;
      return data || [];
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
      return data || [];
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
      setAssignForm({ employee_id: '', shift_id: '' });
    }
  });

  const createShiftPattern = useMutation({
    mutationFn: async (shift: any) => {
      const { data, error } = await supabase.from('shifts').insert([{
        ...shift,
        allowance_multiplier: parseFloat(shift.allowance_multiplier)
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts_list'] });
      setIsShiftModalOpen(false);
      setShiftForm({ name: '', start_time: '09:00:00', end_time: '17:00:00', allowance_multiplier: '1.0' });
      // If we are currently in the assign modal, select this new shift
      if (isAssignOpen && data && data[0]) {
        setAssignForm(prev => ({ ...prev, shift_id: data[0].id }));
      }
    }
  });

  const deleteShiftPattern = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts_list'] })
  });

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Workforce Roster</h1>
          <p className="text-slate-500 text-sm font-medium">Coordinate site shifts, night differentials, and rotation cycles.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setIsShiftModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
             <RotateCcw size={18} /> New Pattern
           </button>
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
                   <Monitor size={20} className="text-blue-600" /> Site Deployment: <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-blue-600 uppercase" />
                </h3>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-6">Staff Identity</th>
                      <th className="px-10 py-6">Division</th>
                      <th className="px-10 py-6">Shift Node</th>
                      <th className="px-10 py-6 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                   {isLoading ? (
                     <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                   ) : assignments?.length === 0 ? (
                     <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No personnel nodes assigned for this date.</td></tr>
                   ) : assignments?.map((a: any) => (
                     <tr key={a.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-tight">{a.employees?.full_name}</td>
                        <td className="px-10 py-6 text-slate-500 font-bold">{a.employees?.department}</td>
                        <td className="px-10 py-6">
                           <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             a.shifts?.name.toLowerCase().includes('night') ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                           }`}>
                              {a.shifts?.name}
                           </span>
                        </td>
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
                 <RotateCcw size={16} className="text-blue-500" /> Active Patterns
              </h3>
              <div className="space-y-6">
                 {loadingShifts ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : 
                  shifts?.length === 0 ? <p className="text-xs text-slate-400 italic text-center">No patterns defined.</p> :
                  shifts?.map((s: any) => (
                   <div key={s.id} className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between hover:bg-white transition-all relative group/item">
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{s.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</p>
                      </div>
                      <button onClick={() => deleteShiftPattern.mutate(s.id)} className="opacity-0 group-hover/item:opacity-100 p-2 text-rose-400 hover:text-rose-600 transition-all">
                        <Trash2 size={14} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Staff Assignment</h3>
                <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); assignShift.mutate(assignForm); }} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Identity</label>
                  <select required value={assignForm.employee_id} onChange={(e) => setAssignForm({...assignForm, employee_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                    <option value="">Select Personnel Node</option>
                    {employees?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.department})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Shift Node</label>
                  <div className="relative group">
                    <select required value={assignForm.shift_id} onChange={(e) => setAssignForm({...assignForm, shift_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm appearance-none">
                      <option value="">Select Shift Node</option>
                      {shifts?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>
                      ))}
                    </select>
                    {shifts?.length === 0 && (
                      <button 
                        type="button"
                        onClick={() => setIsShiftModalOpen(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-tighter bg-blue-50 px-3 py-2 rounded-full hover:bg-blue-100 transition-all"
                      >
                        <Plus size={12}/> Define Now
                      </button>
                    )}
                  </div>
                  {shifts?.length === 0 && <p className="text-[9px] text-rose-500 font-bold uppercase mt-2 tracking-widest px-2 flex items-center gap-1"><AlertTriangle size={10}/> Error: Define a shift pattern first.</p>}
                </div>
                <button disabled={assignShift.isPending || !assignForm.employee_id || !assignForm.shift_id} type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed">
                  {assignShift.isPending ? <Loader2 className="animate-spin" /> : 'Authorize Deployment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHIFT PATTERN MODAL */}
      <AnimatePresence>
        {isShiftModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Define Shift Logic</h3>
                <button onClick={() => setIsShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createShiftPattern.mutate(shiftForm); }} className="p-12 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift Identifier</label>
                  <input required value={shiftForm.name} onChange={(e) => setShiftForm({...shiftForm, name: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" placeholder="e.g. Night Watch" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Start Time</label>
                      <input required type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({...shiftForm, start_time: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End Time</label>
                      <input required type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({...shiftForm, end_time: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" />
                   </div>
                </div>
                <button disabled={createShiftPattern.isPending} type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4">
                  {createShiftPattern.isPending ? <Loader2 className="animate-spin" /> : 'Commit Pattern'}
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
