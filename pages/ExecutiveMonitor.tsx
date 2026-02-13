
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    BarChart3, PieChart, TrendingUp, AlertCircle,
    Target, Rocket, ShieldAlert, BadgeInfo,
    ArrowUpRight, ArrowDownLeft, Calendar, User,
    Globe, Briefcase, Activity, Zap, Plus,
    Trash2, Edit, X, Loader2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, LineChart, Line,
    Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

type Tab = 'oversight' | 'management';

const ExecutiveMonitor: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('oversight');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'target' | 'tender' | 'risk' | ''>('');

    // 1. Data Fetching
    const { data: projects } = useQuery({
        queryKey: ['exec-projects'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: targetList } = useQuery({
        queryKey: ['exec-targets'],
        queryFn: async () => {
            const { data, error } = await supabase.from('company_targets').select('*').order('period_start', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const activeTarget = targetList?.[0] || null;

    const { data: transactions } = useQuery({
        queryKey: ['exec-transactions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('finance_transactions').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: tenders } = useQuery({
        queryKey: ['exec-tenders'],
        queryFn: async () => {
            const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: risks } = useQuery({
        queryKey: ['exec-risks'],
        queryFn: async () => {
            const { data, error } = await supabase.from('project_risks').select('*, projects(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // 2. CRUD Mutations
    const mAddTender = useMutation({
        mutationFn: async (tender: any) => {
            const { error } = await supabase.from('tenders').insert([tender]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exec-tenders'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteTender = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('tenders').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exec-tenders'] })
    });

    const mAddTarget = useMutation({
        mutationFn: async (target: any) => {
            const { error } = await supabase.from('company_targets').insert([target]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exec-targets'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteTarget = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('company_targets').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exec-targets'] })
    });

    const mAddRisk = useMutation({
        mutationFn: async (risk: any) => {
            const { error } = await supabase.from('project_risks').insert([risk]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exec-risks'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteRisk = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('project_risks').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exec-risks'] })
    });

    // 3. Analytics Logic
    const stats = useMemo(() => {
        const totalRevenue = transactions?.filter(t => t.type === 'income')?.reduce((s, t) => s + t.amount, 0) || 0;
        const totalExpense = transactions?.filter(t => t.type === 'expense')?.reduce((s, t) => s + t.amount, 0) || 0;

        // Revenue vs Target (Scale from 0-100)
        const revTargetValue = activeTarget?.revenue_target || 50000000; // Fallback for visually pleasing UI if empty
        const revenueVsTarget = (totalRevenue / revTargetValue) * 100;

        const projectProfitability = projects?.map(p => ({
            name: p.name,
            profit: p.contract_value - (p.estimated_cost || 0),
            margin: p.contract_value > 0 ? ((p.contract_value - (p.estimated_cost || 0)) / p.contract_value) * 100 : 0
        })) || [];

        const cashflowData = [
            { month: 'In Progress', inflow: totalRevenue, outflow: totalExpense },
        ];

        const pipelineValue = tenders?.reduce((s, t) => s + (t.estimated_value * (t.probability_percentage / 100)), 0) || 0;

        const heatmapData = risks?.map(r => ({
            x: r.probability_level,
            y: r.impact_level,
            z: 1,
            name: r.risk_title,
            project: r.projects?.name
        })) || [];

        return {
            totalRevenue,
            netProfit: totalRevenue - totalExpense,
            revenueVsTarget,
            revTargetValue,
            pipelineValue,
            projectProfitability,
            cashflowData,
            heatmapData,
            delays: projects?.filter(p => {
                const end = new Date(p.end_date);
                return p.completion_percentage < 100 && end < new Date() && p.end_date;
            }).length || 0,
            pendingClientPayments: projects?.reduce((s, p) => s + (p.contract_value - (p.paid_amount || 0)), 0) || 0
        };
    }, [projects, activeTarget, transactions, tenders, risks]);

    return (
        <div className="space-y-8 page-transition text-black pb-20 px-4 md:px-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Zap className="text-red-600 animate-pulse" size={32} /> Executive Monitoring
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1 font-mono text-[10px] tracking-widest uppercase italic">Strategic Oversight Room — Tier-1 Decision Node</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm self-start lg:self-center">
                    <button
                        onClick={() => setActiveTab('oversight')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'oversight' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        Oversight Hub
                    </button>
                    <button
                        onClick={() => setActiveTab('management')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'management' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        Data Management
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'oversight' ? (
                    <motion.div key="oversight" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-8">
                        {/* METRIC KARS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-500" /> Revenue vs Target
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900">{Math.round(stats.revenueVsTarget)}%</h3>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <div className="bg-red-600 h-full transition-all duration-1000" style={{ width: `${Math.min(stats.revenueVsTarget, 100)}%` }} />
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={80} /></div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <AlertCircle size={14} className="text-red-500" /> Major Site Delays
                                    </p>
                                    <h3 className="text-3xl font-black text-red-600">{stats.delays} <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nodes</span></h3>
                                    <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Needs Strategic Oversight</p>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldAlert size={80} /></div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Rocket size={14} className="text-blue-500" /> Tender Pipeline
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900">{formatCurrency(stats.pipelineValue)}</h3>
                                    <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Risk-Adjusted Worth</p>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={80} /></div>
                            </div>

                            <div className="bg-red-600 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-red-100 uppercase tracking-widest mb-2">Pending Client AR</p>
                                    <h3 className="text-3xl font-black text-white">{formatCurrency(stats.pendingClientPayments)}</h3>
                                    <p className="text-[9px] text-red-200 font-bold mt-2 uppercase tracking-tighter">Locked Operational Capital</p>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8">Operational Cashflow</h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.cashflowData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" hide />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                            />
                                            <Bar dataKey="inflow" name="Total Inflow" fill="#10b981" radius={[10, 10, 0, 0]} barSize={50} />
                                            <Bar dataKey="outflow" name="Total Outflow" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8">Executive Risk Heatmap</h4>
                                <div className="h-[300px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis type="number" dataKey="x" name="Probability" domain={[1, 5]} hide />
                                            <YAxis type="number" dataKey="y" name="Impact" domain={[1, 5]} hide />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                            <Scatter name="Risks" data={stats.heatmapData} fill="#ef4444">
                                                {stats.heatmapData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.y >= 4 ? '#ef4444' : entry.y >= 3 ? '#f59e0b' : '#10b981'}
                                                    />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="management" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* COMPANY TARGETS */}
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={18} className="text-red-600" /> Revenue Targets
                                </h3>
                                <button onClick={() => { setModalType('target'); setIsModalOpen(true); }} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm shadow-red-500/20">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                                {targetList?.map((t: any) => (
                                    <div key={t.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.period_start).getFullYear()} Node</p>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{formatCurrency(t.revenue_target)}</p>
                                        </div>
                                        <button
                                            onClick={() => mDeleteTarget.mutate(t.id)}
                                            className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TENDER PIPELINE */}
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Rocket size={18} className="text-blue-600" /> Open Tenders
                                </h3>
                                <button onClick={() => { setModalType('tender'); setIsModalOpen(true); }} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                                {tenders?.map((t: any) => (
                                    <div key={t.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tender_no}</p>
                                            <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{t.authority_name}</p>
                                            <p className="text-[9px] font-bold text-red-600 mt-1 uppercase">{t.probability_percentage}% WIN RATIO</p>
                                        </div>
                                        <button
                                            onClick={() => mDeleteTender.mutate(t.id)}
                                            className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RISK REGISTRY */}
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-amber-600" /> Risk Registry
                                </h3>
                                <button onClick={() => { setModalType('risk'); setIsModalOpen(true); }} className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-sm shadow-amber-500/20">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                                {risks?.map((r: any) => (
                                    <div key={r.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IMPACT: {r.impact_level}/5</p>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{r.risk_title}</p>
                                        </div>
                                        <button
                                            onClick={() => mDeleteRisk.mutate(r.id)}
                                            className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                                    {modalType === 'tender' ? 'Register New Tender' : modalType === 'target' ? 'New Corporate Target' : 'Register Risk Factor'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>

                            <div className="p-10">
                                {modalType === 'target' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddTarget.mutate({
                                            period_start: fd.get('period_start'),
                                            period_end: fd.get('period_end'),
                                            revenue_target: parseFloat(fd.get('rev') as string),
                                            profit_target: parseFloat(fd.get('profit') as string)
                                        });
                                    }} className="space-y-4 text-black">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Start Date</label>
                                                <input name="period_start" type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">End Date</label>
                                                <input name="period_end" type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Revenue Target (₹)</label>
                                            <input name="rev" type="number" required placeholder="50000000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                            {mAddTarget.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Target Period'}
                                        </button>
                                    </form>
                                )}

                                {modalType === 'tender' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddTender.mutate({
                                            tender_no: fd.get('no'),
                                            authority_name: fd.get('authority'),
                                            estimated_value: parseFloat(fd.get('val') as string),
                                            probability_percentage: parseInt(fd.get('prob') as string),
                                            technical_status: 'Preparation',
                                            financial_status: 'Pending'
                                        });
                                    }} className="space-y-4 text-black">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Tender Ref No</label>
                                                <input name="no" required placeholder="TND-2026-001" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Authority</label>
                                                <input name="authority" required placeholder="PWD / NHAI" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Value (₹)</label>
                                                <input name="val" type="number" required placeholder="10000000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Win Chance %</label>
                                                <input name="prob" type="number" max="100" required placeholder="50" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                            {mAddTender.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Register Tender Node'}
                                        </button>
                                    </form>
                                )}

                                {modalType === 'risk' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddRisk.mutate({
                                            project_id: fd.get('pid'),
                                            risk_title: fd.get('title'),
                                            impact_level: parseInt(fd.get('impact') as string),
                                            probability_level: parseInt(fd.get('prob') as string),
                                            status: 'Open'
                                        });
                                    }} className="space-y-4 text-black">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Link Project</label>
                                            <select name="pid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Risk Title</label>
                                            <input name="title" required placeholder="Labor Shortage / Material Surge" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Impact (1-5)</label>
                                                <input name="impact" type="number" min="1" max="5" defaultValue="3" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Probability (1-5)</label>
                                                <input name="prob" type="number" min="1" max="5" defaultValue="3" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-amber-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                                            {mAddRisk.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Log Critical Risk'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExecutiveMonitor;
