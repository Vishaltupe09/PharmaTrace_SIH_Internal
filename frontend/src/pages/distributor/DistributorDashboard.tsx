import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { shipmentApi, entityApi } from '../../api/client';
import { 
  Truck, 
  PackageCheck, 
  ArrowRightLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const DistributorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Outbound transfer modal
  const [transferShipment, setTransferShipment] = useState<any | null>(null);
  const [wholesalerEntityId, setWholesalerEntityId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const [shipRes, wsRes] = await Promise.allSettled([
        shipmentApi.list(),
        entityApi.list('WHOLESALER'),
      ]);
      if (shipRes.status === 'fulfilled') setShipments(shipRes.value.data.shipments || []);
      if (wsRes.status === 'fulfilled') {
        const wsList = wsRes.value.data.entities || [];
        setWholesalers(wsList);
        if (wsList.length > 0) setWholesalerEntityId(wsList[0].id);
      }
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
        text: `Receipt confirmed on-chain! Tx: ${res.data.txHash}`,
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

  const handleOutboundTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferShipment || !wholesalerEntityId) return;
    setActionLoading('transfer');
    setMessage(null);

    try {
      const res = await shipmentApi.transfer({
        batchId: transferShipment.batchId,
        fromEntityId: user?.entity?.id || transferShipment.toEntityId,
        toEntityId: wholesalerEntityId,
      });

      setMessage({
        type: 'success',
        text: `Batch dispatched to Wholesaler depot! Tx: ${res.data.txHash}`,
      });
      setTransferShipment(null);
      await fetchShipments();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Transfer failed',
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <Truck className="w-3.5 h-3.5" />
            Distributor Logistics Console
          </div>
          <h1 className="text-3xl font-extrabold text-white">Inbound & Outbound Shipments</h1>
          <p className="text-sm text-slate-400 mt-1">
            Confirm on-chain receipt from manufacturers and dispatch custody to wholesale distributors.
          </p>
        </div>

        <button
          onClick={fetchShipments}
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

      {/* Shipments List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            Custody Pipeline Shipments
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {shipments.length} Shipments
          </span>
        </div>

        {shipments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No active shipments found. Inbound manufacturer transfers will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                <tr>
                  <th className="pb-3 px-3">Batch</th>
                  <th className="pb-3 px-3">Status</th>
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
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(s.initiatedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {s.receivedAt ? new Date(s.receivedAt).toLocaleString() : 'Pending Receipt'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {s.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => handleReceive(s.id)}
                          disabled={actionLoading === s.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Confirm Receipt
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setTransferShipment(s);
                            setWholesalerEntityId(wholesalers.length > 0 ? wholesalers[0].id : '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Transfer to Wholesaler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer to Wholesaler Modal */}
      {transferShipment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              Transfer to Wholesaler Depot
            </h3>

            <form onSubmit={handleOutboundTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-300 block mb-1">
                  Select Destination Wholesaler
                </label>
                {wholesalers.length > 0 ? (
                  <select
                    required
                    value={wholesalerEntityId}
                    onChange={(e) => setWholesalerEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="">-- Choose Wholesaler --</option>
                    {wholesalers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.orgName} (Lic: {w.licenseNo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Wholesaler Entity UUID"
                    value={wholesalerEntityId}
                    onChange={(e) => setWholesalerEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferShipment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'transfer'}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {actionLoading === 'transfer' ? 'Dispatching...' : 'Dispatch Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
