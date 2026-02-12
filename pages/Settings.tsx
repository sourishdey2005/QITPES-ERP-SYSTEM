
import React, { useState, useEffect } from 'react';
import {
  User, Building, Shield, Bell, Database,
  CheckCircle2, Mail, Phone, MapPin, Globe, Lock, Key, ShieldCheck,
  Download, Trash2, Save, Loader2, CreditCard, Cloud, Terminal,
  ShieldAlert, Fingerprint, Eye, EyeOff, Camera
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

const motion = motionBase as any;

type SettingTab = 'General Profile' | 'Company Info' | 'Security & SSO' | 'Notifications' | 'Data & Export';

const Settings: React.FC = () => {
  const { role: userRole, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingTab>('General Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    primary_hub: ''
  });

  const [enterpriseForm, setEnterpriseForm] = useState({
    legal_name: '',
    gstin: '',
    pan: '',
    website: '',
    address: ''
  });

  // Fetch Profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch Enterprise data
  const { data: enterprise } = useQuery({
    queryKey: ['enterprise_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('enterprise_settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Sync form state when data is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        primary_hub: profile.primary_hub || '' // We'll add this to profile or enterprise
      });
    }
    if (enterprise) {
      setEnterpriseForm({
        legal_name: enterprise.legal_name || '',
        gstin: enterprise.gstin || '',
        pan: enterprise.pan || '',
        website: enterprise.website || '',
        address: enterprise.address || ''
      });
      // If primary_hub is in enterprise settings, sync it to profile form for display in General Profile
      setProfileForm(prev => ({ ...prev, primary_hub: enterprise.primary_hub || 'Pune Headquarters' }));
    }
  }, [profile, enterprise]);

  const updateProfile = useMutation({
    mutationFn: async (vars: any) => {
      if (!user) return;

      const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();

      const updateData = {
        id: user.id,
        full_name: vars.full_name,
        phone: vars.phone,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert([updateData]);
        if (error) throw error;
      }
    }
  });

  const updateEnterprise = useMutation({
    mutationFn: async (vars: any) => {
      const { data: existing, error: selectError } = await supabase.from('enterprise_settings').select('id').maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error } = await supabase.from('enterprise_settings').update(vars).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('enterprise_settings').insert([vars]);
        if (error) throw error;
      }
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'General Profile') {
        await updateProfile.mutateAsync({
          full_name: profileForm.full_name,
          phone: profileForm.phone
        });
        // Also update primary_hub in enterprise if changed here
        await updateEnterprise.mutateAsync({
          primary_hub: profileForm.primary_hub
        });
      } else if (activeTab === 'Company Info') {
        await updateEnterprise.mutateAsync(enterpriseForm);
      }

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise_settings'] });
      await refreshProfile();

      // Success toast simulation
      const btn = document.getElementById('commit-changes-btn');
      if (btn) {
        btn.classList.add('bg-emerald-600');
        setTimeout(() => btn.classList.remove('bg-emerald-600'), 2000);
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save settings. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 page-transition max-w-6xl mx-auto pb-24 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enterprise Workspace Config</h1>
          <p className="text-slate-500 text-sm font-medium">Manage corporate identity, security thresholds, and data portability.</p>
        </div>
        <button
          id="commit-changes-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {isSaving ? 'Synchronizing Node...' : 'Commit Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { label: 'General Profile', icon: <User size={18} /> },
            { label: 'Company Info', icon: <Building size={18} /> },
            { label: 'Security & SSO', icon: <Shield size={18} /> },
            { label: 'Notifications', icon: <Bell size={18} /> },
            { label: 'Data & Export', icon: <Database size={18} /> },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label as SettingTab)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === item.label
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
                        <div className="w-28 h-28 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner group relative cursor-pointer overflow-hidden">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <User size={56} />
                          )}
                          <div className="absolute inset-0 bg-blue-600/10 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={24} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <button className="px-6 py-2.5 bg-slate-900 text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Upload Bio-Metric Avatar</button>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">System requirement: Professional PNG or JPG.<br />Certified Max Limit: 2MB.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enterprise Name</label>
                          <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><User size={16} /></span>
                            <input
                              value={profileForm.full_name}
                              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                              className="w-full pl-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all group-hover:border-slate-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Email</label>
                          <div className="relative group opacity-60">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"><Mail size={16} /></span>
                            <input
                              readOnly
                              value={user?.email || "abhradeep@qitpes.in"}
                              className="w-full pl-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Direct Contact</label>
                          <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Phone size={16} /></span>
                            <input
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full pl-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all group-hover:border-slate-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Hub</label>
                          <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><MapPin size={16} /></span>
                            <input
                              value={profileForm.primary_hub}
                              onChange={(e) => setProfileForm({ ...profileForm, primary_hub: e.target.value })}
                              className="w-full pl-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all group-hover:border-slate-300"
                            />
                          </div>
                        </div>
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
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Legal Entity Name</label>
                        <input
                          value={enterpriseForm.legal_name}
                          onChange={(e) => setEnterpriseForm({ ...enterpriseForm, legal_name: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all hover:border-slate-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GSTIN Identity</label>
                        <input
                          value={enterpriseForm.gstin}
                          onChange={(e) => setEnterpriseForm({ ...enterpriseForm, gstin: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all hover:border-slate-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tax Identifier (PAN)</label>
                        <input
                          value={enterpriseForm.pan}
                          onChange={(e) => setEnterpriseForm({ ...enterpriseForm, pan: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all hover:border-slate-300"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Portal</label>
                        <div className="relative group">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"><Globe size={16} /></span>
                          <input
                            value={enterpriseForm.website}
                            onChange={(e) => setEnterpriseForm({ ...enterpriseForm, website: e.target.value })}
                            className="w-full pl-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 transition-all hover:border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Headquarters Address</label>
                      <textarea
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[24px] text-sm outline-none font-bold min-h-[140px] focus:ring-8 focus:ring-blue-500/5 transition-all resize-none"
                        value={enterpriseForm.address}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, address: e.target.value })}
                      />
                    </div>
                    <div className="p-6 border border-slate-100 rounded-[28px] bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><CreditCard size={24} /></div>
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
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-rose-600 shadow-sm"><ShieldAlert size={32} /></div>
                        <div>
                          <p className="text-lg font-black text-rose-900 uppercase tracking-tight">Danger Zone</p>
                          <p className="text-xs text-rose-500 font-bold uppercase tracking-tight">Critical System Decommissioning Node</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                        <Trash2 size={16} /> Terminate Node
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

export default Settings;
