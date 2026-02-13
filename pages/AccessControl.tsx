
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Shield, UserCheck, UserX, Mail, Search, CheckCircle, X, Loader2, Save, Key, Copy, Check, Clock } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

const motion = motionBase as any;

const AccessControl: React.FC = () => {
    const { role, user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ email: '', full_name: '', role: 'accounting', initial_password: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const isOwner = role === 'owner' || user?.email?.toLowerCase() === 'abhradeephazra99@gmail.com';

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['approved_users'],
        queryFn: async () => {
            console.log("Fetching approved_users...");
            const { data, error } = await supabase
                .from('approved_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            console.log("Users fetched:", data);
            return data;
        },
    });

    // Real-time subscription for instant updates when a new user registers
    React.useEffect(() => {
        const channel = supabase
            .channel('public:approved_users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'approved_users' }, (payload) => {
                console.log("Real-time update received:", payload);
                queryClient.invalidateQueries({ queryKey: ['approved_users'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const addUser = useMutation({
        mutationFn: async (newUser: any) => {
            // Check if user already exists
            const { data: existing } = await supabase
                .from('approved_users')
                .select('id')
                .eq('email', newUser.email)
                .single();

            if (existing) {
                throw new Error('User with this email already exists in the approval list.');
            }

            const { data, error } = await supabase
                .from('approved_users')
                .insert([{ ...newUser, is_active: true }])
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approved_users'] });
            setIsModalOpen(false);
            setFormData({ email: '', full_name: '', role: 'accounting', initial_password: '' });
            alert('User added successfully! Share these credentials with them so they can register.');
        },
        onError: (error: any) => {
            alert(`Failed to add user: ${error.message}`);
        }
    });

    const toggleStatus = useMutation({
        mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
            const { error } = await supabase
                .from('approved_users')
                .update({ is_active })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approved_users'] });
        },
        onError: (error: any) => {
            alert(`Failed to update status: ${error.message}`);
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('approved_users')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approved_users'] });
        },
        onError: (error: any) => {
            alert(`Failed to remove user: ${error.message}`);
        }
    });

    const filteredUsers = users?.filter((user: any) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingUsers = filteredUsers?.filter((u: any) => !u.is_active && u.initial_password === 'Pending Approval');
    const activeUsers = filteredUsers?.filter((u: any) => u.is_active || (u.initial_password !== 'Pending Approval' && !u.is_active));

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <div className="space-y-8 page-transition text-black pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Access Control Center</h1>
                    <p className="text-slate-500 text-sm font-medium">Review registration requests and manage system permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-[20px] transition-all shadow-sm active:scale-95"
                        title="Refresh List"
                    >
                        <Loader2 size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3"
                    >
                        <UserCheck size={18} /> Add New User
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Requests</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{pendingUsers?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Users</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{activeUsers?.filter((u: any) => u.is_active).length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Records</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{users?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Pending Approval Requests */}
            <div className="bg-white border-2 border-blue-100 rounded-[32px] overflow-hidden shadow-xl shadow-blue-500/5">
                <div className="p-6 border-b border-blue-50 flex items-center justify-between bg-blue-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Registration Requests</h3>
                    </div>
                    {pendingUsers && pendingUsers.length > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
                            {pendingUsers.length} Action Needed
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Details</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Requested Access</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Administrative Decision</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={3} className="px-8 py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                            ) : pendingUsers?.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <CheckCircle size={48} className="text-slate-400" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">No Pending Requests</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pendingUsers?.map((user: any) => (
                                    <tr key={user.id} className="group hover:bg-blue-50/40 transition-all">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-black text-slate-900 text-lg tracking-tight">{user.full_name}</p>
                                                <p className="text-sm text-slate-500 font-medium font-mono">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-800 shadow-sm capitalize">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Decline and delete access request for ${user.full_name}?`)) {
                                                            deleteUser.mutate(user.id);
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-white text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus.mutate({ id: user.id, is_active: true })}
                                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
                                                >
                                                    <CheckCircle size={14} /> Approve Access
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Active System Management */}
            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Access Management</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider opacity-60">Control permissions for active or restricted users.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find specific user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 block transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">User Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Access Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={4} className="px-8 py-12 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></td></tr>
                            ) : activeUsers?.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-xs">No users matching search</td></tr>
                            ) : (
                                activeUsers.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200 uppercase">
                                                    {user.full_name?.substring(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight">{user.full_name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm ${user.role === 'owner'
                                                ? 'bg-purple-600 text-white border-purple-500'
                                                : user.role === 'director'
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-slate-100 text-slate-800 border-slate-200 font-black'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black border bg-green-50 text-green-700 border-green-200 uppercase tracking-widest">
                                                    <div className="w-2 h-2 rounded-full bg-green-600 shadow-sm shadow-green-200" />
                                                    Active Access
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black border bg-red-50 text-red-700 border-red-200 uppercase tracking-widest">
                                                    <div className="w-2 h-2 rounded-full bg-red-600 shadow-sm shadow-red-200" />
                                                    Revoked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {user.email.toLowerCase() !== 'abhradeephazra99@gmail.com' && (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleStatus.mutate({ id: user.id, is_active: !user.is_active })}
                                                            className={`p-3 rounded-2xl transition-all border shadow-sm ${user.is_active
                                                                ? 'text-red-600 border-red-100 bg-white hover:bg-red-600 hover:text-white'
                                                                : 'text-green-600 border-green-100 bg-white hover:bg-green-600 hover:text-white'
                                                                }`}
                                                            title={user.is_active ? 'Revoke Access' : 'Restore Access'}
                                                        >
                                                            {user.is_active ? <UserX size={18} /> : <CheckCircle size={18} />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('PERMANENTLY DELETE user profile? This cannot be undone.')) {
                                                                    deleteUser.mutate(user.id);
                                                                }
                                                            }}
                                                            className="p-3 bg-white text-slate-400 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-2xl transition-all shadow-sm"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                                {user.email.toLowerCase() === 'abhradeephazra99@gmail.com' && (
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Master Identity</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Initial Password Display (for pre-approved users) */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                    <Key className="text-blue-400" size={24} />
                    <h4 className="text-lg font-black uppercase tracking-tight">Pre-Approved Security Credentials</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeUsers?.filter(u => u.initial_password && u.initial_password !== 'Pending Approval').map((user: any) => (
                        <div key={user.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.full_name}</p>
                                <code className="text-blue-400 font-mono text-sm">{user.initial_password}</code>
                            </div>
                            <button
                                onClick={() => copyToClipboard(user.initial_password, user.id)}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                {copiedId === user.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    ))}
                    {activeUsers?.filter(u => u.initial_password && u.initial_password !== 'Pending Approval').length === 0 && (
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No manual credentials to share</p>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-lg">
                        <motion.div
                            initial={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, translateY: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manual User Approval</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-full transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); addUser.mutate(formData); }} className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 font-mono">Full Name</label>
                                    <input
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:border-slate-900 transition-all placeholder:font-medium placeholder:text-slate-300"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 font-mono">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-600" size={20} />
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:border-slate-900 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 font-mono">Initial Security Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            required
                                            type="text"
                                            value={formData.initial_password}
                                            onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                                            className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 font-mono focus:border-slate-900 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            placeholder="Security Passcode"
                                        />
                                    </div>
                                    <p className="px-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider opacity-60">Used by user for first-time profile sync.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 font-mono">System Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-900 appearance-none focus:border-slate-900 transition-all cursor-pointer"
                                    >
                                        <option value="accounting">Accounting</option>
                                        <option value="director">Director</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={addUser.isPending}
                                    className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98] mt-4"
                                >
                                    {addUser.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Complete Approval'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccessControl;
