
import React from 'react';
import { Package, Search, Plus, Filter, ArrowUpRight, ArrowDownRight, MoreVertical, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Inventory: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold text-slate-900">Store & Inventory</h1>
          <p className="text-slate-500">Real-time tracking of assets, materials, and consumables.</p>
        </motion.div>
        <div className="flex space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all"
          >
            Export CSV
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-500 font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={18} className="mr-2" /> Add Item
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total SKU Items', value: '1,284', icon: <Package size={24} />, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Low Stock Alerts', value: '14 Items', icon: <AlertTriangle size={24} />, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Inventory Value', value: '₹2.4 Cr', icon: <ArrowUpRight size={24} />, bg: 'bg-green-50', text: 'text-green-600' }
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-xl border border-slate-200 flex items-center hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${card.bg} ${card.text} rounded-lg flex items-center justify-center mr-4 transition-transform hover:rotate-6`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <h3 className="text-xl font-bold text-slate-900">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
            <Search size={16} className="text-slate-400 mr-2" />
            <input type="text" placeholder="Search by SKU, Name..." className="text-sm outline-none w-full" />
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-lg"><Filter size={18} /></button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Details</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { sku: 'CON-001', name: 'Portland Cement Grade 53', cat: 'Consumables', stock: 450, unit: 'Bags', price: '₹8.50', status: 'Healthy' },
              { sku: 'STL-882', name: 'Reinforced Steel Bar 12mm', cat: 'Construction', stock: 82, unit: 'Rods', price: '₹45.00', status: 'Low Stock' },
              { sku: 'LUB-491', name: 'Heavy Duty Gear Oil (5L)', cat: 'Maintenance', stock: 12, unit: 'Units', price: '₹22.00', status: 'Healthy' },
              { sku: 'GEN-221', name: 'Safety Helmet - High Viz', cat: 'PPE', stock: 120, unit: 'Units', price: '₹12.00', status: 'Healthy' },
            ].map((item, i) => (
              <motion.tr 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                key={i} 
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400 block uppercase">{item.sku}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full font-medium">{item.cat}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-slate-700">{item.stock}</span>
                    <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-bold">{item.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'Healthy' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-all">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Inventory;
