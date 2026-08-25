import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipmentApi } from '../../api/client';
import { 
  Store, 
  PackageCheck, 
  ScanLine, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shipmentApi.list();
      setShipments(res.data.shipments || []);
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleReceive = async (shipmentId: string) => {
    setActionLoading(shipmentId);
    setMessage(null);
    try {
      const res = await shipmentApi.receive(shipmentId);
      setMessage({
        type: 'success',
        text: `Receipt confirmed on-chain! Medicine inventory updated. Tx: ${res.data.txHash}`,
      });
      await fetchShipments();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Receipt confirmation failed',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Store className="w-3.5 h-3.5" />
            Pharmacy & Dispensary Console
          </div>
          <h1 className="text-3xl font-extrabold text-white">Inbound Stock & Patient Verification</h1>
          <p className="text-sm text-slate-400 mt-1">
            Accept wholesale deliveries with on-chain receipts, inspect authenticity, and dispense to consumers.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/verify"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            Open Scanner
          </Link>
          
          <button
            onClick={fetchShipments}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
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

      {/* Stock & Delivery Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-cyan-400" />
            Pharmacy Inbound Deliveries
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {shipments.length} Deliveries
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No active pharmacy deliveries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                <tr>
                  <th className="pb-3 px-3">Batch Number</th>
                  <th className="pb-3 px-3">Delivery Status</th>
                  <th className="pb-3 px-3">Dispatched At</th>
                  <th className="pb-3 px-3">Received At</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">
                      {s.batch?.batchNumber || s.batchId}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'RECEIVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(s.initiatedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {s.receivedAt ? new Date(s.receivedAt).toLocaleString() : 'In Transit to Store'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {s.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => handleReceive(s.id)}
                          disabled={actionLoading === s.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Confirm Store Delivery
                        </button>
                      ) : (
                        <Link
                          to="/verify"
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify & Dispense
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
