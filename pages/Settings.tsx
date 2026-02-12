
import React, { useState } from 'react';
import { 
  User, Building, Shield, Bell, Database, 
  CheckCircle2, Mail, Phone, MapPin, Globe, Lock, Key, ShieldCheck, 
  Download, Trash2, Save, Loader2, CreditCard, Cloud, Terminal, 
  ShieldAlert, Fingerprint, Eye, EyeOff
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

const motion = motionBase as any;

type SettingTab = 'General Profile' | 'Company Info' | 'Security & SSO' | 'Notifications' | 'Data & Export';

const Settings: React.FC = () => {
  const { role: userRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('General Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1200);
  };

  return (
    <div className="space-y-8 page-transition max-w-6xl mx-auto pb-24 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enterprise Workspace Config</h1>
          <p className="text-slate-500 text-sm font-medium">Manage corporate identity, security thresholds, and data portability.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          {isSaving ? 'Synchronizing Node...' : 'Commit Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
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
               className={`w-full flex items-center justify-between px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                 activeTab === item.label 
                   ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20 translate-x-2' 
                   : 'text-slate-400 hover:bg-white border border-transparent hover:border-slate-100 hover:text-slate-600'
               }`}
             >
                <div className="flex items-center gap-4">{item.icon} {item.label}</div>
                {activeTab === item.label && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
           <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm min-h-[650px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.3 }}
                 >
                    {activeTab === 'General Profile' && (
                      <div className="space-y-10">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">System Identity</h3>
                          <div className="flex items-center gap-10 mb-12">
                             <div className="w-28 h-28 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner group relative cursor-pointer">
                                <User size={56}/>
                                <div className="absolute inset-0 bg-blue-600/10 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Camera size={24} className="text-blue-600" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <button className="px-6 py-2.5 bg-slate-900 text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Upload Bio-Metric Avatar</button>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">System requirement: Professional PNG or JPG.<br/>Certified Max Limit: 2MB.</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <InputGroup label="Enterprise Name" defaultValue="Abhradeep Hazra" icon={<User size={16}/>} />
                             <InputGroup label="Network Email" defaultValue={user?.email || "abhradeep@qitpes.in"} icon={<Mail size={16}/>} readOnly />
                             <InputGroup label="Direct Contact" defaultValue="+91 98765 43210" icon={<Phone size={16}/>} />
                             <InputGroup label="Primary Hub" defaultValue="Pune Headquarters" icon={<MapPin size={16}/>} />
                          </div>
                        </div>

                        <div className="p-8 bg-slate-900 rounded-[32px] flex items-center justify-between border border-slate-800 shadow-2xl relative overflow-hidden group">
                           <div className="relative z-10">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Access Protocol Verified</p>
                              <p className="text-xl font-black text-white uppercase tracking-tighter">{userRole?.toUpperCase()} CLEARANCE LEVEL</p>
                           </div>
                           <ShieldCheck className="text-blue-500 relative z-10 group-hover:scale-125 transition-transform duration-700" size={48} />
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'Company Info' && (
                      <div className="space-y-10">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Corporate Registry</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <InputGroup label="Legal Entity Name" defaultValue="QITPES International Pvt Ltd" />
                           <InputGroup label="GSTIN Identity" defaultValue="27AAACQ1234F1Z5" />
                           <InputGroup label="Tax Identifier (PAN)" defaultValue="AAACQ1234F" />
                           <InputGroup label="Global Portal" defaultValue="www.qitpes.erp" icon={<Globe size={16}/>} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Headquarters Address</label>
                           <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[24px] text-sm outline-none font-bold min-h-[140px] focus:ring-8 focus:ring-blue-500/5 transition-all resize-none" defaultValue="Site 4, Phase 2, Hinjewadi IT Park, Pune, Maharashtra 411057" />
                        </div>
                        <div className="p-6 border border-slate-100 rounded-[28px] bg-slate-50/30 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><CreditCard size={24}/></div>
                              <div>
                                 <p className="font-black text-slate-800 text-sm">Enterprise Subscription</p>
                                 <p className="text-xs text-slate-400 font-bold uppercase">Pro Tier - Renewal Oct 2027</p>
                              </div>
                           </div>
                           <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage Tier →</button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Security & SSO' && (
                      <div className="space-y-10">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Security Hardening</h3>
                        <div className="space-y-6">
                           <SecurityCard 
                             title="Multi-Factor Authentication (MFA)" 
                             description="Add a secondary biometric or TOTP layer for all financial disbursements."
                             icon={<Fingerprint className="text-blue-500" />}
                             enabled={true}
                           />

                           <SecurityCard 
                             title="Bio-Metric SSO Integration" 
                             description="Allow FaceID/TouchID for quick access to site registries."
                             icon={<Cloud className="text-emerald-500" />}
                             enabled={false}
                           />

                           <SecurityCard 
                             title="Forensic Session Logging" 
                             description="Record precise IP and Geo-location data for every module access event."
                             icon={<Terminal className="text-amber-500" />}
                             enabled={true}
                           />
                        </div>
                        
                        <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                           <div>
                              <p className="font-black text-slate-800 text-sm">Portal Authentication Password</p>
                              <p className="text-xs text-slate-400 font-bold uppercase">Last rotated 42 days ago</p>
                           </div>
                           <button className="px-6 py-3 bg-white border border-slate-200 rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Rotate Keys</button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Notifications' && (
                      <div className="space-y-10">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Critical Intelligence Thresholds</h3>
                        <div className="space-y-1">
                           <NotificationToggle label="Financial Authorizations" description="Instant alert when payroll or vendor payments require approval." active />
                           <NotificationToggle label="Site Milestone Deviations" description="Notify project directors when completion falls below 80% of target." active />
                           <NotificationToggle label="Fleet Low Fuel Telemetry" description="Alert logistics desk when machinery fuel levels hit <15%." />
                           <NotificationToggle label="Inventory Reorder Triggers" description="Auto-notify purchasing when SKU units hit reorder minimums." active />
                           <NotificationToggle label="HR Compliance Deadlines" description="Alert for upcoming TDS filing or contract renewals." active />
                        </div>
                      </div>
                    )}

                    {activeTab === 'Data & Export' && (
                      <div className="space-y-10">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Asset Portability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <DataExportCard title="Global Fiscal Ledger" format="PDF / XLSX / XML" size="14.2 MB" />
                           <DataExportCard title="Workforce Registry" format="CSV / JSON" size="2.1 MB" />
                           <DataExportCard title="Fleet Telemetry History" format="PARQUET / CSV" size="48.5 MB" />
                           <DataExportCard title="Site Audit Forensic Log" format="ENC PDF" size="5.8 MB" />
                        </div>
                        
                        <div className="mt-16 p-10 bg-rose-50 border border-rose-100 rounded-[40px] flex items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-rose-600 shadow-sm"><ShieldAlert size={32}/></div>
                              <div>
                                 <p className="text-lg font-black text-rose-900 uppercase tracking-tight">Danger Zone</p>
                                 <p className="text-xs text-rose-500 font-bold uppercase tracking-tight">Critical System Decommissioning Node</p>
                              </div>
                           </div>
                           <button className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                              <Trash2 size={16}/> Terminate Node
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

// Universal Sub-Components
const InputGroup = ({ label, defaultValue, icon, readOnly }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
    <div className="relative group">
      {icon && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">{icon}</span>}
      <input 
        readOnly={readOnly}
        defaultValue={defaultValue}
        className={`w-full ${icon ? 'pl-14' : 'px-6'} py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all ${readOnly ? 'cursor-not-allowed opacity-60' : 'group-hover:border-slate-300'}`}
      />
    </div>
  </div>
);

const SecurityCard = ({ title, description, icon, enabled }: any) => (
  <div className="p-8 border border-slate-100 rounded-[32px] bg-white flex items-center justify-between hover:border-slate-200 transition-all group">
     <div className="flex items-center gap-6">
        <div className="p-5 bg-slate-50 rounded-[20px] group-hover:bg-white group-hover:shadow-lg transition-all duration-500">{icon}</div>
        <div>
           <p className="text-sm font-black text-slate-800 tracking-tight">{title}</p>
           <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mt-1">{description}</p>
        </div>
     </div>
     <div className={`w-14 h-8 rounded-full relative transition-all duration-500 cursor-pointer ${enabled ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-100'}`}>
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 ${enabled ? 'left-7' : 'left-1'}`} />
     </div>
  </div>
);

const NotificationToggle = ({ label, description, active }: any) => (
  <div className="flex items-center justify-between py-6 border-b border-slate-50 group hover:px-2 transition-all">
    <div>
      <p className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{label}</p>
      <p className="text-xs text-slate-400 font-medium mt-1">{description}</p>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
    </div>
  </div>
);

const DataExportCard = ({ title, format, size }: any) => (
  <div className="p-8 border border-slate-100 rounded-[32px] bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50">
    <div className="flex items-center justify-between mb-4">
      <div className="p-4 bg-white rounded-2xl text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500"><Download size={24} /></div>
      <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full uppercase tracking-widest">{size}</span>
    </div>
    <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{title}</p>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{format}</p>
  </div>
);

const Camera = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);

export default Settings;
