
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Users, UserPlus, Phone, Mail, MapPin, Search, Filter,
    Plus, Trash2, Edit, X, Loader2, Target, Briefcase,
    Calendar, FileText, Globe, Star, MessageSquare,
    TrendingUp, CheckCircle2, AlertCircle, Clock, ChevronRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'clients' | 'leads' | 'interactions' | 'contracts';

const CRM: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SubTab>('clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'client' | 'lead' | 'interaction' | 'contract' | ''>('');

    // 1. Data Fetching
    const { data: clients } = useQuery({
        queryKey: ['crm-clients'],
        queryFn: async () => {
            const { data, error } = await supabase.from('crm_clients').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: leads } = useQuery({
        queryKey: ['crm-leads'],
        queryFn: async () => {
            const { data, error } = await supabase.from('crm_leads').select('*, crm_clients(name, company_name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: interactions } = useQuery({
        queryKey: ['crm-interactions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('crm_interactions').select('*, crm_clients(name), crm_leads(title)').order('interaction_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: contracts } = useQuery({
        queryKey: ['crm-contracts'],
        queryFn: async () => {
            const { data, error } = await supabase.from('crm_contracts').select('*, crm_clients(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // 2. Mutations
    const mAddClient = useMutation({
        mutationFn: async (client: any) => {
            const { error } = await supabase.from('crm_clients').insert([client]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm-clients'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteClient = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('crm_clients').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-clients'] })
    });

    const mAddLead = useMutation({
        mutationFn: async (lead: any) => {
            const { error } = await supabase.from('crm_leads').insert([lead]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteLead = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('crm_leads').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
    });

    // 3. UI Components
    const renderClients = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients?.map((c: any) => (
                <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.category === 'VIP' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                {c.category} Node
                            </span>
                            <button onClick={() => mDeleteClient.mutate(c.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{c.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{c.company_name || 'Individual Client'}</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Phone size={14} /></div>
                                {c.phone || 'No Contact'}
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail size={14} /></div>
                                {c.email || 'No Email'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase ${c.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            Status: {c.status}
                        </span>
                        <div className="p-2 bg-slate-50 group-hover:bg-red-50 text-slate-400 group-hover:text-red-600 rounded-xl transition-all">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => { setModalType('client'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] min-h-[300px] flex flex-col items-center justify-center p-10 hover:border-red-300 transition-all group">
                <Plus size={48} className="text-slate-200 group-hover:text-red-400 mb-4 transition-all" />
                <p className="text-[10px] font-black text-slate-400 uppercase group-hover:text-red-600">Initialize Client Identity</p>
            </button>
        </div>
    );

    const renderLeads = () => (
        <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sales Pipeline Matrix</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Acquisition Velocity & Expected Value</p>
                </div>
                <button onClick={() => { setModalType('lead'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                    <Plus size={16} /> Raise Opportunity
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-10 py-6">Lead Description</th>
                            <th className="px-10 py-6">Client Entity</th>
                            <th className="px-10 py-6">Pipeline Value</th>
                            <th className="px-10 py-6">Current Stage</th>
                            <th className="px-10 py-6">Probability</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                        {leads?.map((l: any) => (
                            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{l.title}</td>
                                <td className="px-10 py-6 font-bold text-slate-600 text-xs">{l.crm_clients?.name}</td>
                                <td className="px-10 py-6 font-black text-slate-900">{formatCurrency(l.value)}</td>
                                <td className="px-10 py-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${l.stage === 'Won' ? 'bg-emerald-50 text-emerald-600' :
                                        l.stage === 'Lost' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                        }`}>{l.stage}</span>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="bg-red-600 h-full" style={{ width: `${l.probability}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400">{l.probability}%</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button onClick={() => mDeleteLead.mutate(l.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
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
                        <Users className="text-red-600" size={32} /> CRM Master Console
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2 font-mono text-[10px] tracking-widest uppercase italic leading-none">Client Relationship Infrastructure — Sales Acquisition Hub 2026</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {(['clients', 'leads', 'interactions', 'contracts'] as SubTab[]).map(t => (
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
                <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                    {activeTab === 'clients' && renderClients()}
                    {activeTab === 'leads' && renderLeads()}
                    {activeTab === 'interactions' && (
                        <div className="bg-white p-20 rounded-[48px] border border-slate-200 text-center relative overflow-hidden min-h-[500px] flex flex-col justify-center">
                            <MessageSquare size={64} className="mx-auto text-slate-100 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 uppercase">Interaction Registry</h3>
                            <p className="text-slate-400 font-bold italic mt-2">Comprehensive audit trail of every client touchpoint.</p>
                            <div className="mt-12 max-w-4xl mx-auto w-full space-y-4">
                                {interactions?.map((i: any) => (
                                    <div key={i.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-red-100 transition-all text-left group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400">{i.interaction_type}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{i.interaction_date.slice(0, 10)}</span>
                                        </div>
                                        <h5 className="text-sm font-black text-slate-900 uppercase">{i.crm_clients?.name} <span className="text-slate-400 font-bold">—</span> {i.crm_leads?.title}</h5>
                                        <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">{i.details}</p>
                                    </div>
                                ))}
                                {interactions?.length === 0 && (
                                    <div className="py-20 border-2 border-dashed border-slate-200 rounded-[40px] text-slate-300 font-black uppercase text-xs">Waiting for Interaction Nodes...</div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'contracts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {contracts?.map((cn: any) => (
                                <div key={cn.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                                                <FileText size={24} />
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${cn.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{cn.status}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{cn.title}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cn.contract_number}</p>
                                        <div className="mt-6 flex justify-between items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100 transition-all group-hover:bg-slate-900/5">
                                            <div className="text-left">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contract Sum</p>
                                                <p className="font-black text-slate-900">{formatCurrency(cn.value)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Expiry</p>
                                                <p className="font-bold text-red-600 text-xs">{cn.end_date}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full mt-8 py-4 bg-slate-50 border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-[24px] hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                        <Download size={14} /> Retrieve Agreement Node
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Authorize CRM Registry Entry</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-600 transition-all" /></button>
                            </div>
                            <div className="p-10">
                                {modalType === 'client' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddClient.mutate({
                                            name: fd.get('name'),
                                            company_name: fd.get('company'),
                                            email: fd.get('email'),
                                            phone: fd.get('phone'),
                                            category: fd.get('cat'),
                                            status: 'Active'
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Primary Contact Name</label>
                                            <input name="name" required placeholder="Johnathan Sterling" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Entity / Company Name</label>
                                            <input name="company" placeholder="Sterling Global Infra" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Email Protocol</label>
                                                <input name="email" type="email" placeholder="client@node.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Mobile Node</label>
                                                <input name="phone" placeholder="+91 98XXX XXX00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Tier Logic</label>
                                            <select name="cat" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                <option value="Standard">Standard Profile</option>
                                                <option value="Premium">Premium Account</option>
                                                <option value="VIP">VIP Critical Entity</option>
                                                <option value="Government">Government Authority</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                            {mAddClient.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Client Node'}
                                        </button>
                                    </form>
                                )}
                                {modalType === 'lead' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddLead.mutate({
                                            client_id: fd.get('cid'),
                                            title: fd.get('title'),
                                            value: parseFloat(fd.get('val') as string),
                                            stage: fd.get('stage'),
                                            probability: parseInt(fd.get('prob') as string),
                                            expected_closing: fd.get('date')
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Associate Client</label>
                                            <select name="cid" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Opportunity Title</label>
                                            <input name="title" required placeholder="Project Alpha Extension Bid" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Deal Value (₹)</label>
                                                <input name="val" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Win Prop %</label>
                                                <input name="prob" type="number" defaultValue="20" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Forecast Closing</label>
                                                <input name="date" type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Pipeline Stage</label>
                                                <select name="stage" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                    <option value="Discovery">Discovery</option>
                                                    <option value="Proposal">Proposal</option>
                                                    <option value="Negotiation">Negotiation</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                            {mAddLead.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Inject Pipeline Node'}
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

export default CRM;
