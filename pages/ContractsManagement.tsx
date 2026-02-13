
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    ShieldCheck, FileText, Users, Receipt, TrendingUp, AlertTriangle,
    Plus, Trash2, Edit, X, Loader2, Download, Search, Filter,
    ChevronRight, Box, Calendar, CheckCircle2, MoreVertical,
    ClipboardList, DollarSign, Scale, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'client-contracts' | 'subcontracts' | 'bills' | 'deposits' | 'variations' | 'claims';

const ContractsManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SubTab>('client-contracts');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'client-con' | 'sub-wo' | 'bill' | 'deposit' | 'variation' | 'claim' | ''>('');

    // 1. Data Fetching
    const { data: projects } = useQuery({
        queryKey: ['projects-mini'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('id, name');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: clientContracts } = useQuery({
        queryKey: ['contracts-client'],
        queryFn: async () => {
            const { data, error } = await supabase.from('client_contracts').select('*, projects(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: subcontracts } = useQuery({
        queryKey: ['contracts-sub'],
        queryFn: async () => {
            const { data, error } = await supabase.from('subcontracts').select('*, projects(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: bills } = useQuery({
        queryKey: ['contracts-bills'],
        queryFn: async () => {
            const { data, error } = await supabase.from('running_bills').select('*').order('bill_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: deposits } = useQuery({
        queryKey: ['contracts-deposits'],
        queryFn: async () => {
            const { data, error } = await supabase.from('security_deposits').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: variations } = useQuery({
        queryKey: ['contracts-variations'],
        queryFn: async () => {
            const { data, error } = await supabase.from('variation_orders').select('*').order('vo_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: claims } = useQuery({
        queryKey: ['contracts-claims'],
        queryFn: async () => {
            const { data, error } = await supabase.from('contract_claims').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // 2. Mutations
    const mAddClientContract = useMutation({
        mutationFn: async (contract: any) => {
            const { error } = await supabase.from('client_contracts').insert([contract]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts-client'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteClientContract = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('client_contracts').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts-client'] })
    });

    const mAddSubcontract = useMutation({
        mutationFn: async (sub: any) => {
            const { error } = await supabase.from('subcontracts').insert([sub]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts-sub'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteSubcontract = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('subcontracts').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts-sub'] })
    });

    const mAddBill = useMutation({
        mutationFn: async (bill: any) => {
            const { error } = await supabase.from('running_bills').insert([bill]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts-bills'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteBill = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('running_bills').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts-bills'] })
    });

    const mAddVariation = useMutation({
        mutationFn: async (vo: any) => {
            const { error } = await supabase.from('variation_orders').insert([vo]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts-variations'] });
            setIsModalOpen(false);
        }
    });

    const mAddClaim = useMutation({
        mutationFn: async (claim: any) => {
            const { error } = await supabase.from('contract_claims').insert([claim]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts-claims'] });
            setIsModalOpen(false);
        }
    });

    // 3. Render Views
    const renderClientContracts = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {clientContracts?.map((c: any) => (
                <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between min-h-[350px]">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                {c.status} Node
                            </span>
                            <button onClick={() => mDeleteClientContract.mutate(c.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.contract_number}</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-tight">{c.projects?.name || 'Unlinked Contract'}</h4>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl">
                                <span className="uppercase">Total Value</span>
                                <span className="text-slate-900 font-black">{formatCurrency(c.total_value)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Retention Logic</span>
                                <span className="text-red-600">{c.retention_percentage}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                            <Calendar size={14} /> {c.contract_date}
                        </div>
                        <button className="p-2 bg-slate-900 text-white rounded-xl hover:scale-110 transition-all">
                            <Download size={14} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={() => { setModalType('client-con'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] min-h-[350px] flex flex-col items-center justify-center p-10 hover:border-red-300 transition-all group">
                <Plus size={48} className="text-slate-200 group-hover:text-red-400 mb-4 transition-all" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorize Client Agreement</p>
            </button>
        </div>
    );

    const renderSubcontracts = () => (
        <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm font-sans">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sub-Work Registry</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">External Contractor Obligations & Work Orders</p>
                </div>
                <button onClick={() => { setModalType('sub-wo'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
                    <Plus size={16} /> Raise Work Order
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-10 py-6">Work Order #</th>
                            <th className="px-10 py-6">Subcontractor</th>
                            <th className="px-10 py-6">Project Assign</th>
                            <th className="px-10 py-6">WO Value</th>
                            <th className="px-10 py-6">Status</th>
                            <th className="px-10 py-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                        {subcontracts?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{s.work_order_number}</td>
                                <td className="px-10 py-6 font-bold text-slate-600 text-xs">{s.subcontractor_name}</td>
                                <td className="px-10 py-6 font-bold text-slate-400 text-xs">{s.projects?.name}</td>
                                <td className="px-10 py-6 font-black text-slate-900">{formatCurrency(s.wo_value)}</td>
                                <td className="px-10 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${s.status === 'Open' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>{s.status}</span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button onClick={() => mDeleteSubcontract.mutate(s.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 page-transition text-black pb-20 font-sans">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3 leading-none">
                        <ShieldCheck className="text-red-600" size={32} /> Contracts & Work Orders
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2 font-mono text-[10px] tracking-widest uppercase italic leading-none">Legal Instrument Registry — Multi-Tier Sub-Governance 2026</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {(['client-contracts', 'subcontracts', 'bills', 'deposits', 'variations', 'claims'] as SubTab[]).map(t => (
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
                    {activeTab === 'client-contracts' && renderClientContracts()}
                    {activeTab === 'subcontracts' && renderSubcontracts()}
                    {activeTab === 'bills' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bills?.map((b: any) => (
                                <div key={b.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${b.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                                {b.payment_status} RA Bill
                                            </span>
                                            <button onClick={() => mDeleteBill.mutate(b.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{b.bill_number}</p>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">{formatCurrency(b.net_payable)}</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Retention Hold</span>
                                                <span className="text-red-600">{formatCurrency(b.retention_deduction)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>TDS Deduction</span>
                                                <span className="text-slate-400">{formatCurrency(b.tds_deduction)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full mt-8 py-4 bg-slate-50 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-[24px] border border-slate-200">
                                        Authorize Disbursement Node
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('bill'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] min-h-[300px] flex flex-col items-center justify-center p-10 hover:border-red-300 transition-all group">
                                <Plus size={48} className="text-slate-200 group-hover:text-red-400 mb-4 transition-all" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raise Running Account Bill</p>
                            </button>
                        </div>
                    )}
                    {activeTab === 'deposits' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Security & Retention Matrix</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Capital Lock-In & Release Schedules</p>
                                </div>
                                <button onClick={() => { setModalType('deposit'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                                    <Plus size={16} /> Log Security Node
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-10 py-6">Instrument Type</th>
                                            <th className="px-10 py-6">Locked Amount</th>
                                            <th className="px-10 py-6">Release Threshold Date</th>
                                            <th className="px-10 py-6">Status</th>
                                            <th className="px-10 py-6 text-right">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-sans">
                                        {deposits?.map((d: any) => (
                                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{d.deposit_type}</td>
                                                <td className="px-10 py-6 font-black text-red-600">{formatCurrency(d.amount)}</td>
                                                <td className="px-10 py-6 font-bold text-slate-400 text-xs">{d.release_date}</td>
                                                <td className="px-10 py-6">
                                                    {d.is_released ?
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Released</span> :
                                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase">Held In Escrow</span>
                                                    }
                                                </td>
                                                <td className="px-10 py-6 text-right font-bold text-slate-400 text-[10px] uppercase italic">{d.remarks || 'No notes'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'variations' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {variations?.map((v: any) => (
                                <div key={v.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm group">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                                            <TrendingUp size={24} />
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${v.approval_status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                            VO {v.approval_status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{v.vo_number}</p>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">{v.description}</h4>
                                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-50">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impact Value</p>
                                            <p className={`text-lg font-black ${v.impact_value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {v.impact_value >= 0 ? '+' : ''}{formatCurrency(v.impact_value)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Variation Date</p>
                                            <p className="text-sm font-bold text-slate-600">{v.vo_date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('variation'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center p-20 hover:border-red-300 transition-all group min-h-[300px]">
                                <Plus size={48} className="text-slate-200 group-hover:text-red-400 transition-all" />
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-4">Record Scope Variation Node</p>
                            </button>
                        </div>
                    )}
                    {activeTab === 'claims' && (
                        <div className="space-y-6">
                            {claims?.map((cl: any) => (
                                <div key={cl.id} className="bg-white p-10 rounded-[40px] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase">{cl.claim_type}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cl.claim_number}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Technical Claim Request</h4>
                                        <p className="text-xs text-slate-500 italic max-w-2xl">{cl.justification}</p>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Claim Value</p>
                                            <p className="text-lg font-black text-red-600">{formatCurrency(cl.value)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Settlement Status</p>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{cl.status}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-red-50 text-slate-300 group-hover:text-red-600 transition-all">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('claim'); setIsModalOpen(true); }} className="w-full py-12 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center hover:border-red-300 transition-all group bg-slate-50/30">
                                <AlertTriangle size={32} className="text-slate-200 group-hover:text-red-400 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase">Initialize Dispute/Claim Resolution Node</p>
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Authorize Legal Governance Entry</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-600 transition-all" /></button>
                            </div>
                            <div className="p-10">
                                {modalType === 'client-con' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddClientContract.mutate({
                                            project_id: fd.get('pid'),
                                            contract_number: fd.get('num'),
                                            contract_date: fd.get('date'),
                                            total_value: parseFloat(fd.get('val') as string),
                                            retention_percentage: parseFloat(fd.get('ret') as string),
                                            status: 'Active'
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Target Project Node</label>
                                            <select name="pid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Instrument No #</label>
                                                <input name="num" required placeholder="CON/2026/001" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Instrument Date</label>
                                                <input name="date" type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Total Value (₹)</label>
                                                <input name="val" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Retention %</label>
                                                <input name="ret" type="number" defaultValue="5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest">
                                            {mAddClientContract.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Settle Instrument Registry'}
                                        </button>
                                    </form>
                                )}
                                {modalType === 'sub-wo' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddSubcontract.mutate({
                                            project_id: fd.get('pid'),
                                            subcontractor_name: fd.get('name'),
                                            work_order_number: fd.get('num'),
                                            wo_date: fd.get('date'),
                                            wo_value: parseFloat(fd.get('val') as string),
                                            status: 'Open'
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Associate Project</label>
                                            <select name="pid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Subcontractor Entity Name</label>
                                            <input name="name" required placeholder="Modern Infrastructure Pvt Ltd" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Work Order #</label>
                                                <input name="num" required placeholder="WO/ENG/2026/42" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Issuance Date</label>
                                                <input name="date" type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Total Assigned Value (₹)</label>
                                            <input name="val" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest">
                                            {mAddSubcontract.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Initialize Work Order Node'}
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

export default ContractsManagement;
