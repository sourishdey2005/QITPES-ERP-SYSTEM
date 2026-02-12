
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
    Calculator, Receipt, Landmark, Scale, BookOpen,
    TrendingUp, ArrowDownLeft, ArrowUpRight, Plus,
    Search, Filter, X, Loader2, Download, CheckCircle2,
    AlertCircle, Calendar, FileText, Lock, Globe, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'journals' | 'ledger' | 'trial-balance' | 'pnl' | 'balance-sheet' | 'reconciliation' | 'arap' | 'closing';

const AccountingHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('journals');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'addJournal' | 'addAccount' | 'bankRec' | 'addYear' | ''>('');
    const queryClient = useQueryClient();

    // Queries
    const { data: accounts, isLoading: loadingAccounts } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: async () => {
            const { data, error } = await supabase.from('chart_of_accounts').select('*').order('code');
            if (error) throw error;
            return data || [];
        }
    });

    const { data: journals, isLoading: loadingJournals } = useQuery({
        queryKey: ['journals'],
        queryFn: async () => {
            const { data, error } = await supabase.from('journal_entries').select('*, journal_lines(*, chart_of_accounts(name))').order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    const { data: fiscalYears, isLoading: loadingYears } = useQuery({
        queryKey: ['fiscal-years'],
        queryFn: async () => {
            const { data, error } = await supabase.from('financial_years').select('*').order('start_date', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // Mutations
    const mAddJournal = useMutation({
        mutationFn: async ({ entry, lines }: any) => {
            // First, resolve/create any accounts that were typed manually and don't have an ID
            const linePromises = lines.map(async (l: any) => {
                if (l.account_id) return l; // Existing account

                // Otherwise, create the new account on the fly
                const { data: newAcc, error: accError } = await supabase
                    .from('chart_of_accounts')
                    .insert([{
                        name: l.account_name,
                        code: l.account_code || `NEW-${Math.floor(Math.random() * 9000) + 1000}`,
                        type: 'Asset', // Default to Asset, user can re-categorize from Ledger later
                        category: 'Current Asset'
                    }])
                    .select()
                    .single();

                if (accError) throw accError;
                return { ...l, account_id: newAcc.id };
            });

            const resolvedLines = await Promise.all(linePromises);

            // Now insert the journal entry
            const { data: journal, error: jError } = await supabase.from('journal_entries').insert([entry]).select().single();
            if (jError) throw jError;

            const formattedLines = resolvedLines.map((l: any) => ({
                journal_id: journal.id,
                account_id: l.account_id,
                debit: l.debit,
                credit: l.credit
            }));

            const { error: lError } = await supabase.from('journal_lines').insert(formattedLines);
            if (lError) throw lError;

            return journal;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journals'] });
            queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            alert(`Execution Error: ${error.message || 'Transaction failed'}`);
        }
    });

    const mCloseYear = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('financial_years').update({
                is_closed: true,
                closed_at: new Date().toISOString()
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiscal-years'] })
    });

    const mAddYear = useMutation({
        mutationFn: async (year: any) => {
            const { error } = await supabase.from('financial_years').insert([year]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
            setIsModalOpen(false);
            alert('Financial Year successfully initialized in the system.');
        },
        onError: (error: any) => {
            alert(`Initialization Failed: ${error.message || 'Check database connection'}`);
        }
    });

    if (loadingAccounts || loadingJournals || loadingYears) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-8 page-transition">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Finance & Accounting Hub</h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Global Enterprise Fiscal Controls & Real-time Audit Node.</p>
                </div>
                <div className="flex flex-wrap bg-slate-100/50 p-1.5 rounded-[24px] border border-slate-200">
                    {(['journals', 'ledger', 'trial-balance', 'pnl', 'balance-sheet', 'reconciliation', 'arap', 'closing'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-black">

                    {activeTab === 'journals' && <JournalsTab journals={journals} canAdd={fiscalYears && fiscalYears.length > 0} onAdd={() => { setModalType('addJournal'); setIsModalOpen(true); }} />}
                    {activeTab === 'ledger' && <GeneralLedgerTab journals={journals} />}
                    {activeTab === 'trial-balance' && <TrialBalanceTab accounts={accounts} />}
                    {activeTab === 'pnl' && <PNLTab accounts={accounts} />}
                    {activeTab === 'balance-sheet' && <BalanceSheetTab accounts={accounts} />}
                    {activeTab === 'reconciliation' && <ReconciliationTab journals={journals} />}
                    {activeTab === 'arap' && <ARAPTab accounts={accounts} />}
                    {activeTab === 'closing' && <ClosingTab years={fiscalYears} onAdd={() => { setModalType('addYear'); setIsModalOpen(true); }} onClose={(id: string) => mCloseYear.mutate(id)} />}

                </motion.div>
            </AnimatePresence>

            {/* MODAL SYSTEM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                    {modalType === 'addJournal' ? 'Fiscal Execution Command' : 'Period Initialization'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 p-3 hover:bg-slate-50 rounded-full transition-all shadow-sm"><X size={24} /></button>
                            </div>
                            <div className="p-12 space-y-6">
                                {isModalOpen && modalType === 'addJournal' && (
                                    <AddJournalForm accounts={accounts || []} years={fiscalYears || []} onAdd={(v: any) => mAddJournal.mutate(v)} isLoading={mAddJournal.isPending} />
                                )}
                                {isModalOpen && modalType === 'addYear' && (
                                    <AddYearForm onAdd={(v: any) => mAddYear.mutate(v)} isLoading={mAddYear.isPending} />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUB-COMPONENTS ---

function GeneralLedgerTab({ journals }: any) {
    const allLines = journals?.flatMap((j: any) => j.journal_lines?.map((l: any) => ({ ...l, date: j.date, reference: j.reference_no, desc: j.description })) || []) || [];
    const [search, setSearch] = useState('');

    const filtered = allLines.filter((l: any) =>
        l.chart_of_accounts?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.reference?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4 bg-white border border-slate-200 px-4 py-2 rounded-2xl w-full max-w-sm shadow-inner">
                    <Search size={18} className="text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Ledger Node..." className="outline-none text-sm w-full font-medium" />
                </div>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-10 py-5">Date</th>
                        <th className="px-10 py-5">Reference</th>
                        <th className="px-10 py-5">Account Head</th>
                        <th className="px-10 py-5 text-right">Debit</th>
                        <th className="px-10 py-5 text-right">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((l: any) => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-10 py-4 text-[10px] font-bold text-slate-400">{new Date(l.date).toLocaleDateString()}</td>
                            <td className="px-10 py-4 font-black text-slate-400 text-[10px] uppercase">{l.reference}</td>
                            <td className="px-10 py-4 font-black text-slate-900 text-xs uppercase">{l.chart_of_accounts?.name}</td>
                            <td className="px-10 py-4 text-right font-black text-xs">{l.debit > 0 ? formatCurrency(l.debit) : ''}</td>
                            <td className="px-10 py-4 text-right font-black text-xs text-red-600">{l.credit > 0 ? formatCurrency(l.credit) : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function JournalsTab({ journals, onAdd, canAdd }: any) {
    return (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Double-Entry Journal Logs</h3>
                <button
                    onClick={() => canAdd ? onAdd() : alert('Set up at least one Financial Year first.')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canAdd ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    <Plus size={16} /> New Journal Entry
                </button>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-10 py-5">Date</th>
                        <th className="px-10 py-5">Ref / Description</th>
                        <th className="px-10 py-5">Particulars (Dr/Cr)</th>
                        <th className="px-10 py-5 text-right">Debit</th>
                        <th className="px-10 py-5 text-right">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    {journals?.map((j: any) => (
                        <React.Fragment key={j.id}>
                            <tr className="border-t border-slate-100">
                                <td className="px-10 py-5 font-bold text-slate-500 text-[10px]">{new Date(j.date).toLocaleDateString()}</td>
                                <td className="px-10 py-5">
                                    <p className="font-black text-slate-900 text-xs uppercase">{j.reference_no}</p>
                                    <p className="text-[10px] text-slate-400 italic">{j.description}</p>
                                </td>
                                <td colSpan={3}></td>
                            </tr>
                            {j.journal_lines?.map((l: any) => (
                                <tr key={l.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50/50">
                                    <td></td>
                                    <td></td>
                                    <td className="px-10 py-2.5">
                                        <span className={`text-[10px] font-black uppercase ${l.debit > 0 ? 'text-slate-900' : 'text-slate-500 pl-8'}`}>
                                            {l.chart_of_accounts?.name}
                                        </span>
                                    </td>
                                    <td className="px-10 py-2.5 text-right font-black text-xs">{l.debit > 0 ? formatCurrency(l.debit) : ''}</td>
                                    <td className="px-10 py-2.5 text-right font-black text-xs text-red-600">{l.credit > 0 ? formatCurrency(l.credit) : ''}</td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TrialBalanceTab({ accounts }: any) {
    // Note: In real app, TB is sums of dr/cr by account. Here we sum current balances for simplicity.
    const totals = accounts?.reduce((acc: any, curr: any) => {
        if (curr.type === 'Asset' || curr.type === 'Expense') acc.debit += (curr.balance || 0);
        else acc.credit += (curr.balance || 0);
        return acc;
    }, { debit: 0, credit: 0 }) || { debit: 0, credit: 0 };

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                <div>
                    <h3 className="font-black uppercase tracking-widest text-lg">Trial Balance</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-tighter">Global Accounts Reconciliation Engine</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-50 mb-1">Total Integrity Status</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${Math.abs(totals.debit - totals.credit) < 0.01 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {Math.abs(totals.debit - totals.credit) < 0.01 ? 'Balanced' : 'Imbalance Detected'}
                    </span>
                </div>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-10 py-5">Code</th>
                        <th className="px-10 py-5">Account Head</th>
                        <th className="px-10 py-5 text-right">Debit (₹)</th>
                        <th className="px-10 py-5 text-right">Credit (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts?.map((a: any) => (
                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-10 py-4 font-black text-slate-400 text-xs">{a.code}</td>
                            <td className="px-10 py-4 font-black text-slate-900 text-xs uppercase">{a.name}</td>
                            <td className="px-10 py-4 text-right font-black text-xs">{(a.type === 'Asset' || a.type === 'Expense') ? formatCurrency(a.balance || 0) : ''}</td>
                            <td className="px-10 py-4 text-right font-black text-xs text-red-600">{(a.type !== 'Asset' && a.type !== 'Expense') ? formatCurrency(a.balance || 0) : ''}</td>
                        </tr>
                    ))}
                    <tr className="bg-slate-50/50 font-black">
                        <td colSpan={2} className="px-10 py-6 text-right uppercase tracking-[0.2em] text-slate-400 text-xs">Integrity Totals</td>
                        <td className="px-10 py-6 text-right text-slate-900 border-t-2 border-slate-900">{formatCurrency(totals.debit)}</td>
                        <td className="px-10 py-6 text-right text-red-600 border-t-2 border-red-600">{formatCurrency(totals.credit)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function PNLTab({ accounts }: any) {
    const income = accounts?.filter((a: any) => a.type === 'Income') || [];
    const expenses = accounts?.filter((a: any) => a.type === 'Expense') || [];
    const totalIncome = income.reduce((s: any, a: any) => s + (a.balance || 0), 0);
    const totalExpense = expenses.reduce((s: any, a: any) => s + (a.balance || 0), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Revenues</h4>
                    <ArrowDownLeft className="text-emerald-500" />
                </div>
                <div className="p-10 space-y-4">
                    {income.map((a: any) => (
                        <div key={a.id} className="flex justify-between items-center py-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.name}</span>
                            <span className="font-black text-slate-900">{formatCurrency(a.balance)}</span>
                        </div>
                    ))}
                    <div className="border-t pt-6 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 uppercase">Gross Revenue</span>
                        <span className="text-xl font-black text-emerald-600">{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Operating Costs</h4>
                    <ArrowUpRight className="text-red-500" />
                </div>
                <div className="p-10 space-y-4">
                    {expenses.map((a: any) => (
                        <div key={a.id} className="flex justify-between items-center py-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.name}</span>
                            <span className="font-black text-slate-900">{formatCurrency(a.balance)}</span>
                        </div>
                    ))}
                    <div className="border-t pt-6 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 uppercase">Total Overhead</span>
                        <span className="text-xl font-black text-red-600">{formatCurrency(totalExpense)}</span>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[56px] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-slate-900/40 border border-white/10">
                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">Net Enterprise Surplus / Deficit</h2>
                <span className={`text-6xl font-black tracking-tighter ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(totalIncome - totalExpense)}
                </span>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Real-time Adjusted Profitability Node</p>
            </div>
        </div>
    );
}

function BalanceSheetTab({ accounts }: any) {
    const assets = accounts?.filter((a: any) => a.type === 'Asset') || [];
    const liabilities = accounts?.filter((a: any) => a.type === 'Liability') || [];
    const equity = accounts?.filter((a: any) => a.type === 'Equity') || [];

    const totalAssets = assets.reduce((s: any, a: any) => s + (a.balance || 0), 0);
    const totalLiaEq = liabilities.reduce((s: any, a: any) => s + (a.balance || 0), 0) + equity.reduce((s: any, a: any) => s + (a.balance || 0), 0);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[48px] border border-slate-200">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 border-b pb-4">Corporate Assets</h4>
                    <div className="space-y-4">
                        {assets.map((a: any) => (
                            <div key={a.id} className="flex justify-between py-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.name}</span>
                                <span className="font-black text-slate-900">{formatCurrency(a.balance)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[48px] border border-slate-200">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 border-b pb-4">Liabilities</h4>
                        <div className="space-y-4">
                            {liabilities.map((a: any) => (
                                <div key={a.id} className="flex justify-between py-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.name}</span>
                                    <span className="font-black text-slate-900">{formatCurrency(a.balance)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-10 rounded-[48px] border border-slate-200">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 border-b pb-4">Equity & Reserves</h4>
                        <div className="space-y-4">
                            {equity.map((a: any) => (
                                <div key={a.id} className="flex justify-between py-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{a.name}</span>
                                    <span className="font-black text-slate-900">{formatCurrency(a.balance)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex bg-slate-50 p-2 rounded-[32px] border border-slate-200 overflow-hidden">
                <div className="flex-1 p-10 flex flex-col items-center justify-center border-r border-slate-200 bg-white">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Assets</span>
                    <span className="text-4xl font-black text-slate-900">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="flex-1 p-10 flex flex-col items-center justify-center bg-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Liabilities + Equity</span>
                    <span className="text-4xl font-black text-slate-900">{formatCurrency(totalLiaEq)}</span>
                </div>
            </div>
        </div>
    );
}

function ReconciliationTab({ journals }: any) {
    // Collect all journal lines for bank accounts (simplified as 'Cash' or 'Bank' in name)
    const bankLines = journals?.flatMap((j: any) => j.journal_lines?.filter((l: any) => l.chart_of_accounts?.name?.toLowerCase().includes('bank') || l.chart_of_accounts?.name?.toLowerCase().includes('cash')) || []) || [];

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Bank Reconciliation Terminal</h3>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-10 py-5">Date</th>
                        <th className="px-10 py-5">Account</th>
                        <th className="px-10 py-5">Tx Amount</th>
                        <th className="px-10 py-5">Recon Status</th>
                        <th className="px-10 py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bankLines.map((l: any) => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                            <td className="px-10 py-4 text-[10px] font-bold text-slate-400">{new Date(l.created_at).toLocaleDateString()}</td>
                            <td className="px-10 py-4 font-black text-slate-900 text-xs uppercase">{l.chart_of_accounts?.name}</td>
                            <td className="px-10 py-4 font-black text-xs">
                                {l.debit > 0 ? <span className="text-emerald-600">+{formatCurrency(l.debit)}</span> : <span className="text-red-600">-{formatCurrency(l.credit)}</span>}
                            </td>
                            <td className="px-10 py-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${l.is_reconciled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {l.is_reconciled ? 'Reconciled' : 'Pending Verification'}
                                </span>
                            </td>
                            <td className="px-10 py-4 text-right">
                                {!l.is_reconciled && <button className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all"><CheckCircle2 size={14} /></button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ARAPTab({ accounts }: any) {
    const ar = accounts?.filter((a: any) => a.category === 'Current Asset' && a.name.includes('Account Receivable')) || [];
    const ap = accounts?.filter((a: any) => a.category === 'Current Liability' && a.name.includes('Account Payable')) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-blue-50/30 flex items-center gap-4">
                    <ArrowDownLeft className="text-blue-600" />
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Accounts Receivable (AR)</h4>
                </div>
                <div className="p-10 space-y-4">
                    {ar.map((a: any) => (
                        <div key={a.id} className="flex justify-between py-4 border-b border-slate-50 border-dashed">
                            <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase mb-1">{a.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Global Customer Ledger</p>
                            </div>
                            <span className="font-black text-blue-600">{formatCurrency(a.balance)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-red-50/30 flex items-center gap-4">
                    <ArrowUpRight className="text-red-600" />
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Accounts Payable (AP)</h4>
                </div>
                <div className="p-10 space-y-4">
                    {ap.map((a: any) => (
                        <div key={a.id} className="flex justify-between py-4 border-b border-slate-50 border-dashed">
                            <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase mb-1">{a.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Primary Vendor Ledger</p>
                            </div>
                            <span className="font-black text-red-600">{formatCurrency(a.balance)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ClosingTab({ years, onClose, onAdd }: any) {
    return (
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[56px] border border-slate-200 space-y-8">
            <div className="flex items-center justify-between border-b pb-8">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-900 text-white rounded-[24px]">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Manual Closure Engine</h3>
                        <p className="text-slate-500 text-sm font-medium tracking-tight italic">Initiate cryptographic period locking & system zeroing.</p>
                    </div>
                </div>
                <button onClick={onAdd} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">
                    <Plus size={16} /> Initialize New Period
                </button>
            </div>
            <div className="space-y-4">
                {years?.map((y: any) => (
                    <div key={y.id} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-black text-slate-900 uppercase text-lg">{y.year_label}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {new Date(y.start_date).toLocaleDateString()} — {new Date(y.end_date).toLocaleDateString()}
                            </p>
                        </div>
                        {y.is_closed ? (
                            <span className="flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={14} /> Closed: {new Date(y.closed_at).toLocaleDateString()}
                            </span>
                        ) : (
                            <button
                                onClick={() => { if (confirm('Initiate final closing for this financial year?')) onClose(y.id); }}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-300"
                            >
                                Execute Closing
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- MODAL FORMS ---

function AddYearForm({ onAdd, isLoading }: any) {
    const [year, setYear] = useState({ year_label: `FY ${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`, start_date: `${new Date().getFullYear()}-04-01`, end_date: `${new Date().getFullYear() + 1}-03-31` });

    return (
        <div className="space-y-6">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fiscal Year Label</label>
                <input value={year.year_label} onChange={e => setYear({ ...year, year_label: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" placeholder="e.g. FY 2026-27" />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Period Start</label>
                    <input type="date" value={year.start_date} onChange={e => setYear({ ...year, start_date: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Period End</label>
                    <input type="date" value={year.end_date} onChange={e => setYear({ ...year, end_date: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" />
                </div>
            </div>
            <button
                disabled={isLoading}
                onClick={() => onAdd(year)}
                className={`w-full py-5 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-black shadow-slate-300'}`}
            >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Authorize New Fiscal Period'}
            </button>
        </div>
    );
}

function AddJournalForm({ accounts, years, onAdd, isLoading }: any) {
    const [entry, setEntry] = useState({
        reference_no: `JV-2026-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        financial_year_id: years?.[0]?.id || ''
    });

    // Sync financial_year_id if years change (e.g. first year added)
    useEffect(() => {
        if (!entry.financial_year_id && years?.[0]?.id) {
            setEntry(prev => ({ ...prev, financial_year_id: years[0].id }));
        }
    }, [years]);

    const [lines, setLines] = useState([{ account_id: '', account_code: '', account_name: '', debit: 0, credit: 0 }, { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0 }]);

    const addLine = () => setLines([...lines, { account_id: '', account_code: '', account_name: '', debit: 0, credit: 0 }]);
    const updateLine = (idx: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[idx] = { ...newLines[idx], [field]: value };
        setLines(newLines);
    };

    const totalDr = lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCr = lines.reduce((s, l) => s + Number(l.credit), 0);
    const isBalanced = Math.abs(totalDr - totalCr) < 0.01 && totalDr > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reference ID</label>
                    <input value={entry.reference_no} onChange={e => setEntry({ ...entry, reference_no: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Transaction Date</label>
                    <input type="date" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" />
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Narrative Description</label>
                <textarea value={entry.description} onChange={e => setEntry({ ...entry, description: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none h-20" placeholder="Purpose of this entry..." />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                    <span className="w-24">Acc No.</span>
                    <span className="flex-1 ml-4">Account Head</span>
                    <span className="w-32 text-right mr-4">Debit (Dr)</span>
                    <span className="w-32 text-right">Credit (Cr)</span>
                    <span className="w-10"></span>
                </div>
                {lines.map((line, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                        <input
                            placeholder="ID..."
                            value={line.account_code}
                            onChange={e => {
                                const val = e.target.value;
                                updateLine(idx, 'account_code', val);
                                const matched = accounts?.find((a: any) => a.code === val);
                                if (matched) {
                                    updateLine(idx, 'account_id', matched.id);
                                    updateLine(idx, 'account_name', matched.name);
                                }
                            }}
                            className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none"
                        />
                        <div className="flex-1 relative">
                            <input
                                list={`accounts-${idx}`}
                                value={line.account_name}
                                placeholder="Type Account (Old or New)..."
                                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold outline-none border-dashed hover:border-blue-300 transition-all text-blue-600"
                                onChange={e => {
                                    const val = e.target.value;
                                    const matched = accounts?.find((a: any) => `${a.code} - ${a.name}` === val || a.name === val || a.code === val);
                                    if (matched) {
                                        updateLine(idx, 'account_id', matched.id);
                                        updateLine(idx, 'account_name', matched.name);
                                        updateLine(idx, 'account_code', matched.code);
                                    } else {
                                        updateLine(idx, 'account_id', '');
                                        updateLine(idx, 'account_name', val);
                                    }
                                }}
                            />
                            <datalist id={`accounts-${idx}`}>
                                {accounts?.map((a: any) => (
                                    <option key={a.id} value={`${a.code} - ${a.name}`} />
                                ))}
                            </datalist>
                        </div>
                        <input type="number" placeholder="0" value={line.debit || ''} onChange={e => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)} className="w-32 p-3 bg-white border border-slate-200 rounded-xl text-right font-black text-xs" />
                        <input type="number" placeholder="0" value={line.credit || ''} onChange={e => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)} className="w-32 p-3 bg-white border border-slate-200 rounded-xl text-right font-black text-xs text-red-600" />
                    </div>
                ))}
                <button onClick={addLine} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:text-blue-800 transition-all">
                    <Plus size={14} /> Add Additional Node
                </button>
            </div>

            <div className="p-6 bg-slate-900 rounded-[32px] text-white flex justify-between items-center">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Balance Summary</p>
                    <div className="flex gap-8">
                        <div><p className="text-[8px] font-bold opacity-50 uppercase">Total Dr</p><p className="font-black">{formatCurrency(totalDr)}</p></div>
                        <div><p className="text-[8px] font-bold opacity-50 uppercase">Total Cr</p><p className="font-black text-red-400">{formatCurrency(totalCr)}</p></div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        disabled={!isBalanced || isLoading || !entry.financial_year_id}
                        onClick={() => onAdd({ entry, lines: lines.filter(l => l.account_id !== '' || l.account_name !== '') })}
                        className={`px-10 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${isBalanced && !isLoading && entry.financial_year_id ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> :
                            !entry.financial_year_id ? 'No Financial Year' :
                                Math.abs(totalDr - totalCr) >= 0.01 ? 'Unbalanced' :
                                    totalDr === 0 ? 'Zero Amount' : 'Authorize Entry'}
                    </button>
                    {!entry.financial_year_id && <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">Setup a Financial Year in the "Closing" tab first!</p>}
                </div>
            </div>
        </div>
    );
}

export default AccountingHub;
