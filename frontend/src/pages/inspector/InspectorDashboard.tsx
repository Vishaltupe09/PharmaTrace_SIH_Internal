import React, { useState, useEffect } from 'react';
import { medicineApi, batchApi, adminApi } from '../../api/client';
import { 
  Activity, 
  Flag, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Search 
} from 'lucide-react';

export const InspectorDashboard: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Flag Modal
  const [flagBatch, setFlagBatch] = useState<any | null>(null);
  const [flagReason, setFlagReason] = useState<string>('');
  const [flagLoading, setFlagLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInspectorData = async () => {
    setLoading(true);
    try {
      const [batchRes, eventsRes] = await Promise.allSettled([
        batchApi.list(),
        adminApi.securityEvents(),
      ]);

      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data.batches || []);
      if (eventsRes.status === 'fulfilled') setSecurityEvents(eventsRes.value.data.events || []);
    } catch (err) {
      console.error('Error fetching inspector data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectorData();
  }, []);

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagBatch || !flagReason) return;
    setFlagLoading(true);
    setMessage(null);

    try {
      const res = await medicineApi.flag(flagBatch.id, flagReason);
      setMessage({
        type: 'success',
        text: `Batch ${flagBatch.batchNumber} has been flagged! On-chain Tx: ${res.data.txHash}`,
      });
      setFlagBatch(null);
      setFlagReason('');
      await fetchInspectorData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Flagging failed',
      });
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            Regulatory Auditor & Inspector Console
          </div>
          <h1 className="text-3xl font-extrabold text-white">Compliance & Anomaly Audit</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit supply chain integrity, inspect suspected counterfeits, and flag suspicious batches on the blockchain.
          </p>
        </div>

        <button
          onClick={fetchInspectorData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Batches Overview Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-rose-400" />
            Supply Chain Batches Inspection
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {batches.length} Batches
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No medicine batches currently registered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                <tr>
                  <th className="pb-3 px-3">Batch Number</th>
                  <th className="pb-3 px-3">Medicine</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Expiry Date</th>
                  <th className="pb-3 px-3 text-right">Inspection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{b.batchNumber}</td>
                    <td className="py-3 px-3 text-slate-200 font-sans">{b.medicine?.name || 'Formulation'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'RECALLED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        b.status === 'FLAGGED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setFlagBatch(b);
                          setFlagReason('');
                        }}
                        disabled={b.status === 'RECALLED' || b.status === 'FLAGGED'}
                        className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Flag Batch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Anomalies Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Security & Anomaly Incidents
          </h2>
          <span className="text-xs font-mono text-slate-500">Live Surveillance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {securityEvents.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
              No active security incidents detected.
            </div>
          ) : (
            securityEvents.map((e) => (
              <div key={e.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-rose-400">{e.type}</span>
                  <span className="text-[10px] text-slate-500">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{e.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {flagBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-amber-600/40 space-y-4">
            <h3 className="font-bold text-amber-300 text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              Flag Medicine Batch on Chain
            </h3>
            <p className="text-xs text-slate-400">
              Flagging batch <span className="font-mono font-bold text-slate-200">{flagBatch.batchNumber}</span> writes a warning event on the smart contract, alerting dispensers to hold stock pending audit.
            </p>

            <form onSubmit={handleFlag} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-300 block mb-1">Reason for Flagging</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Inconsistent packaging seals observed during field inspection"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFlagBatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {flagLoading ? 'Flagging on Chain...' : 'Record On-Chain Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
