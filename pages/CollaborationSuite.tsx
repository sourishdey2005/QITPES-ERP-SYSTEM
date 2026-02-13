
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  Video, Monitor, Users, MapPin, Plus, Clock,
  Search, X, Loader2, Calendar, LayoutGrid, CheckCircle2,
  ChevronRight, AlertTriangle, Coffee, Sparkles, Trash2, Building2
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const CollaborationSuite: React.FC = () => {
  const queryClient = useQueryClient();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ title: '', room_id: '', start_time: '', end_time: '', department: 'Engineering' });
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '4', location: '', equipment: [] });

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['conference_rooms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conference_rooms').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: meetings, isLoading: loadingMeetings } = useQuery({
    queryKey: ['upcoming_meetings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meetings').select('*, conference_rooms(name)').order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
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
      setBookingForm({ title: '', room_id: '', start_time: '', end_time: '', department: 'Engineering' });
    }
  });

  const addRoom = useMutation({
    mutationFn: async (room: any) => {
      const { data, error } = await supabase.from('conference_rooms').insert([{
        ...room,
        capacity: parseInt(room.capacity),
        status: 'Available'
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conference_rooms'] });
      setIsRoomModalOpen(false);
      setRoomForm({ name: '', capacity: '4', location: '', equipment: [] });
      // If we are currently in the booking modal, select this new room
      if (isBookingOpen && data && data[0]) {
        setBookingForm(prev => ({ ...prev, room_id: data[0].id }));
      }
    }
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conference_rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conference_rooms'] })
  });

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Collaboration Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Enterprise conference rooms, virtual syncs, and smart agenda management.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"
          >
            <Building2 size={18} /> Register Room
          </button>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="bg-red-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:bg-red-700 transition-all flex items-center gap-3"
          >
            <Plus size={18} /> Schedule Symposium
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          {/* UPCOMING MEETINGS */}
          <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                <Video size={20} className="text-red-600" /> Active Session Registry
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingMeetings ? (
                <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-600" /></div>
              ) : meetings?.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-medium italic">No symposia scheduled for this interval.</div>
              ) : meetings?.map((m: any) => (
                <div key={m.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-[24px] flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                        <Calendar size={28} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">{m.title}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{m.department} Division ● {m.conference_rooms?.name || 'Virtual Portal'}</p>
                        <div className="flex items-center gap-4 mt-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROOMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loadingRooms ? [1, 2].map(i => <div key={i} className="h-48 bg-white rounded-[40px] border border-slate-100 animate-pulse" />) :
              rooms?.length === 0 ? (
                <div className="col-span-full p-16 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 text-center">
                  <Monitor size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No Physical Nodes Defined</p>
                  <button onClick={() => setIsRoomModalOpen(true)} className="mt-4 text-red-600 font-bold hover:underline">Register your first room now</button>
                </div>
              ) : rooms?.map((r: any) => (
                <div key={r.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-red-50 rounded-[20px] flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                      <LayoutGrid size={28} />
                    </div>
                    <button onClick={() => deleteRoom.mutate(r.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{r.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{r.location || 'Site Hub'} ● Cap: {r.capacity}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-red-400 mb-8">
                <Sparkles size={24} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-[0.4em]">Resource Optimization</span>
              </div>
              <h3 className="text-3xl font-black mb-6 leading-tight tracking-tighter">Inventory: <span className="text-emerald-400">{rooms?.length || 0} Rooms</span></h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Define meeting spaces to enable cross-departmental coordination nodes.</p>
            </div>
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
                </div>
                <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createMeeting.mutate({ ...bookingForm, organizer_id: 'internal' }); }} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Title</label>
                  <input required value={bookingForm.title} onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-slate-900 text-lg" placeholder="Strategy Hub Q4" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Division</label>
                    <select value={bookingForm.department} onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm">
                      <option>Engineering</option><option>Operations</option><option>Finance</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Room</label>
                    <div className="relative group">
                      <select required value={bookingForm.room_id} onChange={(e) => setBookingForm({ ...bookingForm, room_id: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm appearance-none">
                        <option value="">Select Resource Room</option>
                        {rooms?.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                        ))}
                      </select>
                      {rooms?.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setIsRoomModalOpen(true)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase tracking-tighter bg-red-50 px-3 py-2 rounded-full hover:bg-red-100 transition-all"
                        >
                          <Plus size={12} /> Register Now
                        </button>
                      )}
                    </div>
                    {rooms?.length === 0 && <p className="text-[9px] text-rose-500 font-bold uppercase mt-2 tracking-widest px-2 flex items-center gap-1"><AlertTriangle size={10} /> Error: Resource room registry is empty.</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commencement</label>
                    <input required type="datetime-local" value={bookingForm.start_time} onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Termination</label>
                    <input required type="datetime-local" value={bookingForm.end_time} onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-xs" />
                  </div>
                </div>
                <button disabled={createMeeting.isPending} type="submit" className="w-full py-6 bg-red-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed">
                  {createMeeting.isPending ? <Loader2 className="animate-spin" /> : 'Authorize Session'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROOM MODAL */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Physical Node Entry</h3>
                <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addRoom.mutate(roomForm); }} className="p-12 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Room Name</label>
                  <input required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" placeholder="Executive Suite 1" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capacity</label>
                    <input type="number" required value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</label>
                    <input required value={roomForm.location} onChange={(e) => setRoomForm({ ...roomForm, location: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold" placeholder="HQ Floor 3" />
                  </div>
                </div>
                <button disabled={addRoom.isPending} type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4">
                  {addRoom.isPending ? <Loader2 className="animate-spin" /> : 'Register Room'}
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
