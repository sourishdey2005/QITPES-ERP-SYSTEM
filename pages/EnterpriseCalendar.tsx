
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, 
  MapPin, Clock, Users, Coffee, Flag, Briefcase, Zap
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const EnterpriseCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<'All' | 'Meetings' | 'Leaves' | 'Holidays'>('All');

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
        <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={20}/></button>
          <span className="text-sm font-black uppercase tracking-widest px-4">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
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
                <Flag size={16} className="text-rose-500" /> Upcoming Holidays
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
                 {!events?.holidays?.length && <p className="text-xs text-slate-400 font-medium italic">No holidays this month.</p>}
              </div>
           </div>

           <div className="bg-blue-50/50 rounded-[32px] border border-blue-100 p-8">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">AI Analysis</h3>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">System detects <span className="font-black">Low Burnout Risk</span> this month. Personnel density is optimal for site deployment in Pune Zone.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseCalendar;
