
import React from 'react';
import { ShieldCheck, User, Terminal, Search, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditLogs: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 text-sm">Security-hardened registry of all enterprise interactions.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
           <Download size={16} /> Export Forensic Log
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
               <Terminal size={14} className="text-red-400" />
               <span className="text-red-400">root@qitpes:</span> tail -f audit.log
            </div>
            <div className="flex items-center bg-white/10 border border-white/20 rounded-lg px-3 py-1">
               <Search size={14} className="text-white/40 mr-2" />
               <input type="text" placeholder="Search events..." className="text-xs bg-transparent outline-none text-white placeholder-white/40" />
            </div>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Module Access</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Verification</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
               {[
                  { time: '2026-10-05 14:42:01', user: 'abhradeep@qitpes.in', event: 'INIT_PURCHASE_ORDER', mod: 'PROCUREMENT', ip: '102.42.11.4' },
                  { time: '2026-10-05 14:40:12', user: 'system_root', event: 'TRIGGER_WORKFLOW_LEVEL_2', mod: 'SYSTEM', ip: 'internal' },
                  { time: '2026-10-05 14:38:55', user: 'abhradeep@qitpes.in', event: 'ACCESS_FINANCIAL_LEDGER', mod: 'FINANCE', ip: '102.42.11.4' },
                  { time: '2026-10-05 14:35:01', user: 'hr_director@qitpes.in', event: 'ONBOARD_STAFF_RECORD', mod: 'HRM', ip: '45.12.11.8' },
               ].map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 text-slate-400">{log.time}</td>
                     <td className="px-6 py-4 font-bold text-slate-700">{log.user}</td>
                     <td className="px-6 py-4"><span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{log.event}</span></td>
                     <td className="px-6 py-4 font-bold text-slate-500">{log.mod}</td>
                     <td className="px-6 py-4 text-slate-400">{log.ip}</td>
                     <td className="px-6 py-4 text-right"><ShieldCheck size={14} className="text-green-500 inline" /></td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AuditLogs;
