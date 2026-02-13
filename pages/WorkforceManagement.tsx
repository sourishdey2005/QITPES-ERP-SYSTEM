
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Users, Network, Building2, Star, TrendingUp, MoveHorizontal,
    DoorClosed, ShieldAlert, FileText, Lock, Plus, Search, Filter,
    Edit2, Trash2, CheckCircle2, X, Loader2, Info, ArrowRight,
    UserPlus, Mail, AlertCircle, Bookmark, Folder, Archive
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

type Tab = 'master' | 'hierarchy' | 'departments' | 'appraisals' | 'promotions' | 'transfers' | 'exit' | 'grievances' | 'memos' | 'locker';

const WorkforceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('master');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<Tab | string>('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const queryClient = useQueryClient();

    // Queries
    const { data: db, isLoading } = useQuery({
        queryKey: ['workforce-data'],
        queryFn: async () => {
            const [emp, depts, appraisals, promos, transfers, exits, grievances, memos, docs] = await Promise.all([
                supabase.from('employees').select('*').order('full_name'),
                supabase.from('departments').select('*, head:profiles(full_name)'),
                supabase.from('employee_appraisals').select('*, employees(full_name)'),
                supabase.from('employee_promotions').select('*, employees(full_name)'),
                supabase.from('transfer_requests').select('*, employees(full_name)'),
                supabase.from('exit_clearances').select('*, employees(full_name)'),
                supabase.from('grievances').select('*').order('created_at', { ascending: false }),
                supabase.from('internal_memos').select('*').order('created_at', { ascending: false }),
                supabase.from('employee_documents').select('*, employees(full_name)')
            ]);
            return {
                employees: emp.data || [],
                departments: depts.data || [],
                appraisals: appraisals.data || [],
                promotions: promos.data || [],
                transfers: transfers.data || [],
                exits: exits.data || [],
                grievances: grievances.data || [],
                memos: memos.data || [],
                documents: docs.data || []
            };
        }
    });

    // CRUD Mutations Helper
    const createMutation = (table: string) => useMutation({
        mutationFn: async (newData: any) => {
            const { data, error } = await supabase.from(table).insert([newData]).select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workforce-data'] });
            setIsModalOpen(false);
        }
    });

    const mAddDept = createMutation('departments');
    const mAddAppraisal = createMutation('employee_appraisals');
    const mAddPromo = createMutation('employee_promotions');
    const mAddTransfer = createMutation('transfer_requests');
    const mAddGrievance = createMutation('grievances');
    const mAddMemo = createMutation('internal_memos');

    const updateStatus = (table: string) => useMutation({
        mutationFn: async ({ id, status }: any) => {
            const { error } = await supabase.from(table).update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workforce-data'] })
    });

    const mUpdateTransfer = updateStatus('transfer_requests');
    const mUpdateGrievance = updateStatus('grievances');

    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-600" /></div>;

    return (
        <div className="space-y-8 page-transition">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Workforce Management</h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Enterprise HR Control & Organizational Engineering.</p>
                </div>
                <div className="flex flex-wrap bg-slate-100/50 p-1.5 rounded-[24px] border border-slate-200">
                    {(['master', 'departments', 'appraisals', 'promotions', 'memos'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                        </button>
                    ))}
                    {(['transfers', 'exit', 'grievances', 'locker'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-black">

                    {activeTab === 'master' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-4 bg-white border border-slate-200 px-4 py-2 rounded-2xl w-full max-w-md shadow-inner">
                                    <Search size={18} className="text-slate-400" />
                                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search employee master nodes..." className="outline-none text-sm w-full font-medium" />
                                </div>
                                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                                    <UserPlus size={16} /> New Hire Node
                                </button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-10 py-5">Full Legal Name</th>
                                        <th className="px-10 py-5">Department</th>
                                        <th className="px-10 py-5">Global Role</th>
                                        <th className="px-10 py-5">Fiscal Status</th>
                                        <th className="px-10 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db?.employees.filter(e => e.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-5 font-black text-slate-900 uppercase text-xs">{e.full_name}</td>
                                            <td className="px-10 py-5 text-slate-500 font-bold uppercase text-[10px]">{e.department}</td>
                                            <td className="px-10 py-5 text-slate-900 font-black text-xs uppercase">{e.role || 'Unassigned'}</td>
                                            <td className="px-10 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${e.employee_status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {e.employee_status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"><Edit2 size={14} /></button>
                                                    <button onClick={() => { setModalType('locker'); setSelectedItem(e); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all"><Lock size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'departments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {db?.departments.map(dept => (
                                <div key={dept.id} className="bg-white p-10 rounded-[48px] border border-slate-200 group hover:border-emerald-500 transition-all flex flex-col justify-between h-72">
                                    <div className="space-y-4">
                                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center p-3">
                                            <Building2 strokeWidth={3} />
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{dept.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Head: {dept.head?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="border-t pt-6 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Budget: {formatCurrency(dept.budget_limit)}</span>
                                        <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('addDept'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-[48px] flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 transition-all h-72 group">
                                <Plus size={32} className="mb-4 group-hover:scale-125 transition-transform" />
                                <span className="font-black uppercase text-[10px] tracking-widest">Build Department Structure</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'appraisals' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 flex justify-between items-center">
                                <h3 className="font-black text-slate-900 uppercase text-lg tracking-tighter">Performance Appraisal Scoring</h3>
                                <button onClick={() => { setModalType('addAppraisal'); setIsModalOpen(true); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">Record Appraisal</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {db?.appraisals.map(ap => (
                                    <div key={ap.id} className="bg-white p-8 rounded-[40px] border border-slate-200 flex items-center justify-between hover:shadow-xl hover:shadow-slate-100 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-900 rounded-[28px] flex flex-col items-center justify-center text-white">
                                                <span className="text-2xl font-black">{ap.score}</span>
                                                <span className="text-[8px] font-bold uppercase opacity-50">Score</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(ap.appraisal_date).toLocaleDateString()}</p>
                                                <h4 className="font-black text-slate-900 uppercase text-lg mb-1">{ap.employees?.full_name}</h4>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-1 italic">"{ap.feedback}"</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'promotions' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Promotion History Tracker</h3>
                                <button onClick={() => { setModalType('addPromo'); setIsModalOpen(true); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest tracking-tighter">Register Promotion</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-10 py-5">Employee</th>
                                        <th className="px-10 py-5">Legacy Role</th>
                                        <th className="px-10 py-5">New Designation</th>
                                        <th className="px-10 py-5">Salary Delta</th>
                                        <th className="px-10 py-5">Effective Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db?.promotions.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-10 py-5 font-black text-slate-900 uppercase text-xs">{p.employees?.full_name}</td>
                                            <td className="px-10 py-5 text-slate-400 font-bold uppercase text-[10px]">{p.old_role}</td>
                                            <td className="px-10 py-5 text-emerald-600 font-black text-xs uppercase">{p.new_role}</td>
                                            <td className="px-10 py-5 font-black text-slate-900">{formatCurrency(p.new_salary - (p.old_salary || 0))}</td>
                                            <td className="px-10 py-5 text-slate-500 font-bold uppercase text-[10px]">{new Date(p.effective_date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'memos' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-200">
                                <h3 className="font-black text-slate-900 uppercase text-lg tracking-tighter">Internal Memo System</h3>
                                <button onClick={() => { setModalType('addMemo'); setIsModalOpen(true); }} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200">Broadcast Memo</button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {db?.memos.map(m => (
                                    <div key={m.id} className="bg-white p-10 rounded-[48px] border border-slate-200 relative overflow-hidden group hover:border-red-500 transition-all">
                                        {m.is_urgent && <div className="absolute top-0 right-0 px-6 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">Urgent Action Required</div>}
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(m.created_at).toLocaleString()} • To: {m.target_audience}</p>
                                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{m.title}</h4>
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{m.content}"</p>
                                        </div>
                                        <div className="mt-8 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><Mail size={14} /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office of Executive Command</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'grievances' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 flex justify-between items-center">
                                <h3 className="font-black text-slate-900 uppercase text-lg tracking-tighter">Grievance Submission Portal</h3>
                                <button onClick={() => { setModalType('addGrievance'); setIsModalOpen(true); }} className="px-6 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20">Submit Grievance</button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {db?.grievances.map(g => (
                                    <div key={g.id} className="bg-white p-8 rounded-[32px] border border-slate-200 flex items-center justify-between group hover:border-red-400 transition-all">
                                        <div className="flex gap-8 items-center">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${g.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {g.status === 'Open' ? <AlertCircle /> : <CheckCircle2 />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g.category} • Ref: {g.id.slice(0, 6)}</p>
                                                <h4 className="font-black text-slate-900 uppercase text-lg">{g.subject}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 italic mt-1">{new Date(g.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${g.status === 'Open' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{g.status}</span>
                                            {g.status === 'Open' && <button onClick={() => mUpdateGrievance.mutate({ id: g.id, status: 'Resolved' })} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Mark Resolved</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

            {/* CRUD MODAL SYSTEM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white text-black">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Operational Command Console</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 p-3 hover:bg-slate-50 rounded-full transition-all shadow-sm"><X size={24} /></button>
                            </div>

                            <div className="p-12 space-y-6">
                                {modalType === 'addDept' && <AddDeptForm loading={mAddDept.isPending} onAdd={(v: any) => mAddDept.mutateAsync(v)} />}
                                {modalType === 'addAppraisal' && <AddAppraisalForm employees={db?.employees} onAdd={(v: any) => mAddAppraisal.mutate(v)} />}
                                {modalType === 'addPromo' && <AddPromoForm employees={db?.employees} onAdd={(v: any) => mAddPromo.mutate(v)} />}
                                {modalType === 'addGrievance' && <AddGrievanceForm onAdd={(v: any) => mAddGrievance.mutate(v)} />}
                                {modalType === 'addMemo' && <AddMemoForm onAdd={(v: any) => mAddMemo.mutate(v)} />}
                                {modalType === 'locker' && <LockerView employee={selectedItem} documents={db?.documents.filter(d => d.employee_id === selectedItem?.id)} />}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// MODAL FORMS
const AddDeptForm = ({ onAdd, loading }: any) => {
    const [data, setData] = useState({ name: '', budget_limit: '' });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!data.name.trim()) return setLocalError('Structure Name is required.');
        if (!data.budget_limit) return setLocalError('Fiscal Limit is required.');
        setLocalError(null);
        try {
            await onAdd({ ...data, budget_limit: parseFloat(data.budget_limit) });
        } catch (err: any) {
            setLocalError(err.message || 'Operation failed');
        }
    };

    return (
        <div className="space-y-4 text-black">
            <InputField label="Structure Name" value={data.name} onChange={(v: string) => setData({ ...data, name: v })} placeholder="e.g. Strategic Operations" />
            <InputField label="Fiscal Limit (₹)" type="number" value={data.budget_limit} onChange={(v: string) => setData({ ...data, budget_limit: v })} />
            {localError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 p-3 rounded-xl">{localError}</p>}
            <PrimaryButton label="Register Structure" onClick={handleSubmit} loading={loading} />
        </div>
    );
};

const AddAppraisalForm = ({ employees, onAdd }: any) => {
    const [data, setData] = useState({ employee_id: '', score: '5', feedback: '' });
    return (
        <div className="space-y-4 text-black">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Node (Employee)</label>
                <select value={data.employee_id} onChange={e => setData({ ...data, employee_id: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm text-slate-900">
                    <option value="">Target Employee</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
            </div>
            <InputField label="Performance Score (1-10)" type="number" value={data.score} onChange={(v: string) => setData({ ...data, score: v })} />
            <InputField label="Command Feedback" value={data.feedback} onChange={(v: string) => setData({ ...data, feedback: v })} placeholder="Operational qualitative assessment..." />
            <PrimaryButton label="Lock Appraisal" onClick={() => onAdd({ ...data, score: parseInt(data.score) })} />
        </div>
    );
};

const AddPromoForm = ({ employees, onAdd }: any) => {
    const [data, setData] = useState({ employee_id: '', old_role: '', new_role: '', old_salary: '', new_salary: '' });
    return (
        <div className="space-y-4 text-black">
            <select value={data.employee_id} onChange={e => setData({ ...data, employee_id: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm text-slate-900">
                <option value="">Select Employee Node</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Current Role" value={data.old_role} onChange={(v: string) => setData({ ...data, old_role: v })} />
                <InputField label="New Command Role" value={data.new_role} onChange={(v: string) => setData({ ...data, new_role: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Old Salary" type="number" value={data.old_salary} onChange={(v: string) => setData({ ...data, old_salary: v })} />
                <InputField label="New Salary" type="number" value={data.new_salary} onChange={(v: string) => setData({ ...data, new_salary: v })} />
            </div>
            <PrimaryButton label="Authorize Promotion" onClick={() => onAdd({ ...data, old_salary: parseFloat(data.old_salary), new_salary: parseFloat(data.new_salary) })} />
        </div>
    );
};

const AddGrievanceForm = ({ onAdd }: any) => {
    const [data, setData] = useState({ subject: '', category: 'General', description: '' });
    return (
        <div className="space-y-4 text-black">
            <InputField label="Subject" value={data.subject} onChange={(v: string) => setData({ ...data, subject: v })} />
            <InputField label="Departmental Category" value={data.category} onChange={(v: string) => setData({ ...data, category: v })} />
            <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="Describe the operational conflict..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm h-32" />
            <PrimaryButton label="File Dispute" onClick={() => onAdd(data)} />
        </div>
    );
};

const AddMemoForm = ({ onAdd }: any) => {
    const [data, setData] = useState({ title: '', content: '', target_audience: 'All', is_urgent: false });
    return (
        <div className="space-y-4 text-black">
            <InputField label="Memo Title" value={data.title} onChange={(v: string) => setData({ ...data, title: v })} />
            <InputField label="Distribution Audience" value={data.target_audience} onChange={(v: string) => setData({ ...data, target_audience: v })} placeholder="e.g. All Staff, Engineering" />
            <textarea value={data.content} onChange={e => setData({ ...data, content: e.target.value })} placeholder="Memo body text..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm h-32" />
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={data.is_urgent} onChange={e => setData({ ...data, is_urgent: e.target.checked })} className="w-5 h-5 accent-red-600" />
                <label className="text-[10px] font-black uppercase text-red-600">Urgent Flash</label>
            </div>
            <PrimaryButton label="Broadcast Memo" onClick={() => onAdd(data)} />
        </div>
    );
};

const LockerView = ({ employee, documents }: any) => {
    return (
        <div className="space-y-8 text-black">
            <div className="p-8 bg-slate-900 rounded-[32px] text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Authenticated Locker</p>
                <h4 className="text-2xl font-black uppercase tracking-tighter">{employee?.full_name}</h4>
                <div className="flex gap-4 mt-4 text-[9px] font-black uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1"><ShieldAlert size={10} /> Total: {documents?.length} Nodes</span>
                    <span className="flex items-center gap-1"><Archive size={10} /> Secure storage</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {documents?.map((d: any) => (
                    <div key={d.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between group hover:border-red-500 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 group-hover:text-red-600"><FileText size={18} /></div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">{d.document_name}</span>
                        </div>
                        <button className="text-slate-300 hover:text-red-600"><Plus size={16} /></button>
                    </div>
                ))}
                <button className="p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-red-600 h-28 group">
                    <Folder size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Inject Asset</span>
                </button>
            </div>
        </div>
    );
};

// UI ATOMS
const InputField = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
        />
    </div>
);

const PrimaryButton = ({ label, onClick, loading }: any) => (
    <button
        disabled={loading}
        onClick={onClick}
        className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-xl shadow-slate-200"
    >
        {loading ? <Loader2 className="animate-spin" /> : label}
    </button>
);

export default WorkforceManagement;
