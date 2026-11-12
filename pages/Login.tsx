import React, { useEffect, useState } from 'react';
import { Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  OWNER_EMAIL,
  isOwnerLoggedIn,
  isValidOwnerCredentials,
  setOwnerLoggedIn,
} from '../lib/ownerAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  // Already signed in? Go straight to the dashboard instead of showing the form.
  useEffect(() => {
    if (isOwnerLoggedIn()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (isValidOwnerCredentials(email, password)) {
      setError(null);
      setSuccess(true);

      // Persist the owner login, notify <App /> so the auth context updates
      // before routing, then go to the dashboard.
      setOwnerLoggedIn();
      navigate('/', { replace: true });
      return;
    }

    setSuccess(false);
    setError('Invalid email or password. Please use the owner credentials.');
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
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center text-sm text-green-800">
            <CheckCircle2 size={18} className="mr-2 shrink-0 text-green-600" />
            <span>Login successful! Redirecting to dashboard...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center text-sm text-red-800">
            <AlertCircle size={18} className="mr-2 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="block w-full pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="name@qitpes.in"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="block w-full pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg"
          >
            Sign In To Portal <ArrowRight size={18} className="ml-2" />
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
