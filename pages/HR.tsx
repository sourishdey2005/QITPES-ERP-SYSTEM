
import React, { useState } from 'react';
import { Users, Calendar, Briefcase, FileCheck, Search, Plus, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HR: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([
    { name: 'Sarah Connor', dept: 'Engineering', role: 'Project Manager', status: 'Active' },
    { name: 'Michael Scott', dept: 'Operations', role: 'Regional Director', status: 'Active' },
    { name: 'Jim Halpert', dept: 'Sales', role: 'Key Account Mgr', status: 'On Leave' },
    { name: 'Pam Beesly', dept: 'HR', role: 'Generalist', status: 'Active' },
  ]);

  const [formData, setFormData] = useState({ name: '', dept: 'Operations', role: '', status: 'Active' });

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffList([formData, ...staffList]);
    setIsModalOpen(false);
    setFormData({ name: '', dept: 'Operations', role: '', status: 'Active' });
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">HR & Workforce</h1>
          <p className="text-slate-500 text-sm">Employee lifecycle, payroll, attendance, and contractor management.</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={18} className="mr-2" /> Onboard Employee
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Employee Onboarding</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleOnboard} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Rahul Kumar" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
                    <select value={formData.dept} onChange={(e) => setFormData({...formData, dept: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>Engineering</option>
                      <option>Operations</option>
                      <option>Finance</option>
                      <option>HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Designation</label>
                    <input required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Site Engineer" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Generate Employee Profile</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Full-time Employees', value: staffList.length.toString(), sub: 'Active Workforce', icon: <Users size={20} /> },
          { label: 'Contractors', value: '42', sub: 'Across 3 sites', icon: <Briefcase size={20} /> },
          { label: 'Attendance', value: '98.4%', sub: 'Last 7 days avg', icon: <Calendar size={20} /> },
          { label: 'Payroll Status', value: 'Verified', sub: 'May 2026 Processing', icon: <FileCheck size={20} /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <div className="text-blue-500">{stat.icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-xs focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Search staff..." className="text-sm outline-none w-full" />
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg transition-all"><Filter size={18} /></button>
        </div>
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
            {staffList.map((staff, i) => (
              <tr key={i} className="text-sm hover:bg-slate-50/50 transition-all">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HR;
