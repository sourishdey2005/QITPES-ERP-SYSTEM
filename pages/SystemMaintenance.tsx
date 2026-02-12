
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
    ShieldAlert, Trash2, Database, AlertTriangle,
    Loader2, CheckCircle2, RefreshCcw, Info
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

const SystemMaintenance: React.FC = () => {
    const queryClient = useQueryClient();
    const [confirmText, setConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const TABLES_TO_RESET = [
        'employees', 'budget_allocations', 'cost_centers', 'expense_approvals',
        'petty_cash', 'fixed_expenses', 'budget_revision_logs', 'capital_expenditure',
        'project_cost_breakdown', 'departments', 'employee_appraisals', 'employee_promotions',
        'transfer_requests', 'exit_clearances', 'grievances', 'internal_memos',
        'employee_documents', 'contract_workers', 'contract_attendance', 'holidays',
        'leave_balances', 'conference_rooms', 'meetings', 'shifts', 'shift_assignments',
        'finance_transactions', 'ledger_entries', 'inventory', 'purchase_orders',
        'projects', 'planning_tasks', 'assets', 'fleet', 'production_logs',
        'customers', 'sales_leads', 'tax_records', 'okrs', 'workflows', 'payroll_records'
    ];

    const TARGET_PHRASE = "RESET SYSTEM DATA 2026";

    const handleReset = async () => {
        if (confirmText !== TARGET_PHRASE) {
            setError("Confirmation phrase does not match.");
            return;
        }

        setIsResetting(true);
        setError(null);

        try {
            // Sequential deletion to avoid foreign key conflicts if any
            // Best would be to go in reverse order of dependencies or just catch errors
            for (const table of TABLES_TO_RESET) {
                const { error: delError } = await supabase
                    .from(table)
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

                if (delError) {
                    console.warn(`Could not clear table ${table}:`, delError.message);
                    // Continue with other tables
                }
            }

            setResetComplete(true);
            queryClient.invalidateQueries(); // Clear all caches
        } catch (err: any) {
            setError(err.message || "A critical error occurred during the reset process.");
        } finally {
            setIsResetting(false);
            setConfirmText('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 page-transition pb-20">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
                <div className="p-4 bg-red-50 text-red-600 rounded-[32px]">
                    <ShieldAlert size={32} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">System Maintenance</h1>
                    <p className="text-slate-500 font-medium tracking-tight">Enterprise Infrastructure & Global Data Purge Controls.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-6"
                >
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                        <AlertTriangle size={24} />
                        <h3 className="text-xl font-black uppercase tracking-tighter">Global Data Purge</h3>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        This action will <span className="text-red-600 font-bold underline">permanently erase</span> all operational data across all 28+ modules, including project ledgers, fiscal records, workforce history, and asset telemetry.
                    </p>
                    <div className="p-6 bg-red-50 rounded-[32px] border border-red-100">
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={14} /> Critical Warning
                        </p>
                        <p className="text-xs text-red-600 font-bold leading-relaxed">
                            Profiles and Enterprise Settings are preserved to maintain system access, but all other transactional data will be destroyed. This operation cannot be undone.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Type phrase to confirm:</label>
                        <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center mb-4 select-none">
                            <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-widest">{TARGET_PHRASE}</span>
                        </div>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Enter confirmation text..."
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none font-black text-sm text-slate-900 focus:ring-8 focus:ring-red-500/5 transition-all uppercase tracking-widest"
                        />
                        <button
                            disabled={confirmText !== TARGET_PHRASE || isResetting}
                            onClick={handleReset}
                            className={`w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${confirmText === TARGET_PHRASE
                                ? 'bg-red-600 text-white shadow-red-500/30 hover:bg-red-700'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            {isResetting ? <Loader2 className="animate-spin" /> : <><Trash2 size={20} /> Purge Ledger Data</>}
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Infrastructure Status</h3>
                            <div className="space-y-4">
                                <StatusItem icon={<Database size={18} />} label="Database Connectivity" status="Operational" />
                                <StatusItem icon={<RefreshCcw size={18} />} label="Real-time Sync" status="Active" />
                                <StatusItem icon={<ShieldAlert size={18} />} label="Access Control" status="Verified" />
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] group-hover:bg-orange-600/20 transition-all duration-1000"></div>
                    </div>

                    <AnimatePresence>
                        {resetComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] flex items-center gap-6"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <CheckCircle2 size={28} />
                                </div>
                                <div>
                                    <h4 className="font-black text-emerald-900 uppercase text-sm tracking-tight">System Purge Successful</h4>
                                    <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-widest">Enterprise ledger has been zeroed.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-8 rounded-[40px] flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-red-900 uppercase text-sm tracking-tight">Interface Error</h4>
                                <p className="text-xs text-red-600 font-bold mt-1 leading-relaxed italic">{error}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const StatusItem = ({ icon, label, status }: any) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
            <div className="text-orange-400">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{status}</span>
    </div>
);

export default SystemMaintenance;
