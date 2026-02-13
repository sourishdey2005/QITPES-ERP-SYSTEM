
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
    Users, Building2, Phone, Mail, MapPin, Search, Filter,
    Plus, Trash2, Edit, X, Loader2, Star, BadgeCheck,
    ShieldCheck, Globe, CreditCard, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Vendors: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // 1. Data Fetching
    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors-master'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vendors').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    // 2. Mutations
    const mAddVendor = useMutation({
        mutationFn: async (vendor: any) => {
            const { error } = await supabase.from('vendors').insert([vendor]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors-master'] });
            setIsModalOpen(false);
        }
    });

    const mUpdateVendor = useMutation({
        mutationFn: async (vendor: any) => {
            const { id, ...updateData } = vendor;
            const { error } = await supabase.from('vendors').update(updateData).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors-master'] });
            setIsModalOpen(false);
            setEditingVendor(null);
        }
    });

    const mDeleteVendor = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors-master'] })
    });

    const filteredVendors = vendors?.filter((v: any) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 page-transition text-black pb-20 font-sans">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3 leading-none">
                        <Building2 className="text-red-600" size={32} /> Vendor Matrix
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2 font-mono text-[10px] tracking-widest uppercase leading-none italic">Supply Chain Registry — Global Procurement Nodes</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Supply Nodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all min-w-[250px]"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                    >
                        <Plus size={16} /> Register Vendor
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm animate-pulse min-h-[300px]" />
                    ))
                ) : filteredVendors?.map((v: any) => (
                    <div key={v.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-200 transition-all flex flex-col justify-between min-h-[320px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                            <button onClick={() => { setEditingVendor(v); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg"><Edit size={14} /></button>
                            <button onClick={() => mDeleteVendor.mutate(v.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    {v.category} Node
                                </span>
                                {v.is_active ? <BadgeCheck className="text-emerald-500" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                            </div>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{v.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">GST: {v.gstin || 'UNREGISTERED'}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <Phone size={14} className="text-slate-300" />
                                    {v.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                    <Mail size={14} className="text-slate-300" />
                                    {v.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 italic">Procurement Status: <b>{v.is_active ? 'Active' : 'Blacklisted'}</b></span>
                            <div className="p-2 bg-slate-50 group-hover:bg-red-50 text-slate-300 group-hover:text-red-600 rounded-xl transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                ))}
                {filteredVendors?.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] text-center">
                        <Globe className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Supply Nodes Detected in Registry</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                                    {editingVendor ? 'Reconfigure Supply Node' : 'Register New Vendor Identity'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-600" /></button>
                            </div>
                            <div className="p-10">
                                <form onSubmit={(e: any) => {
                                    e.preventDefault();
                                    const fd = new FormData(e.target);
                                    const data = {
                                        name: fd.get('name'),
                                        category: fd.get('category'),
                                        gstin: fd.get('gstin'),
                                        pan: fd.get('pan'),
                                        email: fd.get('email'),
                                        phone: fd.get('phone'),
                                        office_address: fd.get('address'),
                                        is_active: fd.get('active') === 'on'
                                    };
                                    if (editingVendor) mUpdateVendor.mutate({ ...data, id: editingVendor.id });
                                    else mAddVendor.mutate(data);
                                }} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Vendor Entity Legal Name</label>
                                        <input name="name" required defaultValue={editingVendor?.name} placeholder="Tata Iron & Steel Co." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Supply Category</label>
                                            <select name="category" defaultValue={editingVendor?.category || 'Material'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs">
                                                <option value="Material">Material Supplier</option>
                                                <option value="Service">Service Provider</option>
                                                <option value="Subcontractor">Subcontractor</option>
                                                <option value="Equipment">Equipment Fleet</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">GSTIN Protocol</label>
                                            <input name="gstin" defaultValue={editingVendor?.gstin} placeholder="27AAACXXXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Email Protocol</label>
                                            <input name="email" type="email" defaultValue={editingVendor?.email} placeholder="sales@entity.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Mobile Node</label>
                                            <input name="phone" defaultValue={editingVendor?.phone} placeholder="+91 XXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                        <input name="active" type="checkbox" defaultChecked={editingVendor ? editingVendor.is_active : true} className="w-5 h-5 accent-red-600" />
                                        <label className="text-[10px] font-black text-slate-600 uppercase">Operational Status (Active)</label>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                                        {(mAddVendor.isPending || mUpdateVendor.isPending) ? <Loader2 className="animate-spin mx-auto" /> : editingVendor ? 'Update Supply Node' : 'Initialize Vendor Node'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Vendors;
