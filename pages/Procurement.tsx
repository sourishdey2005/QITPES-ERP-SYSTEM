
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Package, ShoppingCart, Truck, Warehouse, Star, Plus,
    Search, Filter, CheckCircle2, AlertCircle, Clock,
    ArrowRight, Download, Trash2, Edit, X, Loader2,
    FileText, ClipboardList, TrendingUp, ShieldCheck,
    Ship, Layers, Box, BarChart3, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SubTab = 'requisitions' | 'rfqs' | 'inventory' | 'grns' | 'performance';

const Procurement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SubTab>('requisitions');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'mr' | 'rfq' | 'wh' | 'grn' | ''>('');

    // 1. Data Fetching
    const { data: requisitions } = useQuery({
        queryKey: ['procurement-mrs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('material_requisitions').select('*, projects(name)').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: rfqs } = useQuery({
        queryKey: ['procurement-rfqs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('procurement_rfqs').select('*, material_requisitions(mr_number, item_name)').order('created_at', { ascending: false });
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

    // 3. Render Views
    const renderRequisitions = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitions?.map((m: any) => (
                <div key={m.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${m.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                    m.priority === 'Critical' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'
                                }`}>{m.status}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.mr_number}</p>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{m.item_name}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Box size={14} /> {m.quantity} {m.unit}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase italic">Project: {m.projects?.name || 'Central Inventory'}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${m.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            Priority: {m.priority}
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-red-600 transition-colors" />
                    </div>
                </div>
            ))}
            <button onClick={() => { setModalType('mr'); setIsModalOpen(true); }} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] min-h-[250px] flex flex-col items-center justify-center p-10 hover:border-red-300 hover:bg-red-50/30 group transition-all">
                <Plus size={48} className="text-slate-300 group-hover:text-red-400 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raise Material Requisition</p>
            </button>
        </div>
    );

    const renderPerformance = () => (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-100 bg-slate-50/30">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Vendor Performance Matrix</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SLA Compliance & Reliability Scoring</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-10 py-6">Vendor Name</th>
                            <th className="px-10 py-6 text-center">Quality Score</th>
                            <th className="px-10 py-6 text-center">Delivery Score</th>
                            <th className="px-10 py-6 text-center">Cost Score</th>
                            <th className="px-10 py-6 text-right">Aggregate Rating</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {performance?.map((v: any) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{v.vendor_name}</td>
                                <td className="px-10 py-6 text-center">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${v.quality_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${v.delivery_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto"><div className="bg-amber-500 h-full rounded-full" style={{ width: `${v.cost_score}%` }} /></div>
                                </td>
                                <td className="px-10 py-6 text-right font-black text-red-600 text-sm flex items-center justify-end gap-2">
                                    <Star size={16} className="fill-red-600" /> {v.overall_rating} / 10
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
                <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                    {activeTab === 'requisitions' && renderRequisitions()}
                    {activeTab === 'performance' && renderPerformance()}
                    {activeTab === 'inventory' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {warehouses?.map((w: any) => (
                                <div key={w.id} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm h-[400px] flex flex-col justify-between">
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
                                <Plus size={64} className="text-slate-200 group-hover:text-red-400" />
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-4">Initialize New Warehouse Node</p>
                            </button>
                        </div>
                    )}
                    {activeTab === 'grns' && (
                        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Material Inward Log (GRN)</h4>
                                <button onClick={() => { setModalType('grn'); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all">
                                    <Plus size={16} /> New GRN Entry
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-10 py-6">GRN Node</th>
                                            <th className="px-10 py-6">Reference (PO)</th>
                                            <th className="px-10 py-6">Vendor</th>
                                            <th className="px-10 py-6">Depot</th>
                                            <th className="px-10 py-6 text-right">Receive Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {grns?.map((g: any) => (
                                            <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-10 py-6 font-black text-slate-900 text-xs uppercase">{g.grn_number}</td>
                                                <td className="px-10 py-6 font-bold text-red-600 text-xs uppercase">{g.purchase_orders?.po_number}</td>
                                                <td className="px-10 py-6 font-bold text-slate-600 text-xs uppercase">{g.purchase_orders?.vendor_name}</td>
                                                <td className="px-10 py-6"><span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">{g.warehouses?.name}</span></td>
                                                <td className="px-10 py-6 text-right font-bold text-slate-400 text-[10px]">{g.received_date}</td>
                                            </tr>
                                        ))}
                                        {grns?.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic uppercase text-xs">No material inward nodes recorded.</td>
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
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Authorize Procurement Node</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                            </div>
                            <div className="p-10">
                                {modalType === 'mr' && (
                                    <form onSubmit={(e: any) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.target);
                                        mAddMR.mutate({
                                            mr_number: `MR-${Date.now().toString().slice(-6)}`,
                                            item_name: fd.get('item'),
                                            quantity: parseFloat(fd.get('qty') as string),
                                            unit: fd.get('unit'),
                                            priority: fd.get('priority'),
                                            status: 'Pending'
                                        });
                                    }} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Item Description</label>
                                            <input name="item" required placeholder="TATA Reinforcement Steel 12mm" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Quantity</label>
                                                <input name="qty" type="number" required placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Unit</label>
                                                <input name="unit" required placeholder="MT / Nos / Bgs" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Priority Ranking</label>
                                            <select name="priority" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                <option value="Normal">Normal Operational</option>
                                                <option value="Urgent">Urgent Acquisition</option>
                                                <option value="Critical">Critical Line Halt</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                            {mAddMR.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Register Requisition'}
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Depot Name</label>
                                            <input name="name" required placeholder="Western Logistics Zone" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Site/Location</label>
                                            <input name="loc" required placeholder="Hinjewadi Phase 2" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                                            {mAddWH.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Initialize Warehouse'}
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
