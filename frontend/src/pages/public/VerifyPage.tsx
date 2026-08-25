import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyApi } from '../../api/client';
import { 
  ScanLine, 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Cpu, 
  Hash, 
  Building2, 
  RefreshCw, 
  Camera 
} from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [rawPayload, setRawPayload] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Auto-verify if 'd' query param is present
  useEffect(() => {
    const dParam = searchParams.get('d');
    if (dParam) {
      setRawPayload(dParam);
      executeVerification(dParam);
    }
  }, [searchParams]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const toggleScanner = () => {
    if (cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      setCameraActive(false);
    } else {
      setCameraActive(true);
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        scanner.render(
          (decodedText) => {
            // Check if decodedText is a URL containing ?d=
            let payloadToVerify = decodedText;
            try {
              const url = new URL(decodedText);
              const d = url.searchParams.get('d');
              if (d) payloadToVerify = d;
            } catch {
              // Not a full URL, use raw string
            }
            setRawPayload(payloadToVerify);
            scanner.clear().catch(console.error);
            setCameraActive(false);
            executeVerification(payloadToVerify);
          },
          () => {
            // Scan error callback (ignored on continuous scanning)
          }
        );
        scannerRef.current = scanner;
      }, 100);
    }
  };

  const executeVerification = async (data: string) => {
    if (!data.trim()) {
      setError('Please provide a QR code payload or scan a valid code');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await verifyApi.scan(data.trim());
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to communicate with verification API');
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = () => {
    if (!result) return null;
    const state = result.resultState;

    switch (state) {
      case 'VERIFIED_AUTHENTIC':
        return (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-lg text-emerald-200">VERIFIED AUTHENTIC</h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">{result.message}</p>
            </div>
          </div>
        );
      case 'RECALLED':
        return (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 flex items-start gap-3 glow-rose">
            <AlertOctagon className="w-7 h-7 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-lg text-rose-200">BATCH RECALLED — DO NOT CONSUME</h4>
              <p className="text-xs text-rose-300/90 mt-0.5">{result.message}</p>
            </div>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-300 flex items-start gap-3">
            <Clock className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-lg text-amber-200">MEDICINE EXPIRED</h4>
              <p className="text-xs text-amber-300/90 mt-0.5">{result.message}</p>
            </div>
          </div>
        );
      case 'INVALID_QR':
      case 'SUSPICIOUS_DUPLICATE':
      default:
        return (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-lg text-red-200">{state || 'TAMPERING DETECTED'}</h4>
              <p className="text-xs text-red-300/90 mt-0.5">{result.message}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
          <ScanLine className="w-3.5 h-3.5" />
          Public QR Verification Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Verify Medicine Authenticity
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Scan the QR code on any medicine packaging to check its cryptographic origin, blockchain registration, and safety status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Verification Input Box */}
        <div className="md:col-span-6 space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Scan or Enter Payload
              </label>
              <button
                type="button"
                onClick={toggleScanner}
                className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {cameraActive ? 'Close Camera' : 'Use Camera Scanner'}
              </button>
            </div>

            {/* Camera Viewport Container */}
            {cameraActive && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/40">
                <div id="qr-reader" className="overflow-hidden rounded-lg"></div>
              </div>
            )}

            <div>
              <textarea
                value={rawPayload}
                onChange={(e) => setRawPayload(e.target.value)}
                placeholder="Paste base64 QR payload string or verification URL..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || !rawPayload.trim()}
                onClick={() => executeVerification(rawPayload)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying on-chain...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Now
                  </>
                )}
              </button>
              
              {rawPayload && (
                <button
                  type="button"
                  onClick={() => {
                    setRawPayload('');
                    setResult(null);
                    setError(null);
                  }}
                  className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Help */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              Cryptographic Guardrails
            </div>
            <p>
              Each packaging payload contains an HMAC-SHA256 signature calculated from a secure server nonce and batch identifiers. Any bit alteration fails immediately.
            </p>
          </div>

        </div>

        {/* Verification Result Display */}
        <div className="md:col-span-6">
          {result ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              
              {/* Verdict Header */}
              {getResultBadge()}

              {/* Medicine & Batch Overview */}
              {result.medicine && (
                <div className="space-y-3 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Medicine Specifications
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Brand Name</span>
                      <span className="font-semibold text-slate-200">{result.medicine.brandName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Generic / Active</span>
                      <span className="font-semibold text-slate-200">{result.medicine.genericName || result.medicine.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Strength</span>
                      <span className="font-semibold text-slate-200">{result.medicine.strength}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Storage Requirements</span>
                      <span className="font-semibold text-slate-200">{result.medicine.storageRequirements}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch Metadata */}
              {result.batch && (
                <div className="space-y-3 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Batch Metadata
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Batch Number</span>
                      <span className="font-mono text-cyan-400 font-bold">{result.batch.batchNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="font-semibold text-slate-200">{result.batch.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mfg Date</span>
                      <span className="text-slate-200 font-mono">
                        {new Date(result.batch.mfgDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Expiry Date</span>
                      <span className="text-slate-200 font-mono font-bold">
                        {new Date(result.batch.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Manufacturer Info */}
              {result.manufacturer && (
                <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Licensed Manufacturer
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{result.manufacturer.orgName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{result.manufacturer.licenseNo}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blockchain Anchors */}
              {result.blockchain && (
                <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    Blockchain Anchors
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chain Status:</span>
                      <span className="text-emerald-400 font-bold">{result.blockchain.chainStatus || 'CONFIRMED'}</span>
                    </div>
                    {result.blockchain.txHash && (
                      <div className="truncate">
                        <span className="text-slate-500">Tx Hash: </span>
                        <span className="text-blue-400">{result.blockchain.txHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Risk Score (Advisory Only) */}
              {result.aiRiskScore && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      AI Behavioral Risk Score (Advisory)
                    </span>
                    <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-full ${
                      result.aiRiskScore.score > 50 
                        ? 'bg-rose-950 text-rose-300 border border-rose-700' 
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    }`}>
                      {result.aiRiskScore.score} / 100
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    {result.aiRiskScore.disclaimer}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card h-full min-h-[320px] rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <ScanLine className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-300 text-base mb-1">Awaiting Scan</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Scan a packaging barcode or enter a payload to view verified provenance, expiry dates, and recall flags.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
