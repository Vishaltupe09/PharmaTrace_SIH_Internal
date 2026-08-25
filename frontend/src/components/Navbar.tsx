import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  ScanLine, 
  Layers, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Activity, 
  Cpu, 
  Building2, 
  Truck, 
  Warehouse, 
  Store, 
  Search 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'MANUFACTURER': return '/manufacturer';
      case 'DISTRIBUTOR': return '/distributor';
      case 'WHOLESALER': return '/wholesaler';
      case 'PHARMACY': return '/pharmacy';
      case 'INSPECTOR': return '/inspector';
      default: return '/';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'MANUFACTURER': return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'DISTRIBUTOR': return <Truck className="w-4 h-4 text-amber-400" />;
      case 'WHOLESALER': return <Warehouse className="w-4 h-4 text-emerald-400" />;
      case 'PHARMACY': return <Store className="w-4 h-4 text-cyan-400" />;
      case 'INSPECTOR': return <Search className="w-4 h-4 text-rose-400" />;
      default: return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[2px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                PharmaTrace
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                CHAIN-v1
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase">
              Trust & Traceability Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/verify"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              location.pathname === '/verify'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanLine className="w-4 h-4 text-cyan-400" />
            Verify QR
          </Link>

          <Link
            to="/explorer"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              location.pathname === '/explorer'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            Ledger Explorer
          </Link>

          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                location.pathname.startsWith(getDashboardLink())
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              Portal ({user?.role})
            </Link>
          )}
        </nav>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {/* Blockchain Node Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Hardhat (31337)</span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user?.email}</span>
                <span className="text-[10px] text-cyan-400 font-mono flex items-center justify-end gap-1">
                  {getRoleIcon(user?.role || '')}
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/40 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
