
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Package, ShoppingCart, Truck, Warehouse, Star, Plus,
    Search, Filter, CheckCircle2, AlertCircle, Clock,
    ArrowRight, Download, Trash2, Edit, X, Loader2,
    FileText, ClipboardList, TrendingUp, ShieldCheck,
    Ship, Layers, Box, BarChart3, List, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'requisitions' | 'rfqs' | 'inventory' | 'grns' | 'performance';

const Procurement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SubTab>('requisitions');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'mr' | 'rfq' | 'wh' | 'grn' | 'vendor' | ''>('');

    // 1. Data Fetching
    const { data: requisitions } = useQuery({
        queryKey: ['procurement-mrs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('material_requisitions').select('*, projects(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: warehouses } = useQuery({
        queryKey: ['procurement-whs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('warehouses').select('*');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: performance } = useQuery({
        queryKey: ['procurement-performance'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vendor_performance').select('*').order('overall_rating', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: grns } = useQuery({
        queryKey: ['procurement-grns'],
        queryFn: async () => {
            const { data, error } = await supabase.from('grns').select('*, purchase_orders(po_number, vendor_name), warehouses(name)').order('received_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: projects } = useQuery({
        queryKey: ['projects-mini'],
        queryFn: async () => {
            const { data, error } = await supabase.from('projects').select('id, name');
            if (error) throw error;
            return data || [];
        }
    });

    // 2. Mutations
    const mAddMR = useMutation({
        mutationFn: async (mr: any) => {
            const { error } = await supabase.from('material_requisitions').insert([mr]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procurement-mrs'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteMR = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('material_requisitions').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procurement-mrs'] })
    });

    const mUpdateMRStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('material_requisitions').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procurement-mrs'] })
    });

    const mAddWH = useMutation({
        mutationFn: async (wh: any) => {
            const { error } = await supabase.from('warehouses').insert([wh]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procurement-whs'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteWH = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procurement-whs'] })
    });

    const mAddVendorPerf = useMutation({
        mutationFn: async (perf: any) => {
            const { error } = await supabase.from('vendor_performance').insert([perf]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procurement-performance'] });
            setIsModalOpen(false);
        }
    });

    const mDeleteVendorPerf = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('vendor_performance').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procurement-performance'] })
    });

    // 3. Render Views
    const renderRequisitions = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitions?.map((m: any) => (
                <div key={m.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between min-h-[300px]">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${m.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                    m.priority === 'Critical' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'
                                }`}>{m.status}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => mDeleteMR.mutate(m.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.mr_number}</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{m.item_name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Box size={14} /> {m.quantity} {m.unit}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase italic">Project: {m.projects?.name || 'Central Inventory'}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <select
                            value={m.status}
                            onChange={(e) => mUpdateMRStatus.mutate({ id: m.id, status: e.target.value })}
                            className="text-[9px] font-black uppercase bg-slate-50 border-none outline-none rounded-lg px-2 py-1">
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${m.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            Rank: {m.priority}
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => { setModalType('mr'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] min-h-[300px] flex flex-col items-center justify-center p-10 hover:border-red-300 hover:bg-red-50/30 group transition-all">
                <Plus size={48} className="text-slate-300 group-hover:text-red-400 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raise Material Node</p>
            </button>
        </div>
    );

    const renderPerformance = () => (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Vendor Performance Matrix</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SLA Compliance & Reliability Scoring</p>
                </div>
                <button onClick={() => { setModalType('vendor'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
                    <Plus size={16} /> Grade Vendor
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-10 py-6">Vendor Cluster</th>
                            <th className="px-10 py-6 text-center">Quality</th>
                            <th className="px-10 py-6 text-center">Delivery</th>
                            <th className="px-10 py-6 text-center">Cost</th>
                            <th className="px-10 py-6 text-right">Aggregate Score</th>
                            <th className="px-10 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {performance?.map((v: any) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{v.vendor_name}</td>
                                <td className="px-10 py-6">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${v.quality_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${v.delivery_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${v.cost_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6 text-right font-black text-red-600 text-sm flex items-center justify-end gap-2">
                                    <Star size={16} className="fill-red-600" /> {v.overall_rating} / 10
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button onClick={() => mDeleteVendorPerf.mutate(v.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
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
        <div className="space-y-8 page-transition text-black pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Truck className="text-red-600" size={32} /> Procurement & Supply
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1 font-mono text-[10px] tracking-widest uppercase italic">Operational Logistics Hub — Global Supply Chain Node</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {(['requisitions', 'rfqs', 'inventory', 'grns', 'performance'] as SubTab[]).map(t => (
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
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {activeTab === 'requisitions' && renderRequisitions()}
                    {activeTab === 'performance' && renderPerformance()}
                    {activeTab === 'inventory' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {warehouses?.map((w: any) => (
                                <div key={w.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between group relative">
                                    <button
                                        onClick={() => mDeleteWH.mutate(w.id)}
                                        className="absolute top-8 right-10 p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                    <div className="flex justify-between items-start">
                                        <div className="p-4 bg-slate-900 text-white rounded-3xl">
                                            <Warehouse size={32} />
                                        </div>
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">Active Depot</span>
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{w.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                                            <Box size={14} /> {w.location || 'Central Logistics Hub'}
                                        </p>
                                    </div>
                                    <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all border border-slate-200">
                                        View Detailed Inventory
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => { setModalType('wh'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[48px] h-[400px] flex flex-col items-center justify-center hover:border-red-300 transition-all group">
                                <Plus size={64} className="text-slate-200 group-hover:text-red-400 transition-all" />
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-4 group-hover:text-red-600 transition-all">Initialize New Warehouse Node</p>
                            </button>
                        </div>
                    )}
                    {activeTab === 'grns' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Material Inward Log (GRN)</h4>
                                <div className="flex items-center gap-4">
                                    <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-2">
                                        <Download size={16} /> Export Log
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-10 py-6">Inward Node</th>
                                            <th className="px-10 py-6">Reference (PO)</th>
                                            <th className="px-10 py-6">Vendor</th>
                                            <th className="px-10 py-6">Depot Status</th>
                                            <th className="px-10 py-6 text-right">Inward Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {grns?.map((g: any) => (
                                            <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{g.grn_number}</td>
                                                <td className="px-10 py-6 font-bold text-red-600 text-xs uppercase">{g.purchase_orders?.po_number || 'N/A'}</td>
                                                <td className="px-10 py-6 font-bold text-slate-600 text-xs uppercase">{g.purchase_orders?.vendor_name || 'N/A'}</td>
                                                <td className="px-10 py-6">
                                                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">{g.warehouses?.name}</span>
                                                </td>
                                                <td className="px-10 py-6 text-right font-bold text-slate-400 text-[10px]">{g.received_date}</td>
                                            </tr>
                                        ))}
                                        {grns?.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center text-slate-300 font-black italic uppercase text-xs">Waiting for material inward nodes.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                                    {modalType === 'mr' ? 'Raise Requisition Node' : modalType === 'wh' ? 'Initialize Warehouse' : 'Grade Vendor Performance'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                            </div>
                            <div className="p-10">
                                {modalType === 'mr' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddMR.mutate({
                                            mr_number: `MR-${Date.now().toString().slice(-6)}`,
                                            project_id: fd.get('pid'),
                                            item_name: fd.get('item'),
                                            quantity: parseFloat(fd.get('qty') as string),
                                            unit: fd.get('unit'),
                                            priority: fd.get('priority'),
                                            status: 'Pending'
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Target Project</label>
                                            <select name="pid" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                <option value="">Central Inventory</option>
                                                {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Material Specification</label>
                                            <input name="item" required placeholder="High-Tensile TMT Bar (12mm)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Sum Quantity</label>
                                                <input name="qty" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Unit Node</label>
                                                <input name="unit" required placeholder="MT / Nos / Bags" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Operational Priority</label>
                                            <select name="priority" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                <option value="Normal">Normal</option>
                                                <option value="Urgent">Urgent Acquisition</option>
                                                <option value="Critical">Critical Line Halt</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">
                                            {mAddMR.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Requisition'}
                                        </button>
                                    </form>
                                )}
                                {modalType === 'wh' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddWH.mutate({
                                            name: fd.get('name'),
                                            location: fd.get('loc'),
                                            is_active: true
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Depot Cluster Name</label>
                                            <input name="name" required placeholder="South Zone Warehouse" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Geo-Location</label>
                                            <input name="loc" required placeholder="Cluster-A, Sector 45" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl">
                                            {mAddWH.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Initialize Depot'}
                                        </button>
                                    </form>
                                )}
                                {modalType === 'vendor' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddVendorPerf.mutate({
                                            vendor_name: fd.get('name'),
                                            quality_score: parseInt(fd.get('q') as string),
                                            delivery_score: parseInt(fd.get('d') as string),
                                            cost_score: parseInt(fd.get('c') as string)
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Vendor Name</label>
                                            <input name="name" required placeholder="L&T Construction Supplies" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Quality (0-100)</label>
                                                <input name="q" type="number" required placeholder="95" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Logistics (0-100)</label>
                                                <input name="d" type="number" required placeholder="90" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Pricing (0-100)</label>
                                                <input name="c" type="number" required placeholder="85" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">
                                            {mAddVendorPerf.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Settle Vendor Grade'}
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

export default Procurement;
