
import React from 'react';
import { ShoppingCart, FilePlus, Truck, Search, MoreVertical, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../lib/supabase';

const Purchasing: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Management</h1>
          <p className="text-slate-500 text-sm">Centralized procurement and vendor relations portal.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
          <FilePlus size={18} /> New Purchase Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Open PO Value</p>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(4280000)}</h3>
          <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1"><ShoppingCart size={12} /> 12 Pending delivery</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Top Vendor</p>
          <h3 className="text-2xl font-bold text-slate-900">Tata Steel Ltd.</h3>
          <p className="text-xs text-green-600 mt-2 font-medium">Strategic Partner Status</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg. Fulfillment Time</p>
          <h3 className="text-2xl font-bold text-slate-900">4.2 Days</h3>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1"><Truck size={12} /> Fast logistics tier</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Recent Purchase Orders</h3>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
             <Search size={14} className="text-slate-400 mr-2" />
             <input type="text" placeholder="PO#" className="text-xs bg-transparent outline-none py-1" />
          </div>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
             <tr>
               <th className="px-6 py-4">PO Reference</th>
               <th className="px-6 py-4">Vendor</th>
               <th className="px-6 py-4">Items</th>
               <th className="px-6 py-4">Total Amount</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 text-sm">
             {[
               { id: 'PO-26-001', vendor: 'UltraTech Cement', items: 500, amt: 250000, status: 'Shipped' },
               { id: 'PO-26-002', vendor: 'Kamdhenu Steel', items: 120, amt: 1200000, status: 'Draft' },
               { id: 'PO-26-003', vendor: 'Havells India', items: 45, amt: 45000, status: 'Completed' },
             ].map((po, i) => (
               <tr key={i} className="hover:bg-slate-50/50">
                 <td className="px-6 py-4 font-mono font-bold text-blue-600">{po.id}</td>
                 <td className="px-6 py-4 font-medium text-slate-900">{po.vendor}</td>
                 <td className="px-6 py-4 text-slate-500">{po.items} Units</td>
                 <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(po.amt)}</td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${po.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {po.status}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><MoreVertical size={16} /></button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default Purchasing;
