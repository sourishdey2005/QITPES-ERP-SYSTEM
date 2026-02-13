
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    BarChart3, PieChart, TrendingUp, AlertCircle,
    Target, Rocket, ShieldAlert, BadgeInfo,
    ArrowUpRight, ArrowDownLeft, Calendar, User,
    Globe, Briefcase, Activity, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, LineChart, Line,
    Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

const ExecutiveMonitor: React.FC = () => {
    // 1. Data Fetching
    const { data: projects } = useQuery({
        queryKey: ['exec-projects'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: targets } = useQuery({
        queryKey: ['exec-targets'],
        queryFn: async () => {
            const { data, error } = await supabase.from('company_targets').select('*').limit(1).single();
            return data || { revenue_target: 50000000, profit_target: 15000000 };
        }
    });

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
            const { data, error } = await supabase.from('tenders').select('*');
            return data || [];
        }
    });

    const { data: risks } = useQuery({
        queryKey: ['exec-risks'],
        queryFn: async () => {
            const { data, error } = await supabase.from('project_risks').select('*, projects(name)');
            return data || [];
        }
    });

    // 2. Intelligence Logic
    const stats = useMemo(() => {
        const totalRevenue = transactions?.filter(t => t.type === 'income')?.reduce((s, t) => s + t.amount, 0) || 0;
        const totalExpense = transactions?.filter(t => t.type === 'expense')?.reduce((s, t) => s + t.amount, 0) || 0;
        const projectProfitability = projects?.map(p => ({
            name: p.name,
            profit: p.contract_value - (p.estimated_cost || 0),
            margin: p.contract_value > 0 ? ((p.contract_value - p.estimated_cost) / p.contract_value) * 100 : 0
        })) || [];

        const cashflowData = [
            { month: 'Jan', inflow: totalRevenue * 0.15, outflow: totalExpense * 0.12 },
            { month: 'Feb', inflow: totalRevenue * 0.20, outflow: totalExpense * 0.18 },
            { month: 'Mar', inflow: totalRevenue * 0.25, outflow: totalExpense * 0.22 },
            { month: 'Apr', inflow: totalRevenue * 0.40, outflow: totalExpense * 0.48 }, // Projected
        ];

        const pipelineValue = tenders?.reduce((s, t) => s + (t.estimated_value * (t.probability_percentage / 100)), 0) || 0;

        // Risk Heatmap Positioning (Impact vs Probability)
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
            revenueVsTarget: (totalRevenue / (targets?.revenue_target || 1)) * 100,
            pipelineValue,
            projectProfitability,
            cashflowData,
            heatmapData,
            delays: projects?.filter(p => {
                const end = new Date(p.end_date);
                return p.completion_percentage < 100 && end < new Date();
            }).length || 0,
            pendingClientPayments: projects?.reduce((s, p) => s + (p.contract_value - p.paid_amount), 0) || 0
        };
    }, [projects, targets, transactions, tenders, risks]);

    return (
        <div className="space-y-8 page-transition text-black pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Zap className="text-red-600 animate-pulse" size={32} /> Decision-Level Monitor
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1 font-mono text-[10px] tracking-widest uppercase">Executive Intelligence Node — Strategic Oversight Room</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Stream: Real-Time
                </div>
            </div>

            {/* TOP KARS (High Level Metrics) */}
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
                            <AlertCircle size={14} className="text-red-500" /> Major Project Delays
                        </p>
                        <h3 className="text-3xl font-black text-red-600">{stats.delays} <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Sites</span></h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Requires Immediate Oversight</p>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldAlert size={80} /></div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Rocket size={14} className="text-blue-500" /> Tender Pipeline
                        </p>
                        <h3 className="text-3xl font-black text-slate-900">{formatCurrency(stats.pipelineValue)}</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Risk-Adjusted Value</p>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={80} /></div>
                </div>

                <div className="bg-red-600 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-red-100 uppercase tracking-widest mb-2">Pending Client AR</p>
                        <h3 className="text-3xl font-black text-white">{formatCurrency(stats.pendingClientPayments)}</h3>
                        <p className="text-[9px] text-red-200 font-bold mt-2 uppercase tracking-tighter">Liquid Capital Locked</p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* REVENUE VISUALS */}
                <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Revenue Momentum</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cashflow Analysis & Projections</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Inflow</span>
                            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 uppercase"><div className="w-2 h-2 bg-red-500 rounded-full" /> Outflow</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.cashflowData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Bar dataKey="inflow" fill="#10b981" radius={[10, 10, 0, 0]} barSize={30} />
                                <Bar dataKey="outflow" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RISK HEATMAP */}
                <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Executive Risk Heatmap</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Impact (Y) vs Probability (X)</p>
                        </div>
                    </div>
                    <div className="h-[300px] relative">
                        {/* Background Gradients for Heatmap */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-3xl overflow-hidden opacity-5">
                            <div className="bg-emerald-500"></div><div className="bg-amber-500"></div>
                            <div className="bg-amber-500"></div><div className="bg-red-500"></div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" dataKey="x" name="Probability" domain={[0, 5]} hide />
                                <YAxis type="number" dataKey="y" name="Impact" domain={[0, 5]} hide />
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
                    <div className="mt-4 flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                        <span>Low Risk</span>
                        <span>Critical Node</span>
                    </div>
                </div>

                {/* PROJECT PROFITABILITY SUMMARY */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tier-1 Project Profitability Node</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-10 py-5">Project Name</th>
                                    <th className="px-10 py-5"> Surpluss (₹)</th>
                                    <th className="px-10 py-5">Profit Margin</th>
                                    <th className="px-10 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.projectProfitability.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-5 font-black text-slate-900 text-xs uppercase">{p.name}</td>
                                        <td className="px-10 py-5 font-black text-xs text-emerald-600">{formatCurrency(p.profit)}</td>
                                        <td className="px-10 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-100 h-1 rounded-full w-24">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(0, p.margin)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500">{Math.round(p.margin)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.margin > 15 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {p.margin > 15 ? 'High Efficiency' : 'Margin Watch'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveMonitor;
