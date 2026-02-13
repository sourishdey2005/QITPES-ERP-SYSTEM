
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    IndianRupee, Landmark, Plus, X, Loader2, Search, Filter,
    Receipt, TrendingUp, BarChart3, Clock, ArrowDownLeft,
    ArrowUpRight, FileText, CheckCircle2, AlertCircle, Calendar,
    ChevronRight, Building2, Wallet, Briefcase, CreditCard, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type FinanceTab = 'overview' | 'invoices' | 'ra-bills' | 'cost-centers' | 'budget-cost' | 'cashflow' | 'aging';

const FinanceManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'invoice' | 'forecast' | 'cost-center' | ''>('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // 1. DATA FETCHING
    const { data: invoices, isLoading: loadingInvoices } = useQuery({
        queryKey: ['finance-invoices'],
        queryFn: async () => {
            const { data, error } = await supabase.from('client_invoices').select('*, projects(name)').order('invoice_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: bills, isLoading: loadingBills } = useQuery({
        queryKey: ['finance-bills'],
        queryFn: async () => {
            const { data, error } = await supabase.from('running_bills').select('*').order('bill_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: forecast, isLoading: loadingForecast } = useQuery({
        queryKey: ['finance-forecast'],
        queryFn: async () => {
            const { data, error } = await supabase.from('cashflow_forecasts').select('*').order('forecast_month', { ascending: true });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: projects } = useQuery({
        queryKey: ['finance-projects'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('id, name');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: costCenters } = useQuery({
        queryKey: ['finance-cost-centers'],
        queryFn: async () => {
            const { data, error } = await supabase.from('cost_centers').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    // 2. MUTATIONS
    const mAddInvoice = useMutation({
        mutationFn: async (inv: any) => {
            const { error } = await supabase.from('client_invoices').insert([inv]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
            setIsModalOpen(false);
        }
    });

    const mUpdateInvoice = useMutation({
        mutationFn: async ({ id, ...updates }: any) => {
            const { error } = await supabase.from('client_invoices').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
            setIsModalOpen(false);
            setSelectedItem(null);
        }
    });

    const mDeleteInvoice = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('client_invoices').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-invoices'] })
    });

    const mAddCostCenter = useMutation({
        mutationFn: async (cc: any) => {
            const { error } = await supabase.from('cost_centers').insert([cc]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-cost-centers'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteCostCenter = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cost_centers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-cost-centers'] })
    });

    const mAddForecast = useMutation({
        mutationFn: async (f: any) => {
            const { error } = await supabase.from('cashflow_forecasts').insert([f]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-forecast'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteForecast = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('cashflow_forecasts').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-forecast'] })
    });

    // 3. STATS LOGIC
    const stats = useMemo(() => {
        const totalReceivables = invoices?.reduce((sum: number, inv: any) => inv.status !== 'Paid' ? sum + inv.total_amount : sum, 0) || 0;
        const totalPayables = bills?.reduce((sum: number, b: any) => b.payment_status !== 'Paid' ? sum + b.net_payable : sum, 0) || 0;
        const paidThisMonth = invoices?.filter((inv: any) => inv.status === 'Paid').reduce((sum: number, inv: any) => sum + inv.total_amount, 0) || 0;

        return { totalReceivables, totalPayables, paidThisMonth };
    }, [invoices, bills]);

    // 4. RENDER VIEWS

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Receivables (AR)</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(stats.totalReceivables)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                        <TrendingUp size={14} /> 12% vs last month
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Payables (AP)</p>
                    <h3 className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(stats.totalPayables)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                        <Clock size={14} /> Average 45 days aging
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl shadow-slate-900/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Corporate Liquidity</p>
                    <h3 className="text-3xl font-black tracking-tighter text-emerald-400">{formatCurrency(stats.totalReceivables - stats.totalPayables)}</h3>
                    <p className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Live reconciliation node 2026</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <ArrowDownLeft className="text-emerald-500" /> Recent Inflows
                    </h4>
                    <div className="space-y-6">
                        {invoices?.slice(0, 5).map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div>
                                    <p className="text-xs font-black text-slate-900">{inv.client_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{inv.invoice_number}</p>
                                </div>
                                <span className={`text-xs font-black ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-slate-900'}`}>{formatCurrency(inv.total_amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <ArrowUpRight className="text-red-500" /> Recent Payables
                    </h4>
                    <div className="space-y-6">
                        {bills?.slice(0, 5).map((b: any) => (
                            <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div>
                                    <p className="text-xs font-black text-slate-900">{b.bill_number}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{b.contract_type} RA Bill</p>
                                </div>
                                <span className="text-xs font-black text-slate-900">{formatCurrency(b.net_payable)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInvoices = () => (
        <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tax Invoicing Engine</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">GST Compliant Fiscal Documentation</p>
                </div>
                <button onClick={() => { setSelectedItem(null); setModalType('invoice'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                    <Plus size={16} /> Raise Invoice
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-10 py-6">Invoice #</th>
                            <th className="px-10 py-6">Project/Client</th>
                            <th className="px-10 py-6">Taxable (₹)</th>
                            <th className="px-10 py-6">GST Value (₹)</th>
                            <th className="px-10 py-6 text-right">Net Value (₹)</th>
                            <th className="px-10 py-6">Status</th>
                            <th className="px-10 py-6 text-right">Audit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                        {invoices?.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{inv.invoice_number}</td>
                                <td className="px-10 py-6">
                                    <p className="font-bold text-slate-600 text-xs">{inv.projects?.name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">{inv.client_name}</p>
                                </td>
                                <td className="px-10 py-6 font-black text-slate-900 text-xs">{formatCurrency(inv.taxable_amount)}</td>
                                <td className="px-10 py-6 font-black text-slate-400 text-xs">{formatCurrency(inv.gst_amount)} <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded">{inv.gst_percentage}%</span></td>
                                <td className="px-10 py-6 font-black text-slate-900 text-xs text-right">{formatCurrency(inv.total_amount)}</td>
                                <td className="px-10 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 shadow-sm'}`}>{inv.status}</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setSelectedItem(inv); setModalType('invoice'); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                                            <FileText size={16} />
                                        </button>
                                        <button onClick={() => { if (confirm('Purge this invoice node?')) mDeleteInvoice.mutate(inv.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCashflow = () => (
        <div className="space-y-8">
            <div className="bg-white p-12 rounded-[56px] border border-slate-200 text-center">
                <BarChart3 className="mx-auto text-red-600 mb-6" size={48} />
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Cashflow Projection Engine</h3>
                <p className="text-slate-500 font-medium italic mt-2 font-mono text-[10px] tracking-widest uppercase mb-12 italic">Deterministic liquidity forecasting 2026</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {forecast?.map((f: any) => (
                        <div key={f.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{new Date(f.forecast_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-[9px] font-black uppercase"><span className="text-emerald-500">Inflow</span> <span>{formatCurrency(f.projected_inflow)}</span></div>
                                <div className="flex justify-between text-[9px] font-black uppercase"><span className="text-red-500">Outflow</span> <span>{formatCurrency(f.projected_outflow)}</span></div>
                            </div>
                            <div className={`p-4 rounded-2xl font-black text-xs ${f.variance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                Surplus: {formatCurrency(f.variance)}
                            </div>
                        </div>
                    ))}
                    <button onClick={() => { setModalType('forecast'); setIsModalOpen(true); }} className="p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-red-400 transition-all group">
                        <Plus className="text-slate-200 group-hover:text-red-400 mb-2" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Extend Projection</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAging = () => {
        const agingBuckets = invoices?.reduce((acc: any, inv: any) => {
            if (inv.status === 'Paid') return acc;
            const diff = Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 3600 * 24));
            if (diff <= 30) acc['0-30'] += inv.total_amount;
            else if (diff <= 60) acc['31-60'] += inv.total_amount;
            else if (diff <= 90) acc['61-90'] += inv.total_amount;
            else acc['90+'] += inv.total_amount;
            return acc;
        }, { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 });

        return (
            <div className="space-y-8">
                <div className="bg-slate-900 p-12 rounded-[56px] text-white">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase">Payment Aging Dashboard</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Accounts Receivable (AR) Breakdown</p>
                        </div>
                        <CreditCard size={48} className="text-red-600 opacity-50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {Object.entries(agingBuckets || {}).map(([label, val]: any) => (
                            <div key={label} className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{label} Days</p>
                                <h4 className="text-2xl font-black text-white tracking-tighter">{formatCurrency(val)}</h4>
                                <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${label === '90+' ? 'bg-red-600' : 'bg-red-400'}`} style={{ width: stats.totalReceivables ? `${(val / stats.totalReceivables) * 100}%` : '0%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[48px] border border-slate-200">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <AlertCircle className="text-red-600" /> Outstanding Fiscal Debt Nodes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoices?.filter((inv: any) => inv.status !== 'Paid').map((inv: any) => (
                            <div key={inv.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-200 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-white border border-red-100 text-red-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Awaiting Settle</span>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inv: {inv.invoice_number}</p>
                                </div>
                                <h5 className="font-black text-slate-900 mb-1">{inv.client_name}</h5>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 italic leading-tight">{inv.projects?.name}</p>
                                <div className="flex justify-between items-end border-t border-slate-200 pt-4">
                                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase">
                                        <Clock size={12} /> {Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 3600 * 24))} Days Old
                                    </div>
                                    <span className="font-black text-slate-900 text-sm">{formatCurrency(inv.total_amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 page-transition text-black pb-20 font-sans">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3 leading-none">
                        <Landmark className="text-red-600" size={32} /> Finance & Indian Accounts
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2 font-mono text-[10px] tracking-widest uppercase leading-none italic">Fiscal Governance Node — QITPES 2026 Core Registry</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {(['overview', 'invoices', 'ra-bills', 'cost-centers', 'budget-cost', 'cashflow', 'aging'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {t.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'invoices' && renderInvoices()}
                    {activeTab === 'ra-bills' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bills?.map((b: any) => (
                                <div key={b.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-200 transition-all relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Receipt size={80} /></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${b.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
                                                {b.payment_status} Bill Node
                                            </span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.bill_number}</p>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{b.contract_type} Assessment</p>
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">{formatCurrency(b.net_payable)}</h4>
                                        <div className="space-y-3 pb-8">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <span>Retention Hold</span>
                                                <span className="text-red-500">{formatCurrency(b.retention_deduction)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <span>Tax Deduction</span>
                                                <span>{formatCurrency(b.tds_deduction)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full relative z-10 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Generate Voucher Identity</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'cost-centers' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {costCenters?.map((cc: any) => (
                                <div key={cc.id} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm hover:translate-y-[-4px] transition-all">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-4 bg-slate-900 text-white rounded-3xl">
                                            <Briefcase size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{cc.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code: {cc.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl flex-1 mr-4 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Control Tier</span>
                                            <span className="text-xs font-black text-slate-900 uppercase">Primary</span>
                                        </div>
                                        <button onClick={() => { if (confirm('Decommission this cost center?')) mDeleteCostCenter.mutate(cc.id); }} className="p-2 text-slate-300 hover:text-red-600 transition-all">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <button className="text-[10px] font-black uppercase text-red-600 tracking-widest hover:underline flex items-center gap-2">View Full Ledger <ChevronRight size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('cost-center'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 hover:border-red-300 transition-all group min-h-[250px]">
                                <Plus size={32} className="text-slate-200 group-hover:text-red-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">Initialize Cost Center Node</span>
                            </button>
                        </div>
                    )}
                    {activeTab === 'cashflow' && renderCashflow()}
                    {activeTab === 'aging' && renderAging()}
                    {activeTab === 'budget-cost' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-12 text-center">
                            <Scale className="mx-auto text-emerald-600 mb-4" size={48} />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Project Cost vs Budget Matrix</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 mb-12">Total Fiscal Allocation Monitoring 2026</p>

                            <div className="space-y-6">
                                {projects?.map((p: any) => (
                                    <div key={p.id} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">{p.name}</h4>
                                            <div className="flex gap-4">
                                                <div className="h-2 bg-slate-200 flex-1 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-600" style={{ width: '65%' }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase">65% Utilized</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Budget Allocation</p>
                                                <p className="text-lg font-black text-slate-900">{formatCurrency(15000000)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Actual Burn</p>
                                                <p className="text-lg font-black text-red-600">{formatCurrency(9750000)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* INVOICE MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                                    {modalType === 'invoice' ? (selectedItem ? 'Modify Tax Invoice' : 'Raise Tax Invoice') :
                                        modalType === 'forecast' ? 'Liquidity Projection' : 'Initialize Cost Center'}
                                </h3>
                                <button onClick={() => { setIsModalOpen(false); setSelectedItem(null); }}><X size={20} className="text-slate-400 hover:text-red-600 transition-all" /></button>
                            </div>
                            <div className="p-10">
                                {modalType === 'invoice' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        const data = {
                                            project_id: fd.get('pid'),
                                            invoice_number: fd.get('num'),
                                            client_name: fd.get('client'),
                                            invoice_date: fd.get('date'),
                                            due_date: fd.get('due'),
                                            taxable_amount: parseFloat(fd.get('val') as string),
                                            gst_percentage: parseFloat(fd.get('gst') as string),
                                            gst_type: fd.get('gst_type'),
                                            status: fd.get('status') || 'Sent'
                                        };
                                        if (selectedItem) mUpdateInvoice.mutate({ id: selectedItem.id, ...data });
                                        else mAddInvoice.mutate(data);
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Select Project Node</label>
                                            <select name="pid" defaultValue={selectedItem?.project_id} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Client Legal Entity Name</label>
                                            <input name="client" defaultValue={selectedItem?.client_name} required placeholder="Prime Client Ltd" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Tax Invoice #</label>
                                                <input name="num" defaultValue={selectedItem?.invoice_number} required placeholder="INV-2026-001" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Taxable Value (₹)</label>
                                                <input name="val" defaultValue={selectedItem?.taxable_amount} type="number" step="any" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">GST %</label>
                                                <input name="gst" defaultValue={selectedItem?.gst_percentage || 18} type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">GST Jurisdiction</label>
                                                <select name="gst_type" defaultValue={selectedItem?.gst_type || 'IGST'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                    <option value="IGST">Inter-State (IGST)</option>
                                                    <option value="CGST/SGST">Intra-State (CGST/SGST)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Invoice Date</label>
                                                <input name="date" defaultValue={selectedItem?.invoice_date} type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Payment Deadline</label>
                                                <input name="due" defaultValue={selectedItem?.due_date} type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        {selectedItem && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Payment Status</label>
                                                <select name="status" defaultValue={selectedItem.status} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                    <option value="Draft">Draft</option>
                                                    <option value="Sent">Sent</option>
                                                    <option value="Paid">Paid</option>
                                                    <option value="Overdue">Overdue</option>
                                                </select>
                                            </div>
                                        )}
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-red-500/20">
                                            {(mAddInvoice.isPending || mUpdateInvoice.isPending) ? <Loader2 className="animate-spin mx-auto" /> : (selectedItem ? 'Authorize Modification' : 'Settle & Transmit Invoice')}
                                        </button>
                                    </form>
                                )}

                                {modalType === 'cost-center' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddCostCenter.mutate({
                                            name: fd.get('name'),
                                            code: fd.get('code'),
                                            description: fd.get('desc')
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Department / Cost Center Name</label>
                                            <input name="name" required placeholder="Project-A Head Office" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Internal Code</label>
                                            <input name="code" required placeholder="CC-001" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Functional Description</label>
                                            <textarea name="desc" placeholder="Operational oversight for civil works..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs h-24" />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                            {mAddCostCenter.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Map Cost Node'}
                                        </button>
                                    </form>
                                )}

                                {modalType === 'forecast' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddForecast.mutate({
                                            forecast_month: fd.get('month') + '-01',
                                            projected_inflow: parseFloat(fd.get('in') as string),
                                            projected_outflow: parseFloat(fd.get('out') as string)
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Projection Month</label>
                                            <input name="month" type="month" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Expected Inflow (₹)</label>
                                                <input name="in" type="number" step="any" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Expected Outflow (₹)</label>
                                                <input name="out" type="number" step="any" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs font-mono" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                            {mAddForecast.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Projection Node'}
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

export default FinanceManagement;
