

import React from 'react';
// Fix: Removed non-existent 'Gaps' member from lucide-react
import { Calendar, Clock, ListFilter, Plus, Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Planning: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Planning & Scheduling</h1>
          <p className="text-slate-500 text-sm">Orchestrating 2026 site milestones and resource timelines.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
          <Plus size={18} /> Schedule Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Schedules', value: '24', icon: <Calendar />, color: 'text-blue-600' },
          { label: 'Pending Approvals', value: '8', icon: <Clock />, color: 'text-amber-600' },
          { label: 'Critical Path Items', value: '3', icon: <ListFilter />, color: 'text-red-600' },
          { label: 'Resources Assigned', value: '142', icon: <Plus />, color: 'text-green-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className={`${stat.color} mb-2`}>{stat.icon}</div>
             <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
             <p className="text-xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-64">
             <Search size={16} className="text-slate-400 mr-2" />
             <input type="text" placeholder="Filter timelines..." className="text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-md">Timeline View</button>
            <button className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded-md">List View</button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Task Name</th>
              <th className="px-6 py-4">Site / Project</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { task: 'Foundation Pouring', site: 'Nagpur IT Hub', status: 'In Progress', date: 'Oct 12, 2026', owner: 'R. Sharma' },
              { task: 'Structural Audit', site: 'Pune Logistics', status: 'Pending', date: 'Oct 15, 2026', owner: 'A. Verma' },
              { task: 'Site Mobilization', site: 'Mumbai Port Site', status: 'Completed', date: 'Oct 01, 2026', owner: 'S. Kulkarni' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.task}</td>
                <td className="px-6 py-4 text-slate-500">{row.site}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{row.date}</td>
                <td className="px-6 py-4 text-slate-500">{row.owner}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-blue-600"><ChevronRight size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Planning;
