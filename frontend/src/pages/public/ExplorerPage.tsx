import React, { useState, useEffect } from 'react';
import { medicineApi, batchApi, shipmentApi } from '../../api/client';
import { 
  Layers, 
  Package, 
  Truck, 
  RefreshCw, 
  Hash, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export const ExplorerPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const [medRes, batchRes, shipRes] = await Promise.allSettled([
        medicineApi.list(),
        batchApi.list(),
        shipmentApi.list(),
      ]);

      if (medRes.status === 'fulfilled') setMedicines(medRes.value.data.medicines || []);
      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data.batches || []);
      if (shipRes.status === 'fulfilled') setShipments(shipRes.value.data.shipments || []);
    } catch (err) {
      console.error('Error fetching ledger explorer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-mono mb-2">
            <Layers className="w-3.5 h-3.5" />
            Hardhat EVM Local State (Chain ID: 31337)
          </div>
          <h1 className="text-3xl font-extrabold text-white">Immutable Ledger Explorer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of anchored medicine batches, smart contract transactions, and transfer receipts.
          </p>
        </div>

        <button
          onClick={fetchLedgerData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync State
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Registered Formulations</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{medicines.length}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>On-Chain Batches</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{batches.length}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Custody Shipments</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{shipments.length}</div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Anchored Medicine Batches
          </h2>
          <span className="text-xs font-mono text-slate-400">Total: {batches.length}</span>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No medicine batches registered yet. Log in as a Manufacturer to create the first batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                <tr>
                  <th className="pb-3 px-3">Batch Number</th>
                  <th className="pb-3 px-3">Medicine</th>
                  <th className="pb-3 px-3">Quantity</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Chain Status</th>
                  <th className="pb-3 px-3">Transaction</th>
                  <th className="pb-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{b.batchNumber}</td>
                    <td className="py-3 px-3 text-slate-200 font-sans">{b.medicine?.name || 'Standard Batch'}</td>
                    <td className="py-3 px-3 text-slate-300">{b.quantity}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'RECALLED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        b.status === 'RECEIVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {b.chainStatus || 'CONFIRMED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-[120px]">
                      {b.txHash ? (
                        <span className="text-blue-400 hover:underline cursor-pointer" title={b.txHash}>
                          {b.txHash.slice(0, 10)}...
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedBatch(b)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Batch Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                Batch Details: {selectedBatch.batchNumber}
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Metadata Hash (SHA-256):</span>
                  <span className="text-slate-300 font-bold truncate max-w-[200px]" title={selectedBatch.metadataHash}>
                    {selectedBatch.metadataHash}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">On-Chain Batch ID:</span>
                  <span className="text-slate-300">{selectedBatch.chainBatchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Hash:</span>
                  <span className="text-blue-400 truncate max-w-[200px]" title={selectedBatch.txHash}>
                    {selectedBatch.txHash || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Manufacturing Date</span>
                  <span>{new Date(selectedBatch.mfgDate).toLocaleDateString()}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Expiry Date</span>
                  <span className="font-bold">{new Date(selectedBatch.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
