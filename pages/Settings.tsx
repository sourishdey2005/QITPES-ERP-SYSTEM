
import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Building, Shield, Bell, Database, 
  CheckCircle2, Mail, Phone, MapPin, Globe, Lock, Key, ShieldCheck, 
  Download, Trash2, Save, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

type SettingTab = 'General Profile' | 'Company Info' | 'Security & SSO' | 'Notifications' | 'Data & Export';

const Settings: React.FC = () => {
  const { role: userRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('General Profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="space-y-6 page-transition max-w-5xl mx-auto pb-20 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Management Console</h1>
          <p className="text-slate-500 text-sm">Configure global enterprise settings and account security.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          {isSaving ? 'Synchronizing...' : 'Save Global Config'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
           {[
             { label: 'General Profile', icon: <User size={18}/> },
             { label: 'Company Info', icon: <Building size={18}/> },
             { label: 'Security & SSO', icon: <Shield size={18}/> },
             { label: 'Notifications', icon: <Bell size={18}/> },
             { label: 'Data & Export', icon: <Database size={18}/> },
           ].map((item) => (
             <button 
               key={item.label}
               onClick={() => setActiveTab(item.label as SettingTab)}
               className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                 activeTab === item.label 
                   ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                   : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-200'
               }`}
             >
                {item.icon} {item.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
           <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[500px]">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   transition={{ duration: 0.2 }}
                 >
                    {activeTab === 'General Profile' && (
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-6">Enterprise Identity</h3>
                          <div className="flex items-center gap-8 mb-10">
                             <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                                <User size={48}/>
                             </div>
                             <div className="space-y-2">
                                <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Update Avatar</button>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">PNG or JPG. Max 2MB.</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <InputGroup label="System Display Name" defaultValue="Abhradeep Hazra" icon={<User size={14}/>} />
                             <InputGroup label="Work Email Registry" defaultValue={user?.email || "abhradeep@qitpes.in"} icon={<Mail size={14}/>} readOnly />
                             <InputGroup label="Contact Number" defaultValue="+91 98765 43210" icon={<Phone size={14}/>} />
                             <InputGroup label="Designated Office" defaultValue="Pune Headquarters" icon={<MapPin size={14}/>} />
                          </div>
                        </div>

                        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-[24px] flex items-center justify-between">
                           <div>
                              <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Verified System Role</p>
                              <p className="text-sm font-bold text-blue-700 mt-0.5">{userRole?.toUpperCase()} ACCESS LEVEL</p>
                           </div>
                           <ShieldCheck className="text-blue-600" size={32} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'Company Info' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Corporate Registry</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <InputGroup label="Company Legal Name" defaultValue="QITPES International Pvt Ltd" />
                           <InputGroup label="GSTIN Identity" defaultValue="27AAACQ1234F1Z5" />
                           <InputGroup label="Company PAN" defaultValue="AAACQ1234F" />
                           <InputGroup label="Corporate Website" defaultValue="www.qitpes.erp" icon={<Globe size={14}/>} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Address</label>
                           <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-bold min-h-[100px]" defaultValue="IT Park, Site 4, Phase 2, Hinjewadi, Pune, Maharashtra 411057" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'Security & SSO' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Security Hardening</h3>
                        <div className="space-y-6">
                           <div className="p-6 border border-slate-100 rounded-3xl space-y-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <Lock className="text-slate-400" />
                                    <p className="text-sm font-bold text-slate-700">Multi-Factor Authentication (MFA)</p>
                                 </div>
                                 <Toggle checked />
                              </div>
                              <p className="text-xs text-slate-400 font-medium">Add an extra layer of security to your site accounts using mobile TOTP.</p>
                           </div>

                           <div className="p-6 border border-slate-100 rounded-3xl space-y-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <Key className="text-slate-400" />
                                    <p className="text-sm font-bold text-slate-700">Biometric SSO Login</p>
                                 </div>
                                 <Toggle />
                              </div>
                              <p className="text-xs text-slate-400 font-medium">Allow fingerprint or facial recognition for 2026 registry access.</p>
                           </div>

                           <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Change Portal Password →</button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Notifications' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Intelligence Alerts</h3>
                        <div className="space-y-1">
                           <NotificationItem label="Financial Disbursements" description="Alert when payroll or vendor payments are authorized." />
                           <NotificationItem label="Site Milestones" description="Notifications for planning and schedule shifts." />
                           <NotificationItem label="Inventory Shortages" description="Alert when SKUs fall below reorder thresholds." />
                           <NotificationItem label="Machinery Telemetry" description="Downtime or fuel alerts for heavy equipment." />
                        </div>
                      </div>
                    )}

                    {activeTab === 'Data & Export' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Data Portability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <ExportCard title="Full Audit Ledger" format="PDF / XLSX" icon={<Download />} />
                           <ExportCard title="HR Payroll History" format="CSV" icon={<Download />} />
                           <ExportCard title="Project Site Registry" format="JSON" icon={<Download />} />
                           <ExportCard title="Fleet Maintenance Logs" format="PDF" icon={<Download />} />
                        </div>
                        
                        <div className="pt-10 border-t border-slate-100">
                           <h4 className="text-red-600 font-bold text-sm uppercase tracking-widest mb-4">Danger Zone</h4>
                           <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                              <Trash2 size={14}/> Terminate Enterprise Node
                           </button>
                        </div>
                      </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InputGroup = ({ label, defaultValue, icon, readOnly }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input 
        readOnly={readOnly}
        defaultValue={defaultValue}
        className={`w-full ${icon ? 'pl-9' : 'px-4'} p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
      />
    </div>
  </div>
);

const Toggle = ({ checked }: { checked?: boolean }) => (
  <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </div>
);

const NotificationItem = ({ label, description }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50">
    <div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-400 font-medium">{description}</p>
    </div>
    <Toggle checked />
  </div>
);

const ExportCard = ({ title, format, icon }: any) => (
  <div className="p-6 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-200 transition-all group cursor-pointer">
    <div>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase">{format}</p>
    </div>
    <div className="text-slate-300 group-hover:text-blue-600 transition-colors">{icon}</div>
  </div>
);

export default Settings;
