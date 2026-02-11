
import React from 'react';
import { Wallet, Landmark, CreditCard, Clock, FileCheck, IndianRupee, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../lib/supabase';

const Payroll: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500 text-sm">Automated salary disbursement and statutory compliance.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-blue-700">
             <Landmark size={18} /> Initiate Pay Cycle
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Upcoming Disbursement</p>
           <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(4850000)}</h3>
           <p className="text-xs text-blue-600 font-bold mt-2">Due in 4 Days (Oct 01)</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Headcount</p>
           <h3 className="text-2xl font-bold text-slate-900">142 Employees</h3>
           <p className="text-xs text-green-600 font-bold mt-2">2 Onboarded this month</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-xs font-bold text-slate-400 uppercase mb-1">Statutory Deductions (EPF/ESI)</p>
           <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(620000)}</h3>
           <p className="text-xs text-slate-500 font-medium mt-2">Compliance Score: 100%</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-800">Pay Status Registry</h3>
           <button className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"><Download size={14}/> Download Reports</button>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Gross Salary</th>
                <th className="px-6 py-4">Net Payable</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[
                { id: 'EMP-101', name: 'Arjun Das', gross: 85000, net: 72000, status: 'Verified' },
                { id: 'EMP-102', name: 'Priya Mehta', gross: 65000, net: 58000, status: 'Pending Approval' },
                { id: 'EMP-103', name: 'Sanjay Gupta', gross: 120000, net: 105000, status: 'Verified' },
              ].map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono font-medium text-slate-400">{emp.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{emp.name}</td>
                  <td className="px-6 py-4 text-slate-500">{formatCurrency(emp.gross)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(emp.net)}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${emp.status === 'Verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {emp.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <button className="text-blue-600 font-bold hover:underline transition-all">View PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Payroll;
