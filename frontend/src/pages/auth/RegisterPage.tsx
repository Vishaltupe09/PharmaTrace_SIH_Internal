import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/client';
import { 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Lock, 
  Building2, 
  FileBadge, 
  CheckCircle, 
  RefreshCw 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANUFACTURER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'PHARMACY' | 'INSPECTOR'>('MANUFACTURER');
  const [orgName, setOrgName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.register({
        email,
        password,
        role,
        orgName,
        licenseNo,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[2px] mx-auto mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Join PharmaTrace Network</h1>
          <p className="text-xs text-slate-400">
            Register your organization for cryptographic verification & Admin approval
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-white text-lg">Registration Submitted</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Your account has been registered with status <span className="font-mono font-bold">PENDING</span>. Once a System Admin approves your organization, an on-chain custodial wallet will be generated.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Role Selection */}
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Supply Chain Role
              </label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor / Logistics</option>
                <option value="WHOLESALER">Wholesaler Depot</option>
                <option value="PHARMACY">Pharmacy / Dispenser</option>
                <option value="INSPECTOR">Inspector / Regulatory Auditor</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Org Name */}
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Organization / Company Legal Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Pharma Solutions Ltd."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* License No */}
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Drug License / Registration Number
              </label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                  placeholder="e.g. LIC-MFR-2026-99"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Submit for Approval
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Already approved?{' '}
              <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
