
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Shield, UserCheck, UserX, Mail, Search, CheckCircle, X, Loader2, Save, Key, Copy, Check } from 'lucide-react';
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
    // Removed access restriction as per updated requirement to give full access to director and accounting roles.


    const { data: users, isLoading } = useQuery({
        queryKey: ['approved_users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('approved_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            return data;
        },
    });

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

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <div className="space-y-8 page-transition text-black">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Access Control</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage approved users and set their initial credentials.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <UserCheck size={18} /> Approve New User
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards remain same */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <UserCheck className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                            <p className="text-2xl font-black text-slate-900">{users?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Access</p>
                            <p className="text-2xl font-black text-slate-900">
                                {users?.filter((u: any) => u.is_active).length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                            <UserX className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revoked</p>
                            <p className="text-2xl font-black text-slate-900">
                                {users?.filter((u: any) => !u.is_active).length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Approved Accounts</h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 block"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Initial Password</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                                    </td>
                                </tr>
                            ) : filteredUsers?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                                        No approved users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers?.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{user.full_name || '—'}</p>
                                                <p className="text-sm text-slate-500 font-medium">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${user.role === 'owner'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : user.role === 'director'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            {user.initial_password ? (
                                                <div className="flex items-center gap-2 group">
                                                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200 select-all">
                                                        {user.initial_password}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(user.initial_password, user.id)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Copy Password"
                                                    >
                                                        {copiedId === user.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                                    Active
                                                </span>
                                            ) : user.initial_password === 'Pending Approval' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                    Pending Request
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                                    Revoked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.email.toLowerCase() !== 'abhradeephazra99@gmail.com' && (
                                                    <>
                                                        <button
                                                            onClick={() => toggleStatus.mutate({ id: user.id, is_active: !user.is_active })}
                                                            className={`p-2 rounded-lg transition-colors border ${user.is_active
                                                                ? 'text-red-600 border-red-200 hover:bg-red-50'
                                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                                                }`}
                                                            title={user.is_active ? 'Revoke Access' : 'Approve / Restore Access'}
                                                        >
                                                            {user.is_active ? <UserX size={16} /> : <CheckCircle size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to permanently delete this user?')) {
                                                                    deleteUser.mutate(user.id);
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                                            title="Delete Record"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {user.email.toLowerCase() === 'abhradeephazra99@gmail.com' && (
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">Owner</span>
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

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Approve New User</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); addUser.mutate(formData); }} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</label>
                                    <input
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                                            placeholder="user@qitpes.in"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={formData.initial_password}
                                            onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 font-mono"
                                            placeholder="Set strong password..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Share this password with the user for registration.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                                    >
                                        <option value="accounting">Accounting (Standard)</option>
                                        <option value="director">Director (Manager)</option>
                                        <option value="owner">Owner (Admin)</option>
                                    </select>
                                </div>

                                <button
                                    disabled={addUser.isPending}
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 text-white rounded-[16px] font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {addUser.isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Approve & Save</>}
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
