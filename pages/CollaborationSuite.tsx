
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { 
  Video, Monitor, Users, MapPin, Plus, Clock, 
  Search, X, Loader2, Calendar, LayoutGrid, CheckCircle2,
  ChevronRight, AlertTriangle, Coffee, Sparkles
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const CollaborationSuite: React.FC = () => {
  const queryClient = useQueryClient();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ title: '', room_id: '', start_time: '', end_time: '', department: 'Engineering' });

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['conference_rooms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_rooms').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: meetings, isLoading: loadingMeetings } = useQuery({
    queryKey: ['upcoming_meetings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meetings').select('*, conference_rooms(name)').order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: any) => {
      const { data, error } = await supabase.from('meetings').insert([meeting]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming_meetings'] });
      setIsBookingOpen(false);
    }
  });

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Collaboration Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Enterprise conference rooms, virtual syncs, and smart agenda management.</p>
        </div>
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3"
        >
          <Plus size={18} /> Schedule Symposium
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
           {/* UPCOMING MEETINGS */}
           <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                    <Video size={20} className="text-blue-600" /> Active Session Registry
                 </h3>
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">REALTIME SYNC</span>
              </div>
              <div className="divide-y divide-slate-100">
                 {loadingMeetings ? (
                   <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
                 ) : meetings?.length === 0 ? (
                   <div className="p-20 text-center text-slate-400 font-medium italic">No symposia scheduled for this interval.</div>
                 ) : meetings?.map((m: any) => (
                   <div key={m.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-start justify-between">
                         <div className="flex gap-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-[24px] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                               <Calendar size={28} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{m.title}</h4>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{m.department} Division ● {m.conference_rooms?.name || 'Virtual Portal'}</p>
                               <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-500">
                                  <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(m.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span className="flex items-center gap-1.5"><MapPin size={14}/> {m.location || 'HQ Block 2'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter">Approved</span>
                            <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* ROOMS AVAILABILITY */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {rooms?.map((r: any) => (
                <div key={r.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
                   <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                         <LayoutGrid size={28} />
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         {r.status}
                      </span>
                   </div>
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{r.name}</h4>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Capacity: {r.capacity} Nodes</p>
                   
                   <div className="flex flex-wrap gap-2 mt-6">
                      {['VC', 'Whiteboard', 'Dual-Monitor'].map(eq => (
                        <span key={eq} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{eq}</span>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 text-blue-400 mb-8">
                    <Sparkles size={24} fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Productivity Intelligence</span>
                 </div>
                 <h3 className="text-3xl font-black mb-6 leading-tight tracking-tighter">Site Meeting Density: <span className="text-emerald-400">Optimal</span></h3>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium mb-10">AI analyzes <span className="text-white font-black">14.2 hrs</span> of planned coordination. Collaborative nodes are firing efficiently with zero detected burnout risk in Engineering.</p>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>SYMMETRY INDEX</span>
                       <span className="text-white">92.4%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: "92.4%" }} className="h-full bg-blue-500" />
                    </div>
                 </div>
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
           </div>

           <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Conference Telemetry</h3>
              <div className="space-y-6">
                 {[
                   { label: 'Room Utilization', val: '64%', color: 'text-blue-600' },
                   { label: 'Average Duration', val: '42m', color: 'text-slate-900' },
                   { label: 'Virtual Adoption', val: '88%', color: 'text-emerald-600' },
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0">
                      <span className="text-xs font-bold text-slate-400 uppercase">{stat.label}</span>
                      <span className={`text-lg font-black ${stat.color}`}>{stat.val}</span>
                   </div>
                 ))}
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
           </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Symposium Registry</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Design corporate interaction nodes</p>
                </div>
                <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createMeeting.mutate({...bookingForm, organizer_id: 'internal'}); }} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Title</label>
                  <input required value={bookingForm.title} onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-slate-900 focus:ring-8 focus:ring-blue-500/5 transition-all text-lg" placeholder="e.g. Q4 Logistic Scaling Hub" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Division</label>
                    <select value={bookingForm.department} onChange={(e) => setBookingForm({...bookingForm, department: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                      <option>Engineering</option><option>Operations</option><option>Finance</option><option>Strategy</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Room</label>
                    <select required value={bookingForm.room_id} onChange={(e) => setBookingForm({...bookingForm, room_id: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                      <option value="">Select Room</option>
                      {rooms?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commencement</label>
                      <input required type="datetime-local" value={bookingForm.start_time} onChange={(e) => setBookingForm({...bookingForm, start_time: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-xs" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Termination</label>
                      <input required type="datetime-local" value={bookingForm.end_time} onChange={(e) => setBookingForm({...bookingForm, end_time: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-xs" />
                   </div>
                </div>
                <button disabled={createMeeting.isPending} type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
                  {createMeeting.isPending ? <Loader2 className="animate-spin" /> : <><Video size={20} /> Authorize Session</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborationSuite;
