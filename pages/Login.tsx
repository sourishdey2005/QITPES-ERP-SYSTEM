
import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// Fix: Cast motion to any to resolve property missing errors
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

// Hardcoded owner credentials
const OWNER_EMAIL = 'abhradeephazra99@gmail.com';
const OWNER_PASSWORD = 'Ahazra@987';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'standard' | 'rate-limit' | 'unconfirmed' | 'not-approved' } | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if this is the owner using hardcoded credentials
      if (email.toLowerCase() === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
        // 1. Try to Login first
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: OWNER_EMAIL,
          password: OWNER_PASSWORD,
        });

        if (authError) {
          console.log("Owner login failed, attempting auto-registration...", authError.message);

          // 2. If Login fails (account doesn't exist or wrong pass), try to Register/Recover
          if (authError.message.includes("Invalid login credentials")) {
            // Attempt to create the owner account with the correct password
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: OWNER_EMAIL,
              password: OWNER_PASSWORD,
              options: {
                data: {
                  full_name: 'System Owner',
                  role: 'owner'
                }
              }
            });

            if (signUpError) {
              // If registration also fails (e.g. user exists but wrong pass), we can't do much automatically
              setError({
                message: `Owner account exists but password doesn't match 'Ahazra@987'. Please use 'Forgot Password' or reset via Supabase dashboard. Error: ${signUpError.message}`,
                type: 'standard'
              });
              setLoading(false);
              return;
            }

            // If registration succeeded (or sent magic link depending on config), let them in
            if (signUpData.user) {
              // If auto-confirm is on, we are good. If not, they might need to confirm email.
              // But usually for owner we want instant access. 
              // For now, assume it worked or check session.
              const { data: session } = await supabase.auth.getSession();
              if (session.session) {
                navigate('/');
                return;
              } else {
                setError({
                  message: 'Owner account created! Please check your email to confirm the account, then log in.',
                  type: 'unconfirmed'
                });
                setLoading(false);
                return;
              }
            }
          }

          setError({
            message: `Owner login error: ${authError.message}`,
            type: 'standard'
          });
          setLoading(false);
          return;
        }

        navigate('/');
        return;
      }

      // For non-owner users, check if their email is approved
      const { data: approvedUser, error: approvalError } = await supabase
        .from('approved_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (approvalError || !approvedUser) {
        setError({
          message: 'Your email is not approved for access. Please contact the system owner for approval.',
          type: 'not-approved'
        });
        setLoading(false);
        return;
      }

      // If approved, proceed with normal Supabase authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          // Check if user is in approved_users table
          const { data: approvedButNotReg } = await supabase
            .from('approved_users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

          if (approvedButNotReg && approvedButNotReg.is_active) {
            setError({
              message: 'You are approved but have not created your account yet. Please Click "Register New Account" below.',
              type: 'standard'
            });
            setLoading(false);
            return;
          }
        }
        throw authError;
      }

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
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-2">🔒 Secure Access</p>
              <p className="text-sm text-red-100">Only approved users can access the system. Contact the owner for access approval.</p>
            </div>
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
                  className={`p-3 text-xs rounded-lg border font-medium flex items-start gap-3 ${error.type === 'rate-limit'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : error.type === 'unconfirmed'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : error.type === 'not-approved'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
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

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-bold text-blue-900 mb-1">New User / Need Access?</p>
                    <p className="text-xs text-blue-700">If you are approved but haven't set up your password, register now.</p>
                    <Link to="/register" className="text-xs font-black text-blue-800 underline hover:text-blue-900 uppercase tracking-wider">
                      Create New Account →
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
