import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ScanLine, 
  Layers, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Activity, 
  Building2, 
  Truck, 
  Warehouse, 
  Store 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* SIH Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-6 animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Smart India Hackathon 2026 • Live Blockchain MVP
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Cryptographic Trust in Every{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Medicine Pack
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
            Eliminate counterfeit pharmaceuticals with end-to-end blockchain custody tracking, 
            HMAC-signed QR verification, and AI-driven behavioral anomaly scoring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-2 text-base transition-all group"
            >
              <ScanLine className="w-5 h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
              Scan & Verify Medicine QR
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold glass-card hover:bg-slate-800/80 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-2 text-base transition-all"
            >
              <Layers className="w-5 h-5 text-blue-400" />
              Access Supply Chain Portal
            </Link>
          </div>

          {/* Demo Quick Credentials Card */}
          <div className="mt-14 max-w-4xl mx-auto glass-panel p-6 rounded-2xl border border-slate-800 text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Demo Accounts for Evaluators & Judges
              </span>
              <span className="text-xs text-slate-400 font-mono">Password: AdminPassword123! or [Role]123!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-purple-400 flex items-center gap-1"><Cpu className="w-3 h-3" /> Admin</div>
                <div className="text-[11px] text-slate-400 truncate">admin@pharmatrace.com</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-blue-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> Manufacturer</div>
                <div className="text-[11px] text-slate-400 truncate">manufacturer@...</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-amber-400 flex items-center gap-1"><Truck className="w-3 h-3" /> Distributor</div>
                <div className="text-[11px] text-slate-400 truncate">distributor@...</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-emerald-400 flex items-center gap-1"><Warehouse className="w-3 h-3" /> Wholesaler</div>
                <div className="text-[11px] text-slate-400 truncate">wholesaler@...</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-cyan-400 flex items-center gap-1"><Store className="w-3 h-3" /> Pharmacy</div>
                <div className="text-[11px] text-slate-400 truncate">pharmacy@...</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-rose-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Inspector</div>
                <div className="text-[11px] text-slate-400 truncate">inspector@...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custody Flow Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Immutable 5-Stage Custody Lifecycle
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Every custody transition is signed on-chain with cryptographic receipts and verified against the smart contract.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          
          {/* Step 1 */}
          <div className="glass-panel p-5 rounded-xl border-t-4 border-t-blue-500 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold mb-3">1</div>
            <h3 className="font-bold text-white text-base mb-1">Batch Minting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manufacturer registers batch + metadata hash on smart contract and generates HMAC QR codes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-5 rounded-xl border-t-4 border-t-amber-500 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold mb-3">2</div>
            <h3 className="font-bold text-white text-base mb-1">Distributor Inbound</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shipment transfer is recorded; distributor confirms receipt with verified on-chain signature.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-5 rounded-xl border-t-4 border-t-emerald-500 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold mb-3">3</div>
            <h3 className="font-bold text-white text-base mb-1">Wholesale Depot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Regional wholesalers confirm custody receipt and allocate packages to licensed pharmacies.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel p-5 rounded-xl border-t-4 border-t-cyan-500 relative">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold mb-3">4</div>
            <h3 className="font-bold text-white text-base mb-1">Pharmacy Dispense</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pharmacist scans package to verify authentic origin and updates status before customer delivery.
            </p>
          </div>

          {/* Step 5 */}
          <div className="glass-panel p-5 rounded-xl border-t-4 border-t-purple-500 relative">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold mb-3">5</div>
            <h3 className="font-bold text-white text-base mb-1">Consumer Scan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patients instantly scan with any smartphone to inspect full journey, expiry, and recall state.
            </p>
          </div>

        </div>
      </section>

      {/* Core Architectural Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Deterministic Authority</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                If a medicine is expired, recalled, or tampered, the system immediately returns an uncompromising failure status. AI never overrides safety rules.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Hardhat & Amoy Ledger</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dual-network execution: runs seamlessly on local node (Chain ID 31337) with public polygon deployment for independent verification.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Instant Recall Propagation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                When an Admin or Manufacturer recalls a batch, the on-chain flag cascades immediately across all scan endpoints and audit feeds.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
