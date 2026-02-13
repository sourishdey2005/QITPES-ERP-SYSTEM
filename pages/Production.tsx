
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Factory, Zap, Activity, AlertCircle, PlayCircle, StopCircle, X, Loader2, Edit, Trash2, Plus } from 'lucide-react';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const Production: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [formData, setFormData] = useState({ unit_name: '', message: '', status_type: 'Info' });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['production_logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('production_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    }
  });

  const createLog = useMutation({
    mutationFn: async (newLog: any) => {
      const { data, error } = await supabase.from('production_logs').insert([newLog]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_logs'] });
      setIsModalOpen(false);
      setFormData({ unit_name: '', message: '', status_type: 'Info' });
    },
    onError: (error: any) => {
      console.error('Failed to create log:', error);
      alert(`Failed to create log: ${error.message || 'Unknown error'}`);
    }
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('production_logs').update(updates).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_logs'] });
      setIsModalOpen(false);
      setEditingLog(null);
      setFormData({ unit_name: '', message: '', status_type: 'Info' });
    },
    onError: (error: any) => {
      console.error('Failed to update log:', error);
      alert(`Failed to update log: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('production_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_logs'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete log:', error);
      alert(`Failed to delete log: ${error.message || 'Unknown error'}`);
    }
  });

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setFormData({
      unit_name: log.unit_name,
      message: log.message,
      status_type: log.status_type
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, unitName: string) => {
    if (window.confirm(`Are you sure you want to delete the log for "${unitName}"?`)) {
      deleteLog.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      updateLog.mutate({ id: editingLog.id, ...formData });
    } else {
      createLog.mutate(formData);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
    setFormData({ unit_name: '', message: '', status_type: 'Info' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Error': return 'text-red-500 bg-red-50 border-red-200';
      case 'Warning': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'Success': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Error': return <StopCircle className="text-red-500" />;
      case 'Warning': return <AlertCircle className="text-amber-500" />;
      case 'Success': return <PlayCircle className="text-green-500" />;
      default: return <Activity className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 page-transition text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Plant & Production</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time site output and machinery telemetry with full activity log management.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:bg-red-700 transition-all flex items-center gap-3"
        >
          <Plus size={18} /> Log Activity
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    {editingLog ? 'Update Activity Log' : 'Log Production Activity'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Name</label>
                  <input
                    required
                    value={formData.unit_name}
                    onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-slate-900 text-lg"
                    placeholder="e.g. Mixing Plant B"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Type</label>
                  <select
                    value={formData.status_type}
                    onChange={(e) => setFormData({ ...formData, status_type: e.target.value })}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-black text-sm"
                  >
                    <option>Info</option>
                    <option>Success</option>
                    <option>Warning</option>
                    <option>Error</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-medium text-slate-900 h-32"
                    placeholder="Description of production event..."
                  />
                </div>
                <button
                  disabled={createLog.isPending || updateLog.isPending}
                  type="submit"
                  className="w-full py-6 bg-red-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(createLog.isPending || updateLog.isPending) ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    editingLog ? 'Update Log' : 'Commit Log'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Activity Logs - Takes 2 columns */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[48px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Factory size={24} className="text-red-600" />
              <h3 className="font-black text-slate-900 uppercase tracking-tighter">Unit Activity Logs</h3>
            </div>
            <span className="text-[10px] font-black text-green-600 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              LIVE STREAM
            </span>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-20 text-center">
                <Loader2 className="animate-spin mx-auto text-red-600" size={32} />
              </div>
            ) : logs?.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-medium italic">
                No production logs recorded yet. Click "Log Activity" to start tracking.
              </div>
            ) : (
              logs?.map((log: any) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 p-6 rounded-[24px] border-2 ${getStatusColor(log.status_type)} transition-all group hover:shadow-md`}
                >
                  <div className="mt-1">
                    {getStatusIcon(log.status_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-base font-black text-slate-900">{log.unit_name}</p>
                        <p className="text-sm text-slate-600 mt-1 font-medium">{log.message}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(log)}
                          className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                          title="Edit Log"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id, log.unit_name)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                          title="Delete Log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Stats & Info Panel */}
        <div className="space-y-6">
          {/* Total Logs Card */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-[32px] border border-red-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-red-600 rounded-[20px] flex items-center justify-center shrink-0">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Total Logs</p>
                <p className="text-4xl font-black text-slate-900 mt-1">{logs?.length || 0}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Activity entries recorded</p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Status Breakdown</h3>
            <div className="space-y-4">
              {['Info', 'Success', 'Warning', 'Error'].map((status) => {
                const count = logs?.filter((log: any) => log.status_type === status).length || 0;
                const percentage = logs?.length ? Math.round((count / logs.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700">{status}</span>
                      <span className="text-xs font-black text-slate-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${status === 'Error' ? 'bg-red-500' :
                            status === 'Warning' ? 'bg-amber-500' :
                              status === 'Success' ? 'bg-green-500' :
                                'bg-blue-500'
                          }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Info */}
          <div className="bg-slate-900 p-8 rounded-[32px] text-white">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <Zap size={20} fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Quick Actions</span>
            </div>
            <ul className="space-y-3 text-sm font-medium text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Hover over logs to edit or delete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Click "Log Activity" to add new entries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Logs are sorted by most recent first</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Production;
