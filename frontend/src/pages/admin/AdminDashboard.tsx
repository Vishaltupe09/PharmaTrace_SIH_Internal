import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { 
  Cpu, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Building2,
  AlertOctagon,
  Bell
} from 'lucide-react';

type ActiveTab = 'approvals' | 'recalls' | 'security' | 'audit';

export const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('approvals');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pendingRes, logsRes, eventsRes, recallsRes] = await Promise.allSettled([
        adminApi.pendingUsers(),
        adminApi.auditLogs(),
        adminApi.securityEvents(),
        adminApi.recalls(),
      ]);

      if (pendingRes.status === 'fulfilled') setPendingUsers(pendingRes.value.data.users || []);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value.data.logs || []);
      if (eventsRes.status === 'fulfilled') setSecurityEvents(eventsRes.value.data.events || []);
      if (recallsRes.status === 'fulfilled') setRecalls(recallsRes.value.data.recalls || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    setStatusMessage(null);
    try {
      const res = await adminApi.approveUser(userId);
      setStatusMessage({
        type: 'success',
        text: `${res.data.message} • Assigned Wallet: ${res.data.user.walletAddress}`,
      });
      await fetchAdminData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Approval failed',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    setStatusMessage(null);
    try {
      const res = await adminApi.rejectUser(userId);
      setStatusMessage({
        type: 'success',
        text: res.data.message,
      });
      await fetchAdminData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Rejection failed',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecomputeAi = async () => {
    setActionLoading('ai');
    setStatusMessage(null);
    try {
      const res = await adminApi.recomputeAI();
      setStatusMessage({
        type: 'success',
        text: `AI Risk Scores Recomputed: ${res.data.computedCount} batches processed`,
      });
      await fetchAdminData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'AI score recomputation failed',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'approvals', label: 'Pending Approvals', icon: <Building2 className="w-4 h-4" />, count: pendingUsers.length },
    { id: 'recalls', label: 'Recall Management', icon: <AlertOctagon className="w-4 h-4" />, count: recalls.length },
    { id: 'security', label: 'Security Events', icon: <ShieldAlert className="w-4 h-4" />, count: securityEvents.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length },
    { id: 'audit', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'HIGH':     return 'bg-orange-950 text-orange-300 border-orange-700';
      case 'MEDIUM':   return 'bg-amber-950 text-amber-300 border-amber-700';
      default:         return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-400 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5" />
            System Administrator Oversight Console
          </div>
          <h1 className="text-3xl font-extrabold text-white">Platform Governance & Security</h1>
          <p className="text-sm text-slate-400 mt-1">
            Approve supply chain organizations, assign on-chain custodial wallets, manage recalls, monitor audits, and execute risk calculations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRecomputeAi}
            disabled={actionLoading === 'ai'}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 ${actionLoading === 'ai' ? 'animate-spin' : ''}`} />
            Recompute AI Risk Scores
          </button>
          
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                tab.id === 'recalls' 
                  ? 'bg-rose-900 text-rose-300'
                  : tab.id === 'approvals'
                  ? 'bg-amber-900 text-amber-300'
                  : 'bg-orange-900 text-orange-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'approvals' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Pending Participant Approvals
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {pendingUsers.length} Pending
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No pending registration requests. All supply chain actors are currently verified.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-mono border-b border-slate-800 uppercase">
                  <tr>
                    <th className="pb-3 px-3">Organization</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">License No</th>
                    <th className="pb-3 px-3">Official Email</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pendingUsers.map((u) => {
                    const org = u.manufacturer || u.distributor || u.wholesaler || u.pharmacy;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-sans font-semibold text-slate-200">
                          {org?.orgName || 'N/A'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{org?.licenseNo || '—'}</td>
                        <td className="py-3 px-3 text-slate-400">{u.email}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleApprove(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-sans transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Approve & Assign Wallet
                          </button>
                          <button
                            onClick={() => handleReject(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-sans transition-colors inline-flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recalls' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              Active & Historical Recalls
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800">
              {recalls.length} Recall Records
            </span>
          </div>

          {recalls.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              No batch recalls recorded. All batches are active and unrecalled.
            </div>
          ) : (
            <div className="space-y-3">
              {recalls.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-rose-300 text-sm">
                        {r.batch?.medicine?.name} — {r.batch?.medicine?.brandName}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                        Batch: {r.batch?.batchNumber} • Manufacturer: {r.batch?.manufacturer?.orgName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        By: {r.initiatedBy}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-rose-900/40">
                    <span className="text-rose-400 font-semibold">Reason: </span>
                    <span className="text-slate-300">{r.reason}</span>
                  </div>
                  {r.txHash && (
                    <div className="text-[10px] font-mono text-blue-400 truncate">
                      On-Chain Tx: {r.txHash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Security Anomalies & Events
            </h2>
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-mono text-slate-500">Live Feed</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {securityEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No security alerts recorded.
              </div>
            ) : (
              securityEvents.map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(e.severity)}`}>
                        {e.severity}
                      </span>
                      <span className="font-bold text-rose-400 font-mono">{e.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{e.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Platform Audit Logs
            </h2>
            <span className="text-xs font-mono text-slate-500">Recent 100</span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No audit log entries found.
              </div>
            ) : (
              auditLogs.map((l) => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-400">{l.action}</span>
                    <span className="text-[10px] text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Actor: {l.actor?.email || 'SYSTEM'} ({l.actor?.role})</span>
                    <span className="text-slate-500">{l.entityType}</span>
                  </div>
                  {l.txHash && (
                    <div className="text-[10px] text-blue-400 font-mono truncate">
                      Tx: {l.txHash}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
