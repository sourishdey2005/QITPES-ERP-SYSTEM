
import React from 'react';
import { Truck, MapPin, Fuel, ShieldCheck, Activity, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const Fleet: React.FC = () => {
  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet & Fuel Logistics</h1>
          <p className="text-slate-500 text-sm">Monitoring vehicle deployments, routing, and fuel consumption.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md">Add Vehicle</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Fleet', value: '24', icon: <Truck />, color: 'text-blue-600' },
          { label: 'Fuel Consumed (Monthly)', value: '12,400 L', icon: <Fuel />, color: 'text-amber-600' },
          { label: 'Avg Distance/Day', value: '142 KM', icon: <Activity />, color: 'text-green-600' },
          { label: 'Safety Verified', value: '100%', icon: <ShieldCheck />, color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className={`${stat.color} mb-3`}>{stat.icon}</div>
             <p className="text-xs font-bold text-slate-400 uppercase">{stat.label}</p>
             <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Real-time Vehicle Matrix</h3>
            <div className="flex gap-2">
               <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <Search size={14} className="text-slate-400 mr-2" />
                  <input type="text" placeholder="ID / License..." className="text-xs outline-none w-32" />
               </div>
               <button className="p-1.5 border border-slate-200 rounded hover:bg-white text-slate-400"><Filter size={14}/></button>
            </div>
         </div>
         <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4">Vehicle ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Current Location</th>
                  <th className="px-6 py-4">Last Trip</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Efficiency</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
               {[
                  { id: 'MH-12-AX-4042', type: 'Dump Truck', loc: 'Nagpur Site B', trip: '2 hrs ago', status: 'In Transit', eff: '82%' },
                  { id: 'MH-14-BT-9102', type: 'Concrete Mixer', loc: 'Pune Depot', trip: 'Just Finished', status: 'Idle', eff: '94%' },
                  { id: 'MH-01-CV-0012', type: 'Service Van', loc: 'Mumbai HQ', trip: 'Scheduled', status: 'Ready', eff: '100%' },
               ].map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                     <td className="px-6 py-4 font-bold text-slate-900">{v.id}</td>
                     <td className="px-6 py-4 text-slate-500">{v.type}</td>
                     <td className="px-6 py-4 flex items-center gap-1.5 text-slate-700 font-medium"><MapPin size={14} className="text-red-500" /> {v.loc}</td>
                     <td className="px-6 py-4 text-slate-500">{v.trip}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.status === 'In Transit' ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                           {v.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-900 font-bold">{v.eff}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Fleet;
