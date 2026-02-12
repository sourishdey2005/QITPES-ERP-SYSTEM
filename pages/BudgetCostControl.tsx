
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, Wallet, ShieldCheck, Activity,
    Plus, X, Loader2, AlertTriangle, CheckCircle2,
    ArrowUpRight, Zap, ShieldAlert, Clock, Trash2, Edit2
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

type Tab = 'overview' | 'budgets' | 'approvals' | 'costcenters' | 'pettycash' | 'fixed' | 'capex' | 'projects' | 'history';

const BudgetCostControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Integrated Form State
    const [formData, setFormData] = useState<any>({});

    // CRUD Mutations
    const createMutation = (table: string, queryKey: string) => useMutation({
        mutationFn: async (newData: any) => {
            const { data, error } = await supabase.from(table).insert([newData]).select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setIsModalOpen(false);
            setFormData({});
        }
    });

    const updateMutation = (table: string, queryKey: string) => useMutation({
        mutationFn: async ({ id, ...updateData }: any) => {
            const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({});
        }
    });

    const deleteMutation = (table: string, queryKey: string) => useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] })
    });

    // Table Mutations
    const budgetMutations = {
        add: createMutation('budget_allocations', 'budget-cost-data'),
        update: updateMutation('budget_allocations', 'budget-cost-data'),
        delete: deleteMutation('budget_allocations', 'budget-cost-data')
    };

    const centerMutations = {
        add: createMutation('cost_centers', 'budget-cost-data'),
        delete: deleteMutation('cost_centers', 'budget-cost-data')
    };

    const approvalMutations = {
        add: createMutation('expense_approvals', 'budget-cost-data'),
        updateStatus: useMutation({
            mutationFn: async ({ id, status }: any) => {
                const { error } = await supabase.from('expense_approvals').update({ status }).eq('id', id);
                if (error) throw error;
            },
            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budget-cost-data'] })
        })
    };

    const pettyMutations = {
        add: createMutation('petty_cash', 'budget-cost-data'),
        delete: deleteMutation('petty_cash', 'budget-cost-data')
    };

    const fixedMutations = {
        add: createMutation('fixed_expenses', 'budget-cost-data'),
        delete: deleteMutation('fixed_expenses', 'budget-cost-data')
    };

    const capexMutations = {
        add: createMutation('capital_expenditure', 'budget-cost-data'),
        delete: deleteMutation('capital_expenditure', 'budget-cost-data')
    };

    // Data Fetching
    const { data: db, isLoading } = useQuery({
        queryKey: ['budget-cost-data'],
        queryFn: async () => {
            const [budgets, centers, approvals, petty, fixed, revisions, capex, projectCosts, projects] = await Promise.all([
                supabase.from('budget_allocations').select('*'),
                supabase.from('cost_centers').select('*'),
                supabase.from('expense_approvals').select('*').order('created_at', { ascending: false }),
                supabase.from('petty_cash').select('*').order('created_at', { ascending: false }),
                supabase.from('fixed_expenses').select('*'),
                supabase.from('budget_revision_logs').select('*'),
                supabase.from('capital_expenditure').select('*').order('created_at', { ascending: false }),
                supabase.from('project_cost_breakdown').select('*'),
                supabase.from('projects').select('id, name')
            ]);
            return {
                budgets: budgets.data || [],
                centers: centers.data || [],
                approvals: approvals.data || [],
                petty: petty.data || [],
                fixed: fixed.data || [],
                revisions: revisions.data || [],
                capex: capex.data || [],
                projectCosts: projectCosts.data || [],
                projects: projects.data || []
            };
        }
    });

    const analytics = useMemo(() => {
        if (!db) return null;
        const totalAllocated = db.budgets.reduce((s, b) => s + Number(b.allocated_amount), 0);
        const totalSpent = db.budgets.reduce((s, b) => s + Number(b.spent_amount), 0);
        const budgetVsActual = db.budgets.map(b => ({
            name: b.department,
            allocated: Number(b.allocated_amount),
            actual: Number(b.spent_amount),
            variance: Number(b.allocated_amount) - Number(b.spent_amount)
        }));
        return { totalAllocated, totalSpent, budgetVsActual };
    }, [db]);

    const openModal = (type: string, data = {}) => {
        setModalType(type);
        setFormData(data);
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-8 page-transition p-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Budget & Cost</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Enterprise financial node with CRUD operational capacity.</p>
                </div>
                <div className="flex flex-wrap bg-slate-100/50 p-1 rounded-[24px] border border-slate-200">
                    {(['overview', 'budgets', 'approvals', 'costcenters', 'pettycash', 'fixed', 'capex', 'projects'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab === 'pettycash' ? 'Petty Cash' : tab === 'costcenters' ? 'Centers' : tab === 'projects' ? 'Projects' : tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    {activeTab === 'overview' && analytics && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Total Budgeted" value={analytics.totalAllocated} icon={<Wallet />} color="blue" />
                                <StatCard label="Actual Spent" value={analytics.totalSpent} icon={<Activity />} color="emerald" />
                                <StatCard label="Pending Approvals" value={db?.approvals.filter(a => a.status === 'Pending').reduce((s, a) => s + Number(a.amount), 0) || 0} icon={<Clock />} color="amber" />
                                <StatCard label="Variance" value={analytics.totalAllocated - analytics.totalSpent} icon={<TrendingUp />} color="blue" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <VisualBox title="Budget Distribution">
                                    <div className="h-[300px]">
                                        <ResponsiveContainer>
                                            <BarChart data={analytics.budgetVsActual}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                <YAxis hide />
                                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="allocated" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </VisualBox>
                                <VisualBox title="Expenditure Composition">
                                    <div className="h-[300px]">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={analytics.budgetVsActual} innerRadius={60} outerRadius={100} dataKey="actual">
                                                    {analytics.budgetVsActual.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </VisualBox>
                            </div>
                        </>
                    )}

                    {activeTab === 'budgets' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">Allocations</h3>
                                <button onClick={() => openModal('addBudget')} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"><Plus size={14} /> Add New Budget</button>
                            </div>
                            <div className="p-8 space-y-6">
                                {db?.budgets.map(b => <BudgetProgressItem key={b.id} item={b} onEdit={() => openModal('editBudget', b)} onDelete={() => budgetMutations.delete.mutate(b.id)} />)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'approvals' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200">
                                <h3 className="font-black text-slate-900 uppercase text-lg">Expense Vouchers</h3>
                                <button onClick={() => openModal('addApproval')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black">Request Voucher</button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {db?.approvals.map(app => (
                                    <div key={app.id} className="bg-white border border-slate-200 p-8 rounded-[40px] flex items-center justify-between group">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.department} • Ref: {app.id.slice(0, 6)}</p>
                                            <h4 className="font-black text-slate-900 uppercase text-lg mb-1">{app.description}</h4>
                                            <p className="text-xl font-black text-blue-600">{formatCurrency(app.amount)}</p>
                                            <div className={`mt-3 inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase ${app.status === 'Pending' ? 'bg-amber-100 text-amber-600' : app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {app.status}
                                            </div>
                                        </div>
                                        {app.status === 'Pending' && (
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => approvalMutations.updateStatus.mutate({ id: app.id, status: 'Approved' })} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest">Approve</button>
                                                <button onClick={() => approvalMutations.updateStatus.mutate({ id: app.id, status: 'Rejected' })} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-black text-[9px] uppercase tracking-widest">Reject</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'costcenters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-black">
                            {db?.centers.map(center => (
                                <div key={center.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-200/20 group hover:border-blue-500 transition-all flex flex-col justify-between h-72">
                                    <div>
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Zap size={20} fill="currentColor" /></div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{center.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">CODE: {center.code}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-6">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Active Audit node</span>
                                        <button onClick={() => centerMutations.delete.mutate(center.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => openModal('addCenter')} className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-[48px] flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all h-72 group">
                                <Plus className="mb-2 group-hover:scale-125 transition-transform" />
                                <span className="font-black uppercase text-[10px] tracking-widest">New Cost Center</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'pettycash' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Liquidity: Petty Cash</h3>
                                <button onClick={() => openModal('addPetty')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest tracking-tighter">Log Entry</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-10 py-5">Date</th>
                                        <th className="px-10 py-5">Description</th>
                                        <th className="px-10 py-5">Amount</th>
                                        <th className="px-10 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db?.petty.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-10 py-5 text-slate-500 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="px-10 py-5 font-black text-slate-900 uppercase text-xs">{p.description}</td>
                                            <td className="px-10 py-5 font-black text-red-600">{formatCurrency(p.amount)}</td>
                                            <td className="px-10 py-5 text-right">
                                                <button onClick={() => pettyMutations.delete.mutate(p.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'fixed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {db?.fixed.map(f => (
                                <div key={f.id} className="bg-white p-8 rounded-[40px] border border-slate-200 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{f.frequency}</span>
                                        <button onClick={() => fixedMutations.delete.mutate(f.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{f.name}</h4>
                                    <p className="text-2xl font-black text-blue-600">{formatCurrency(f.amount)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-4">Recurring on Day: {f.due_day || 'N/A'}</p>
                                </div>
                            ))}
                            <button onClick={() => openModal('addFixed')} className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[40px] flex items-center justify-center text-slate-400 h-48 hover:text-blue-600">
                                <Plus /> <span className="font-black uppercase text-[10px] ml-2">Add Fixed Obligation</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'capex' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Capital Expenditure (CapEx)</h3>
                                <button onClick={() => openModal('addCapex')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Register Asset Node</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-10 py-5">Asset</th>
                                        <th className="px-10 py-5">Category</th>
                                        <th className="px-10 py-5">Value</th>
                                        <th className="px-10 py-5">Audit Status</th>
                                        <th className="px-10 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db?.capex.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/50">
                                            <td className="px-10 py-5">
                                                <span className="font-black text-slate-900 uppercase text-xs block">{c.asset_name}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{new Date(c.purchase_date).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-10 py-5 text-slate-500 font-bold text-xs uppercase">{c.category}</td>
                                            <td className="px-10 py-5 font-black text-slate-900">{formatCurrency(c.amount)}</td>
                                            <td className="px-10 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${c.status === 'Purchased' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <button onClick={() => capexMutations.delete.mutate(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Project Cost Breakdown</h3>
                                <button onClick={() => openModal('addProjectCost')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Map Project Expense</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-10 py-5">Project</th>
                                        <th className="px-10 py-5">Expense Stack</th>
                                        <th className="px-10 py-5">Planned</th>
                                        <th className="px-10 py-5">Actual</th>
                                        <th className="px-10 py-5">Variance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db?.projectCosts.map(pc => {
                                        const project = db?.projects.find(p => p.id === pc.project_id);
                                        const variance = Number(pc.planned_amount) - Number(pc.actual_amount);
                                        return (
                                            <tr key={pc.id} className="hover:bg-slate-50/50">
                                                <td className="px-10 py-5 font-black text-slate-900 uppercase text-xs">{project?.name || 'Global'}</td>
                                                <td className="px-10 py-5 text-slate-500 font-bold text-xs uppercase">{pc.category}</td>
                                                <td className="px-10 py-5 font-black text-slate-500">{formatCurrency(pc.planned_amount)}</td>
                                                <td className="px-10 py-5 font-black text-slate-900">{formatCurrency(pc.actual_amount)}</td>
                                                <td className={`px-10 py-5 font-black ${variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(variance)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* CRUD MODAL SYSTEM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                    {modalType?.includes('add') ? 'Create New' : 'Refine'} Node
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-white rounded-full transition-all shadow-sm"><X size={24} /></button>
                            </div>

                            <div className="p-12 space-y-6">
                                {modalType === 'addBudget' || modalType === 'editBudget' ? (
                                    <div className="space-y-4">
                                        <InputField label="Department" value={formData.department} onChange={v => setFormData({ ...formData, department: v })} placeholder="e.g. Engineering" />
                                        <InputField label="Allocated Amount (₹)" type="number" value={formData.allocated_amount} onChange={v => setFormData({ ...formData, allocated_amount: v })} />
                                        <InputField label="Fiscal Year" type="number" value={formData.fiscal_year} onChange={v => setFormData({ ...formData, fiscal_year: v })} placeholder="2026" />
                                        <PrimaryButton
                                            label={modalType === 'editBudget' ? 'Update Allocation' : 'Initialize Budget'}
                                            onClick={() => modalType === 'editBudget' ? budgetMutations.update.mutate(formData) : budgetMutations.add.mutate({ ...formData, spent_amount: 0 })}
                                            loading={budgetMutations.add.isPending || budgetMutations.update.isPending}
                                        />
                                    </div>
                                ) : modalType === 'addApproval' ? (
                                    <div className="space-y-4">
                                        <InputField label="Description" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} placeholder="Operational necessity details..." />
                                        <InputField label="Amount (₹)" type="number" value={formData.amount} onChange={v => setFormData({ ...formData, amount: v })} />
                                        <InputField label="Department" value={formData.department} onChange={v => setFormData({ ...formData, department: v })} placeholder="Target Dept" />
                                        <PrimaryButton label="Submit for Audit" onClick={() => approvalMutations.add.mutate({ ...formData, status: 'Pending' })} loading={approvalMutations.add.isPending} />
                                    </div>
                                ) : modalType === 'addCenter' ? (
                                    <div className="space-y-4">
                                        <InputField label="Center Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="Branch/Site Hub" />
                                        <InputField label="Code" value={formData.code} onChange={v => setFormData({ ...formData, code: v })} placeholder="CC-2026-X" />
                                        <InputField label="Description" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} />
                                        <PrimaryButton label="Map Cost Center" onClick={() => centerMutations.add.mutate(formData)} loading={centerMutations.add.isPending} />
                                    </div>
                                ) : modalType === 'addPetty' ? (
                                    <div className="space-y-4">
                                        <InputField label="Description" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} />
                                        <InputField label="Amount (₹)" type="number" value={formData.amount} onChange={v => setFormData({ ...formData, amount: v })} />
                                        <InputField label="Date" type="date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                                        <PrimaryButton label="Record Liquidity Move" onClick={() => pettyMutations.add.mutate(formData)} loading={pettyMutations.add.isPending} />
                                    </div>
                                ) : modalType === 'addFixed' ? (
                                    <div className="space-y-4">
                                        <InputField label="Expense Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                                        <InputField label="Amount (₹)" type="number" value={formData.amount} onChange={v => setFormData({ ...formData, amount: v })} />
                                        <InputField label="Due Day of Month" type="number" value={formData.due_day} onChange={v => setFormData({ ...formData, due_day: v })} />
                                        <PrimaryButton label="Register Recurring node" onClick={() => fixedMutations.add.mutate(formData)} loading={fixedMutations.add.isPending} />
                                    </div>
                                ) : modalType === 'addCapex' ? (
                                    <div className="space-y-4">
                                        <InputField label="Asset Name" value={formData.asset_name} onChange={v => setFormData({ ...formData, asset_name: v })} />
                                        <InputField label="Category" value={formData.category} onChange={v => setFormData({ ...formData, category: v })} placeholder="e.g. Machinery, Infrastructure" />
                                        <InputField label="Value (₹)" type="number" value={formData.amount} onChange={v => setFormData({ ...formData, amount: v })} />
                                        <InputField label="Purchase Date" type="date" value={formData.purchase_date} onChange={v => setFormData({ ...formData, purchase_date: v })} />
                                        <PrimaryButton label="Initialize CapEx node" onClick={() => capexMutations.add.mutate({ ...formData, status: 'Planned' })} loading={capexMutations.add.isPending} />
                                    </div>
                                ) : modalType === 'addProjectCost' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Project</label>
                                            <select value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm">
                                                <option value="">Select Project</option>
                                                {db?.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <InputField label="Expense Category" value={formData.category} onChange={v => setFormData({ ...formData, category: v })} placeholder="e.g. Labour, Materials" />
                                        <InputField label="Planned Amount (₹)" type="number" value={formData.planned_amount} onChange={v => setFormData({ ...formData, planned_amount: v })} />
                                        <InputField label="Actual Amount (₹)" type="number" value={formData.actual_amount} onChange={v => setFormData({ ...formData, actual_amount: v })} />
                                        <PrimaryButton label="Map Project Cost" onClick={() => createMutation('project_cost_breakdown', 'budget-cost-data').mutate(formData)} />
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// UI COMPONENTS
const InputField = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all"
        />
    </div>
);

const PrimaryButton = ({ label, onClick, loading }: any) => (
    <button
        disabled={loading}
        onClick={onClick}
        className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4"
    >
        {loading ? <Loader2 className="animate-spin" /> : label}
    </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {React.cloneElement(icon as any, { size: 22 })}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(value)}</h3>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-50 transition-all"></div>
    </div>
);

const VisualBox = ({ title, children }: any) => (
    <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8">{title}</h3>
        {children}
    </div>
);

const BudgetProgressItem = ({ item, onEdit, onDelete }: any) => {
    const percent = (Number(item.spent_amount) / Number(item.allocated_amount)) * 100;
    return (
        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-slate-900 uppercase text-lg tracking-tight">{item.department}</h4>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
            </div>
            <div className="flex justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Initial Pool: {formatCurrency(item.allocated_amount)}</span>
                <span className="text-[9px] font-black text-slate-600 uppercase">Balance: {formatCurrency(item.allocated_amount - item.spent_amount)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full ${percent > 90 ? 'bg-red-500' : 'bg-blue-600'}`} />
            </div>
        </div>
    );
};

export default BudgetCostControl;
