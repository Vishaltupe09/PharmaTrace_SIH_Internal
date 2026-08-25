import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineApi, batchApi, shipmentApi, entityApi } from '../../api/client';
import { 
  Building2, 
  PlusCircle, 
  Truck, 
  AlertOctagon, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const ManufacturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Batch Creation Form Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('2028-12-31');
  const [quantity, setQuantity] = useState<number>(1000);
  const [packageCount, setPackageCount] = useState<number>(2);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  // Transfer Modal
  const [transferBatch, setTransferBatch] = useState<any | null>(null);
  const [distributorEntityId, setDistributorEntityId] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState<boolean>(false);

  // Recall Modal
  const [recallBatchId, setRecallBatchId] = useState<string | null>(null);
  const [recallReason, setRecallReason] = useState<string>('');
  const [recallLoading, setRecallLoading] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medRes, batchRes, distRes] = await Promise.allSettled([
        medicineApi.list(),
        batchApi.list(),
        entityApi.list('DISTRIBUTOR'),
      ]);

      if (medRes.status === 'fulfilled') {
        const meds = medRes.value.data.medicines || [];
        setMedicines(meds);
        if (meds.length > 0) setSelectedMedicineId(meds[0].id);
      }
      if (batchRes.status === 'fulfilled') setBatches(batchRes.value.data.batches || []);
      if (distRes.status === 'fulfilled') {
        const dists = distRes.value.data.entities || [];
        setDistributors(dists);
        if (dists.length > 0) setDistributorEntityId(dists[0].id);
      }
    } catch (err) {
      console.error('Error fetching manufacturer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineId) return;
    setCreateLoading(true);
    setMessage(null);

    try {
      const res = await batchApi.create({
        medicineId: selectedMedicineId,
        batchNumber: batchNumber || `BATCH-${Date.now()}`,
        mfgDate,
        expiryDate,
        quantity: Number(quantity),
        packageCount: Number(packageCount),
      });

      setCreatedResult(res.data);
      setMessage({ type: 'success', text: `Batch ${res.data.batch.batchNumber} created and anchored on-chain!` });
      await fetchData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Batch creation failed',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBatch || !distributorEntityId) return;
    setTransferLoading(true);
    setMessage(null);

    try {
      const res = await shipmentApi.transfer({
        batchId: transferBatch.id,
        fromEntityId: user?.entity?.id || transferBatch.manufacturerId,
        toEntityId: distributorEntityId,
      });

      setMessage({
        type: 'success',
        text: `Batch ${transferBatch.batchNumber} dispatched to distributor! Tx: ${res.data.txHash}`,
      });
      setTransferBatch(null);
      await fetchData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Transfer failed',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallBatchId || !recallReason) return;
    setRecallLoading(true);
    setMessage(null);

    try {
      const res = await batchApi.recall(recallBatchId, recallReason);
      setMessage({
        type: 'success',
        text: `Batch recalled successfully! On-chain recall hash: ${res.data.txHash}`,
      });
      setRecallBatchId(null);
      setRecallReason('');
      await fetchData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Recall failed',
      });
    } finally {
      setRecallLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-mono mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Manufacturer Production Console
          </div>
          <h1 className="text-3xl font-extrabold text-white">Batch Minting & Distribution</h1>
          <p className="text-sm text-slate-400 mt-1">
            Mint cryptographic medicine batches, generate package-level QR codes, and initiate supply chain transfers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setBatchNumber(`BATCH-MFR-${Date.now().toString().slice(-6)}`);
              setCreatedResult(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Mint New Batch
          </button>
          
          <button
            onClick={fetchData}
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

      {/* Batches Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Manufactured Batches
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {batches.length} Batches
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No batches created yet. Click "Mint New Batch" to register an on-chain batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                <tr>
                  <th className="pb-3 px-3">Batch Number</th>
                  <th className="pb-3 px-3">Medicine</th>
                  <th className="pb-3 px-3">Qty</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Chain Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{b.batchNumber}</td>
                    <td className="py-3 px-3 font-sans text-slate-200">{b.medicine?.name || 'Formulation'}</td>
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
                    <td className="py-3 px-3 text-emerald-400">
                      {b.chainStatus || 'CONFIRMED'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setTransferBatch(b);
                          setDistributorEntityId('');
                        }}
                        disabled={b.status === 'RECALLED'}
                        className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Transfer
                      </button>

                      <button
                        onClick={() => {
                          setRecallBatchId(b.id);
                        }}
                        disabled={b.status === 'RECALLED'}
                        className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Recall
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mint Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                Register On-Chain Medicine Batch
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {createdResult ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 space-y-2">
                  <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Batch Successfully Minted & Anchored
                  </div>
                  <div>Batch No: <span className="font-bold">{createdResult.batch.batchNumber}</span></div>
                  <div className="truncate">Tx Hash: <span className="text-blue-300">{createdResult.txHash}</span></div>
                </div>

                {/* Batch QR Code View */}
                {createdResult.batchQr && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                    <div className="text-xs font-bold text-slate-300">Generated Batch-Level QR Code</div>
                    <img 
                      src={createdResult.batchQr.qrCodeUrl} 
                      alt="Batch QR" 
                      className="w-48 h-48 mx-auto rounded-lg bg-white p-2"
                    />
                    <a
                      href={createdResult.batchQr.qrCodeUrl}
                      download={`QR-${createdResult.batch.batchNumber}.png`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download QR Code
                    </a>
                  </div>
                )}

                <div className="text-right pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
                <div>
                  <label className="font-mono text-slate-300 block mb-1">Medicine Formulation</label>
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.strength}) — {m.dosageForm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-slate-300 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-slate-300 block mb-1">Mfg Date</label>
                    <input
                      type="date"
                      required
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-slate-300 block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-slate-300 block mb-1">Total Unit Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-slate-300 block mb-1">Package QR Count</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={packageCount}
                      onChange={(e) => setPackageCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold disabled:opacity-50"
                  >
                    {createLoading ? 'Minting on Blockchain...' : 'Anchor Batch'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              Transfer Custody: {transferBatch.batchNumber}
            </h3>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-300 block mb-1">
                  Select Approved Distributor
                </label>
                {distributors.length > 0 ? (
                  <select
                    required
                    value={distributorEntityId}
                    onChange={(e) => setDistributorEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="">-- Choose Distributor --</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.orgName} (Lic: {d.licenseNo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Distributor Entity UUID"
                    value={distributorEntityId}
                    onChange={(e) => setDistributorEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferBatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {transferLoading ? 'Transacting...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recall Modal */}
      {recallBatchId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-600/40 space-y-4">
            <h3 className="font-bold text-rose-300 text-base flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              Initiate Emergency Batch Recall
            </h3>
            <p className="text-xs text-slate-400">
              Recalling a batch marks it permanently as RECALLED on-chain. All downstream verification scans will instantly warn pharmacies and consumers.
            </p>

            <form onSubmit={handleRecall} className="space-y-4 text-xs">
              <div>
                <label className="font-mono text-slate-300 block mb-1">Reason for Recall</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Quality deviation in potency test"
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecallBatchId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recallLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  {recallLoading ? 'Recalling on Chain...' : 'Execute Recall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
