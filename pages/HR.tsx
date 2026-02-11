
import React from 'react';
import { Users, Calendar, Briefcase, FileCheck, Search, Plus, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const HR: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-slate-900">HR & Workforce</h1>
          <p className="text-slate-500">Employee lifecycle, payroll, attendance, and contractor management.</p>
        </motion.div>
        <div className="flex space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-500 font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={18} className="mr-2" /> Onboard Employee
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Full-time Employees', value: '142', sub: '2 New this month', icon: <Users size={20} /> },
          { label: 'Contractors', value: '42', sub: 'Across 3 sites', icon: <Briefcase size={20} /> },
          { label: 'Attendance', value: '98.4%', sub: 'Last 7 days avg', icon: <Calendar size={20} /> },
          { label: 'Payroll Status', value: 'Verified', sub: 'April Processing', icon: <FileCheck size={20} /> },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <div className="text-blue-500">{stat.icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Search staff..." className="text-sm outline-none w-full" />
          </div>
          <div className="flex items-center space-x-2">
             <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg transition-all"><Filter size={18} /></button>
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-6 py-3 tracking-widest">Employee</th>
                <th className="px-6 py-3 tracking-widest">Department</th>
                <th className="px-6 py-3 tracking-widest">Role</th>
                <th className="px-6 py-3 tracking-widest">Status</th>
                <th className="px-6 py-3 tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Sarah Connor', dept: 'Engineering', role: 'Project Manager', status: 'Active' },
                { name: 'Michael Scott', dept: 'Operations', role: 'Regional Director', status: 'Active' },
                { name: 'Jim Halpert', dept: 'Sales', role: 'Key Account Mgr', status: 'On Leave' },
                { name: 'Pam Beesly', dept: 'HR', role: 'Generalist', status: 'Active' },
              ].map((staff, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  key={i} 
                  className="text-sm hover:bg-slate-50/50 transition-all cursor-default"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 mr-3 flex items-center justify-center font-bold text-slate-400 text-xs">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{staff.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{staff.dept}</td>
                  <td className="px-6 py-4 text-slate-500">{staff.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      staff.status === 'Active' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                    }`}>{staff.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 font-bold text-xs uppercase hover:underline transition-all">Profile</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default HR;
