import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OWNER_EMAIL = 'duttaarunima50@gmail.com';
const OWNER_PASSWORD = '123456789';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
      setSuccess(true);
      setError(null);
      // Navigate after a brief delay to show success state
      const timer = setTimeout(() => {
        navigate('/');
        clearTimeout(timer);
      }, 500);
      return;
    }

    setError('Invalid email or password. Please use the owner credentials.');
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Shield size={48} className="mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-bold text-slate-900">Enterprise Login</h2>
          <p className="text-slate-500 mt-2">Access your QITPES portal</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg">
            <AlertCircle className="mr-2 shrink-0 text-green-600" />
            <span>Login successful! Redirecting to dashboard...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <AlertCircle className="mr-2 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="name@qitpes.in"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg"
            disabled={!!error}
          >
            {error ? 'Try Again' : 'Sign In To Portal'} <ArrowRight size={18} className="ml-2" />
          </button>

          <div className="mt-4 text-xs text-slate-500">
            <p>Owner credentials: {OWNER_EMAIL}</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;