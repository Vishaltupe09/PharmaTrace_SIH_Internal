import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { 
  ShieldCheck, 
  LogIn, 
  Lock, 
  Mail, 
  Cpu, 
  Building2, 
  Truck, 
  Warehouse, 
  Store, 
  Activity, 
  RefreshCw 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState<string>('admin@pharmatrace.com');
  const [password, setPassword] = useState<string>('AdminPassword123!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login(loginEmail, loginPass);
      const { tokens, user } = res.data;
      login(tokens.accessToken, user);

      // Route to respective portal
      switch (user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'MANUFACTURER': navigate('/manufacturer'); break;
        case 'DISTRIBUTOR': navigate('/distributor'); break;
        case 'WHOLESALER': navigate('/wholesaler'); break;
        case 'PHARMACY': navigate('/pharmacy'); break;
        case 'INSPECTOR': navigate('/inspector'); break;
        default: navigate('/'); break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    handleLogin(undefined, roleEmail, rolePass);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] mx-auto mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to PharmaTrace</h1>
          <p className="text-xs text-slate-400">
            Access your supply chain management console
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Login Panel */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider text-center">
            ⚡ 1-Click Demo Logins for Evaluators
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickLogin('admin@pharmatrace.com', 'AdminPassword123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate text-slate-200">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('manufacturer@pharmatrace.com', 'Manufacturer123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-blue-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate text-slate-200">Manufacturer</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('distributor@pharmatrace.com', 'Distributor123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-slate-200">Distributor</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('wholesaler@pharmatrace.com', 'Wholesaler123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Warehouse className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-slate-200">Wholesaler</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('pharmacy@pharmatrace.com', 'Pharmacy123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate text-slate-200">Pharmacy</span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('inspector@pharmatrace.com', 'Inspector123!')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-left transition-colors flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate text-slate-200">Inspector</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-2">
          New supply chain organization?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Register for Approval
          </Link>
        </div>

      </div>
    </div>
  );
};
