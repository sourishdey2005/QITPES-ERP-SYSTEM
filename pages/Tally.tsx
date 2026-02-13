
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Calculator, Receipt, Landmark, Search, Filter,
    Download, Loader2, ArrowUpRight, ArrowDownLeft,
    ShoppingCart, Coins, Wallet, History, Calendar,
    TrendingUp, TrendingDown, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const Tally: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'purchase' | 'sales' | 'wage' | 'journal'>('all');

    // 1. Fetch Purchases
    const { data: purchases } = useQuery({
        queryKey: ['tally-purchases'],
        queryFn: async () => {
            const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(p => ({
                id: p.id,
                date: p.created_at,
                type: 'purchase',
                reference: p.po_number,
                description: `Purchase from ${p.vendor_name}`,
                amount: p.total_amount,
                impact: 'debit'
            }));
        }
    });

    // 2. Fetch Sales/Income from finance_transactions
    const { data: sales } = useQuery({
        queryKey: ['tally-sales'],
        queryFn: async () => {
            const { data, error } = await supabase.from('finance_transactions').select('*').eq('type', 'income').order('date', { ascending: false });
            if (error) throw error;
            return data.map(s => ({
                id: s.id,
                date: s.date,
                type: 'sales',
                reference: s.id.slice(0, 8).toUpperCase(),
                description: s.description || 'Service/Product Sales',
                amount: s.amount,
                impact: 'credit'
            }));
        }
    });

    // 3. Fetch Wages from contract_attendance
    const { data: wages } = useQuery({
        queryKey: ['tally-wages'],
        queryFn: async () => {
            const { data: attendance, error } = await supabase
                .from('contract_attendance')
                .select('*, contract_workers(full_name, daily_wage)')
                .eq('status', 'Present');
            if (error) throw error;

            // Aggregate by worker/date or just raw list? Tally usually shows per-transaction.
            return attendance.map(a => ({
                id: a.id,
                date: a.attendance_date,
                type: 'wage',
                reference: `WAGE-${a.attendance_date}`,
                description: `Wage for ${a.contract_workers?.full_name}`,
                amount: a.contract_workers?.daily_wage || 0,
                impact: 'debit'
            }));
        }
    });

    // 4. Combine all records
    const allRecords = useMemo(() => {
        const combined = [
            ...(purchases || []),
            ...(sales || []),
            ...(wages || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return combined.filter(r => {
            const matchesSearch = r.description.toLowerCase().includes(search.toLowerCase()) ||
                r.reference.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filterType === 'all' || r.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [purchases, sales, wages, search, filterType]);

    const stats = useMemo(() => {
        return {
            totalSales: (sales || []).reduce((acc, curr) => acc + curr.amount, 0),
            totalPurchases: (purchases || []).reduce((acc, curr) => acc + curr.amount, 0),
            totalWages: (wages || []).reduce((acc, curr) => acc + curr.amount, 0),
        };
    }, [purchases, sales, wages]);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(allRecords);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tally_Records");
        XLSX.writeFile(wb, "QITPES_Tally_Report.xlsx");
    };

    return (
        <div className="space-y-8 page-transition text-black">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <Calculator className="text-red-600" size={32} /> Tally Operations Registry
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1">Unified fiscal log: Purchases, Sales, and Wage Disbursements.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all">
                        <Download size={16} /> Export Tally
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                        <TrendingUp size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Sales</span>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalSales)}</h3>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                        <TrendingDown size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Purchases</span>
                    </div>
                    <h3 className="text-2xl font-black text-rose-600">{formatCurrency(stats.totalPurchases)}</h3>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                        <Coins size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Wage Outflow</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalWages)}</h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-red-400 mb-4">
                            <Layers size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Net Position</span>
                        </div>
                        <h3 className="text-2xl font-black text-white">{formatCurrency(stats.totalSales - stats.totalPurchases - stats.totalWages)}</h3>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-600/20 blur-3xl rounded-full" />
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-3 rounded-2xl w-full max-w-md shadow-inner">
                        <Search size={18} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by Vendor, Worker or Reference..."
                            className="outline-none text-xs w-full font-black uppercase tracking-tighter"
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2x border border-slate-200 gap-1 overflow-x-auto no-scrollbar">
                        {(['all', 'sales', 'purchase', 'wage'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                            <tr>
                                <th className="px-10 py-6">Date Node</th>
                                <th className="px-10 py-6">Reference ID</th>
                                <th className="px-10 py-6">Operational Ledger</th>
                                <th className="px-10 py-6">Impact Node</th>
                                <th className="px-10 py-6 text-right">Debit / Credit (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <History size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold italic">No financial nodes found matching your query.</p>
                                    </td>
                                </tr>
                            ) : allRecords.map((r: any) => (
                                <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={14} className="text-slate-300" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(r.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 tracking-tighter uppercase">{r.reference}</span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${r.type === 'purchase' ? 'bg-amber-50 text-amber-600' :
                                                    r.type === 'sales' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-blue-50 text-blue-600'
                                                }`}>
                                                {r.type === 'purchase' ? <ShoppingCart size={16} /> :
                                                    r.type === 'sales' ? <ArrowUpRight size={16} /> :
                                                        <Coins size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{r.description}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.type} operation</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            {r.impact === 'debit' ? (
                                                <>
                                                    <ArrowDownLeft size={14} className="text-rose-500" />
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Outflow</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowUpRight size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Inflow</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-10 py-6 text-right font-black text-sm tracking-tighter ${r.impact === 'debit' ? 'text-slate-900' : 'text-emerald-600'}`}>
                                        {r.impact === 'debit' ? `- ${formatCurrency(r.amount)}` : `+ ${formatCurrency(r.amount)}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Tally;
