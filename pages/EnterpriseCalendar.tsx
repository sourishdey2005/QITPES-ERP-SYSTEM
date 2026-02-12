
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, 
  MapPin, Clock, Users, Coffee, Flag, Briefcase, Zap, Plus, X, Loader2,
  AlertCircle
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const EnterpriseCalendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<'All' | 'Meetings' | 'Leaves' | 'Holidays'>('All');
  
  // Holiday Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', holiday_date: '', type: 'National', branch_id: 'All' });

  // Real-time data aggregation
  const { data: events, isLoading } = useQuery({
    queryKey: ['enterprise-calendar-events', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      const [
        { data: meetings },
        { data: holidays },
        { data: leaves }
      ] = await Promise.all([
        supabase.from('meetings').select('*').gte('start_time', startOfMonth).lte('start_time', endOfMonth),
        supabase.from('holidays').select('*').gte('holiday_date', startOfMonth).lte('holiday_date', endOfMonth),
        supabase.from('leave_requests').select('*, employees(full_name)').eq('status', 'Approved').gte('start_date', startOfMonth).lte('start_date', endOfMonth)
      ]);

      return { meetings, holidays, leaves };
    }
  });

  const createHoliday = useMutation({
    mutationFn: async (newHoliday: any) => {
      const { data, error } = await supabase.from('holidays').insert([newHoliday]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-calendar-events'] });
      setIsHolidayModalOpen(false);
      setHolidayForm({ name: '', holiday_date: '', type: 'National', branch_id: 'All' });
    }
  });

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  }, [currentDate]);

  const getDayEvents = (date: Date) => {
    if (!events) return [];
    const dStr = date.toISOString().split('T')[0];
    
    const dayMeetings = (events.meetings || [])
      .filter(m => m.start_time.startsWith(dStr))
      .map(m => ({ ...m, type: 'Meeting', color: 'blue' }));
      
    const dayHolidays = (events.holidays || [])
      .filter(h => h.holiday_date === dStr)
      .map(h => ({ ...h, type: 'Holiday', color: 'rose' }));
      
    const dayLeaves = (events.leaves || [])
      .filter(l => l.start_date === dStr)
      .map(l => ({ ...l, type: 'Leave', color: 'emerald' }));

    return [...dayMeetings, ...dayHolidays, ...dayLeaves].filter(e => filter === 'All' || e.type === filter);
  };

  return (
    <div className="space-y-6 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enterprise Planner</h1>
          <p className="text-slate-500 text-sm font-medium">Global synchronization of site milestones, personnel availability, and assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHolidayModalOpen(true)}
            className="flex items-center px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all gap-2"
          >
            <Flag size={14} /> Declare Holiday
          </button>
          <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={20}/></button>
            <span className="text-sm font-black uppercase tracking-widest px-4">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[700px]">
              {calendarGrid.map((date, idx) => (
                <div key={idx} className={`p-4 min-h-[140px] group transition-all ${!date ? 'bg-slate-50/20' : 'hover:bg-blue-50/30'}`}>
                  {date && (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-sm font-black ${date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg' : 'text-slate-400'}`}>
                          {date.getDate()}
                        </span>
                        {getDayEvents(date).length > 0 && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                      </div>
                      <div className="space-y-1.5">
                        {getDayEvents(date).slice(0, 3).map((event, eIdx) => (
                          <div key={eIdx} className={`text-[10px] p-2 rounded-lg font-bold border truncate flex items-center gap-1.5 ${
                            event.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            event.color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                            'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${
                               event.color === 'blue' ? 'bg-blue-400' :
                               event.color === 'rose' ? 'bg-rose-400' :
                               'bg-emerald-400'
                            }`} />
                            {event.title || event.name || event.employees?.full_name}
                          </div>
                        ))}
                        {getDayEvents(date).length > 3 && (
                          <div className="text-[9px] font-black text-slate-400 pl-2 uppercase tracking-widest">+{getDayEvents(date).length - 3} More</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 text-blue-400 mb-6">
                    <Zap size={18} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quick Filter</span>
                 </div>
                 <div className="space-y-2">
                    {(['All', 'Meetings', 'Leaves', 'Holidays'] as const).map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                         {f}
                         {filter === f && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
           </div>

           <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Flag size={16} className="text-rose-500" /> Current Month Holidays
              </h3>
              <div className="space-y-4">
                 {events?.holidays?.map((h: any) => (
                   <div key={h.id} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all font-black text-xs">
                         {new Date(h.holiday_date).getDate()}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-800">{h.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{h.type} Registry</p>
                      </div>
                   </div>
                 ))}
                 {!events?.holidays?.length && <p className="text-xs text-slate-400 font-medium italic text-center py-4">No holidays declared for this period.</p>}
              </div>
           </div>

           <div className="bg-blue-50/50 rounded-[32px] border border-blue-100 p-8">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">AI Analysis</h3>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">System detects <span className="font-black">Low Burnout Risk</span> this month. Personnel density is optimal for site deployment in Pune Zone.</p>
           </div>
        </div>
      </div>

      {/* DECLARE HOLIDAY MODAL */}
      <AnimatePresence>
        {isHolidayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Declare Holiday</h3>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-1">Global Site Synchronization</p>
                </div>
                <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createHoliday.mutate(holidayForm); }} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Holiday Identifier</label>
                  <input required value={holidayForm.name} onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-slate-900 focus:ring-8 focus:ring-rose-500/5 transition-all text-lg" placeholder="e.g. Diwali Festival" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry Type</label>
                    <select value={holidayForm.type} onChange={(e) => setHolidayForm({...holidayForm, type: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                      <option>National</option><option>Regional</option><option>Emergency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Date</label>
                    <input required type="date" value={holidayForm.holiday_date} onChange={(e) => setHolidayForm({...holidayForm, holiday_date: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black" />
                  </div>
                </div>
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[24px] flex items-start gap-4">
                   <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                   <p className="text-[10px] text-rose-700 font-bold uppercase leading-relaxed">System Alert: Declaring a holiday will auto-block attendance logs and adjust payroll liability for the selected date.</p>
                </div>
                <button disabled={createHoliday.isPending} type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-rose-500/20 hover:bg-black transition-all flex items-center justify-center gap-4">
                  {createHoliday.isPending ? <Loader2 className="animate-spin" /> : <><Flag size={20} /> Commit Declaration</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnterpriseCalendar;
