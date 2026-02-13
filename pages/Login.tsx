
import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'standard' | 'rate-limit' | 'unconfirmed' } | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      navigate('/');
    } catch (err: any) {
      console.error('Login Error:', err);
      const isRateLimit = err.message?.toLowerCase().includes('rate limit');
      const isUnconfirmed = err.message?.toLowerCase().includes('email not confirmed');
      
      setError({
        message: isRateLimit 
          ? 'System Protection: Login rate limit exceeded. Please try again in a few minutes.'
          : isUnconfirmed
          ? 'Your email is not confirmed. Please check your inbox for the verification link.'
          : err.message || 'Login failed. Please check your credentials.',
        type: isRateLimit ? 'rate-limit' : isUnconfirmed ? 'unconfirmed' : 'standard'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1000px] w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200"
      >
        
        <div className="md:w-1/2 bg-red-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-8"
            >
              <Shield size={24} />
            </motion.div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold leading-tight"
            >
              QITPES ERP
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-red-100 mt-4 text-lg max-w-sm"
            >
              The all-in-one enterprise command center for large-scale operations in India.
            </motion.p>
          </div>
          <div className="relative z-10 mt-12 space-y-6">
            <p className="text-xs text-red-200">© 2026 QITPES Systems. Financial Tracking in INR (₹).</p>
          </div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          ></motion.div>
        </div>

        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-slate-900">Enterprise Login</h2>
            <p className="text-slate-500 mt-2">Access your QITPES site accounts and financial ledgers.</p>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 text-xs rounded-lg border font-medium flex items-start gap-3 ${
                    error.type === 'rate-limit' 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : error.type === 'unconfirmed'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                  }`}
                >
                  {error.type === 'rate-limit' ? <Clock size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <span>{error.message}</span>
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-red-500 transition-colors">
                      <Mail size={18} />
                    </span>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
                      placeholder="name@qitpes.in"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-red-500 transition-colors">
                      <Lock size={18} />
                    </span>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-slate-400 transition-all shadow-lg shadow-red-500/20"
              >
                {loading ? 'Authenticating...' : 'Sign In To Portal'} <ArrowRight size={18} className="ml-2" />
              </motion.button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account? <Link to="/register" className="text-red-600 font-bold hover:underline transition-all">Register Site</Link>
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
