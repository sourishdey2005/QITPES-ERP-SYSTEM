import React from 'react';
import { GitMerge, Plus, ArrowRight, UserCheck, ShieldAlert, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const WorkflowBuilder: React.FC = () => {
  const mockWorkflows = [
    { id: 1, name: 'Purchase Order Approval (>₹1 Lakh)', module: 'Procurement', steps: 3, status: 'Active' },
    { id: 2, name: 'Leave Request Site Director', module: 'HR', steps: 2, status: 'Active' },
    { id: 3, name: 'Inventory Write-off', module: 'Store', steps: 2, status: 'Inactive' },
  ];

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Engine</h1>
          <p className="text-slate-500">Define multi-level approval chains and automation rules.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">
          <Plus size={18} className="mr-2" /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockWorkflows.map((wf, i) => (
          <motion.div 
            key={wf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <GitMerge size={20} />
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${wf.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {wf.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{wf.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{wf.module}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <UserCheck size={14} className="mr-1.5 text-blue-500" />
                {wf.steps} Level Approval
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
          <Clock size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900">SLA Enforcement Active</h4>
          <p className="text-sm text-amber-700 mt-1">
            Approvals taking longer than 24 hours are automatically escalated to the Site Director's dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;