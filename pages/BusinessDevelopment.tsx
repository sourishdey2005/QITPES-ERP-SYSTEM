
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Briefcase, Search, Filter, Plus, Trash2, Edit, X, Loader2,
    BookOpen, Calculator, GitPullRequest, Sword, Target,
    FileSpreadsheet, ArrowUpRight, TrendingUp, CheckCircle2,
    Clock, ShieldAlert, Award, Layers, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'tenders' | 'rates' | 'boq' | 'approvals' | 'competitors';

const BusinessDevelopment: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SubTab>('tenders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'rate' | 'competitor' | ''>('');
    const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);

    // 1. Data Fetching
    const { data: tenders, isLoading: loadingTenders } = useQuery({
        queryKey: ['biz-tenders'],
        queryFn: async () => {
            const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: rates } = useQuery({
        queryKey: ['biz-rates'],
        queryFn: async () => {
            const { data, error } = await supabase.from('rate_analysis').select('*').order('item_description');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: approvals } = useQuery({
        queryKey: ['biz-approvals'],
        queryFn: async () => {
            const { data, error } = await supabase.from('bid_approvals').select('*, tenders(tender_no, authority_name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: competitors } = useQuery({
        queryKey: ['biz-competitors'],
        queryFn: async () => {
            const { data, error } = await supabase.from('competitor_analysis').select('*, tenders(tender_no)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // 2. Mutations
    const mAddRate = useMutation({
        mutationFn: async (rate: any) => {
            const { error } = await supabase.from('rate_analysis').insert([rate]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['biz-rates'] });
            setIsModalOpen(false);
        }
    });

    const mAddCompetitor = useMutation({
        mutationFn: async (comp: any) => {
            const { error } = await supabase.from('competitor_analysis').insert([comp]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['biz-competitors'] });
            setIsModalOpen(false);
        }
    });

    // 3. UI Components
    const renderTenderTracking = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenders?.map((t: any) => (
                <div key={t.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.technical_status === 'Submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                {t.technical_status}
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tender_no}</p>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{t.authority_name}</h4>
                        <p className="text-xs text-slate-500 font-medium italic mb-6 line-clamp-2">{t.description || 'No description provided.'}</p>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-400">Value (₹)</span>
                                <span className="text-slate-900">{formatCurrency(t.estimated_value)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-400">Win Prob</span>
                                <span className="text-red-600">{t.probability_percentage}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-300" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Ends: {t.bid_submission_date}</span>
                        </div>
                        <div className={`p-2 rounded-xl ${t.financial_status === 'L1' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            <Award size={18} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderRateLibrary = () => (
        <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Rate Analysis Master</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Standardized Costing Library</p>
                </div>
                <button onClick={() => { setIsModalOpen(true); setSelectedTenderId(null); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                    <Plus size={16} /> Add Item
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-10 py-6">Item Description</th>
                            <th className="px-10 py-6">Unit</th>
                            <th className="px-10 py-6">Material (₹)</th>
                            <th className="px-10 py-6">Labor (₹)</th>
                            <th className="px-10 py-6">Markup %</th>
                            <th className="px-10 py-6 text-right">Total Rate (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rates?.map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{r.item_description}</td>
                                <td className="px-10 py-6 font-bold text-slate-400 text-[10px] uppercase">{r.unit}</td>
                                <td className="px-10 py-6 font-bold text-slate-600 text-xs">{formatCurrency(r.material_cost)}</td>
                                <td className="px-10 py-6 font-bold text-slate-600 text-xs">{formatCurrency(r.labor_cost)}</td>
                                <td className="px-10 py-6">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">{r.markup_percentage}%</span>
                                </td>
                                <td className="px-10 py-6 text-right font-black text-slate-900 text-sm">{formatCurrency(r.total_rate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 page-transition text-black pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Briefcase className="text-red-600" size={32} /> Tender & Biz-Dev
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1 font-mono text-[10px] tracking-widest uppercase italic">Front-Line Acquisition Node — Tendering Department</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {(['tenders', 'rates', 'approvals', 'competitors'] as SubTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    {activeTab === 'tenders' && renderTenderTracking()}
                    {activeTab === 'rates' && renderRateLibrary()}
                    {activeTab === 'approvals' && (
                        <div className="bg-white p-20 rounded-[48px] border border-slate-200 text-center">
                            <GitPullRequest size={64} className="mx-auto text-slate-200 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 uppercase">Bid Approval Workflow</h3>
                            <p className="text-slate-400 font-bold italic mt-2">Executive verification queue for finalized BOQs.</p>
                            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                                {approvals?.map((a: any) => (
                                    <div key={a.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{a.tenders?.tender_no}</p>
                                        <h4 className="text-sm font-black text-slate-900 uppercase leading-snug mb-4">{a.tenders?.authority_name}</h4>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${a.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>{a.status}</span>
                                            <ShieldAlert size={14} className="text-slate-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'competitors' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {competitors?.map((c: any) => (
                                <div key={c.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{c.competitor_name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">vs {c.tenders?.tender_no}</p>
                                        </div>
                                        <div className="p-4 bg-red-50 text-red-600 rounded-3xl">
                                            <Sword size={24} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="p-6 bg-slate-50 rounded-[32px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Quoted Amt</p>
                                            <p className="text-lg font-black text-slate-900">{formatCurrency(c.quoted_amount)}</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-[32px]">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tech Score</p>
                                            <p className="text-lg font-black text-slate-900">{c.technical_score}/100</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-2xl">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Strengths</p>
                                            <p className="text-xs font-bold text-slate-600">{c.strengths || 'Not analyzed.'}</p>
                                        </div>
                                        <div className="p-4 border border-red-100 bg-red-50/30 rounded-2xl">
                                            <p className="text-[9px] font-black text-red-600 uppercase mb-1">Weaknesses</p>
                                            <p className="text-xs font-bold text-slate-600">{c.weaknesses || 'Not analyzed.'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => { setModalType('competitor'); setIsModalOpen(true); }}
                                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center p-20 hover:border-red-300 hover:bg-red-50/30 transition-all group">
                                <Plus size={48} className="text-slate-300 group-hover:text-red-400 mb-4 transition-all" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-red-500 transition-all">Add Competitor Intel</p>
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                                    {activeTab === 'rates' ? 'Add Library Item' : 'Add Competitor Intel'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>

                            <div className="p-10">
                                {activeTab === 'rates' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddRate.mutate({
                                            item_description: fd.get('desc'),
                                            unit: fd.get('unit'),
                                            material_cost: parseFloat(fd.get('mat') as string),
                                            labor_cost: parseFloat(fd.get('lab') as string),
                                            markup_percentage: parseFloat(fd.get('markup') as string)
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
                                            <input name="desc" required placeholder="RCC M25 Concrete Casting" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Unit</label>
                                                <input name="unit" required placeholder="Cum / Sqm" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Markup %</label>
                                                <input name="markup" type="number" defaultValue="15" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Material Cost</label>
                                                <input name="mat" type="number" step="0.01" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Labor Cost</label>
                                                <input name="lab" type="number" step="0.01" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                            {mAddRate.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Register in Library'}
                                        </button>
                                    </form>
                                )}

                                {activeTab === 'competitors' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddCompetitor.mutate({
                                            tender_id: fd.get('tid'),
                                            competitor_name: fd.get('name'),
                                            quoted_amount: parseFloat(fd.get('amt') as string),
                                            technical_score: parseFloat(fd.get('score') as string),
                                            strengths: fd.get('strengths'),
                                            weaknesses: fd.get('weaknesses')
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Link Tender</label>
                                            <select name="tid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {tenders?.map((t: any) => <option key={t.id} value={t.id}>{t.tender_no}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Competitor Name</label>
                                            <input name="name" required placeholder="L&T Construction / Adani Infra" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Quoted Amt</label>
                                                <input name="amt" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Tech Score (1-100)</label>
                                                <input name="score" type="number" required placeholder="0" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                            {mAddCompetitor.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Settle Intel Node'}
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

export default BusinessDevelopment;
