
import React, { useState } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, Briefcase, CheckCircle2, AlertCircle, Clock, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'accounting' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'standard' | 'rate-limit' | 'disabled' } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setIsRegistered(true);
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      
      const msg = err.message?.toLowerCase() || '';
      let errorType: 'standard' | 'rate-limit' | 'disabled' = 'standard';
      let errorMessage = err.message || 'Registration failed.';

      if (msg.includes('rate limit')) {
        errorType = 'rate-limit';
        errorMessage = 'Security Limit: Too many attempts. Please wait 15 minutes.';
      } else if (msg.includes('disabled') || msg.includes('signups_disabled')) {
        errorType = 'disabled';
        errorMessage = 'System Configuration: Signups are disabled in Supabase. Go to Auth > Providers > Email and enable "Allow new users to sign up".';
      }

      setError({ message: errorMessage, type: errorType });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1000px] w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200"
      >
        <div className="md:w-1/2 bg-blue-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-8"
            >
              <Shield size={24} />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold leading-tight"
            >
              Join QITPES
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-blue-100 mt-4 text-lg max-w-sm"
            >
              Initialize your enterprise account for the 2026 fiscal year operations.
            </motion.p>
          </div>
          
          <div className="relative z-10 mt-12 space-y-4">
            <div className="p-4 bg-white/10 rounded-lg border border-white/10">
              <h4 className="font-bold text-sm text-white">Security Standards</h4>
              <p className="text-xs text-blue-200 mt-1">RLS Protected Database & End-to-End Encryption.</p>
            </div>
            <p className="text-xs text-blue-300 italic">© 2026 QITPES International Systems.</p>
          </div>

          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          ></motion.div>
        </div>

        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!isRegistered ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-sm mx-auto w-full"
              >
                <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                <p className="text-slate-500 mt-2 text-sm">Register your credentials for the ERP portal.</p>

                <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-4 rounded-lg border font-medium flex gap-3 ${
                        error.type === 'disabled' 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : error.type === 'rate-limit'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {error.type === 'disabled' ? <Settings size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold">
                          {error.type === 'disabled' ? 'Admin Action Required' : 'Registration Error'}
                        </p>
                        <p className="mt-1 opacity-90 leading-relaxed">{error.message}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <User size={18} />
                        </span>
                        <input 
                          type="text" 
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="e.g. Abhradeep Hazra"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Mail size={18} />
                        </span>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="abhradeephazra99@gmail.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Lock size={18} />
                        </span>
                        <input 
                          type="password" 
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Min 6 characters"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Role</label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Briefcase size={18} />
                        </span>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                          className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                        >
                          <option value="owner">Owner / CEO</option>
                          <option value="director">Site Director</option>
                          <option value="accounting">Accounting Staff</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-400 transition-all shadow-lg shadow-blue-500/20 mt-4"
                  >
                    {loading ? 'Initializing...' : 'Initialize Account'} <ArrowRight size={18} className="ml-2" />
                  </motion.button>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline transition-all">Log In</Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm mx-auto w-full text-center"
              >
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Verification Sent!</h2>
                <p className="text-slate-600 mt-4 leading-relaxed">
                  We've sent a confirmation link to <span className="font-bold text-slate-900">{formData.email}</span>. Please verify your email to access the QITPES ERP platform.
                </p>
                <button 
                  onClick={() => navigate('/login')}
                  className="mt-8 w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all"
                >
                  Return to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
