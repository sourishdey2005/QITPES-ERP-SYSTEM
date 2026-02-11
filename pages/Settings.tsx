
import React from 'react';
import { Settings as SettingsIcon, User, Building, Shield, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6 page-transition max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Management Console</h1>
        <p className="text-slate-500 text-sm">Configure global enterprise settings and personal profile security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
           {[
             { label: 'General Profile', icon: <User size={18}/>, active: true },
             { label: 'Company Info', icon: <Building size={18}/> },
             { label: 'Security & SSO', icon: <Shield size={18}/> },
             { label: 'Notifications', icon: <Bell size={18}/> },
             { label: 'Data & Export', icon: <Database size={18}/> },
           ].map((item, i) => (
             <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'}`}>
                {item.icon} {item.label}
             </button>
           ))}
        </div>

        <div className="md:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Profile Identity</h3>
                <div className="flex items-center gap-6 mb-8">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200"><User size={40}/></div>
                   <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Upload New Avatar</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input type="text" defaultValue="Abhradeep Hazra" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Email</label>
                      <input type="text" readOnly defaultValue="abhradeep@qitpes.in" className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Enterprise Role</h3>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                   <div>
                      <p className="text-sm font-bold text-blue-900">Owner / CEO Account</p>
                      <p className="text-xs text-blue-700 opacity-80">Full administrative access across all 2026 modules.</p>
                   </div>
                   <Shield className="text-blue-600" size={24} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Update Settings</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
