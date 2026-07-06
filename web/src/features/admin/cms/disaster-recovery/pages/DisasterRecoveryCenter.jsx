import React, { useState, useEffect, useCallback } from 'react';
import {
  getDisasterOverview, getBackups, createBackup, simulateBackup, getSnapshots,
  getRecoveryItems, restoreDeployment, getRollbackTargets, executeRollback,
  getQueueMetrics, getDisasterAnalytics, getRecoveryHealth, getPolicies,
  updatePolicy, getRetentionStatus, refreshDisasterCache, getRestoreHistory
} from '../services/disaster.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Shield, Database, RefreshCw, Clock, Activity, BarChart3,
  Server, HardDrive, Upload, RotateCcw, Layers, AlertTriangle,
  CheckCircle, XCircle, Settings, Terminal, BookOpen, Archive, Trash2,
  Wifi, Globe, Eye, Camera, Lock
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'DR Overview', icon: Shield },
  { id: 'backups', label: 'Backup Status', icon: Database },
  { id: 'create-backup', label: 'Create Backup', icon: Upload },
  { id: 'simulate', label: 'Simulate Backup', icon: Terminal },
  { id: 'snapshots', label: 'Snapshots', icon: HardDrive },
  { id: 'recovery-items', label: 'Recoverable Items', icon: Archive },
  { id: 'restore', label: 'Restore', icon: RotateCcw },
  { id: 'rollback', label: 'Rollback Targets', icon: Layers },
  { id: 'restore-history', label: 'Restore History', icon: Clock },
  { id: 'queue', label: 'Job Queue', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'health', label: 'Recovery Health', icon: Activity },
  { id: 'policies', label: 'Policies', icon: BookOpen },
  { id: 'backup-policy', label: 'Backup Policy', icon: Shield },
  { id: 'retention-policy', label: 'Retention Policy', icon: Clock },
  { id: 'storage-policy', label: 'Storage Policy', icon: Server },
  { id: 'snapshot-policy', label: 'Snapshot Policy', icon: Camera },
  { id: 'retention-status', label: 'Retention Status', icon: Trash2 },
  { id: 'environments', label: 'Environments', icon: Globe },
  { id: 'domains', label: 'Domains', icon: Wifi },
  { id: 'ssl', label: 'SSL Coverage', icon: Lock },
  { id: 'coverage', label: 'Coverage', icon: Eye },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'cache', label: 'Cache', icon: RefreshCw }
];

export default function DisasterRecoveryCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [backups, setBackups] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [recoveryItems, setRecoveryItems] = useState(null);
  const [rollbackTargets, setRollbackTargets] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [policies, setPolicies] = useState(null);
  const [retentionStatus, setRetentionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreId, setRestoreId] = useState('');
  const [restoreResult, setRestoreResult] = useState(null);
  const [createBackupType, setCreateBackupType] = useState('full');
  const [backupResult, setBackupResult] = useState(null);
  const [simulateResult, setSimulateResult] = useState(null);
  const [policyEdit, setPolicyEdit] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, bk, sn, ri, rt, rh, qm, an, h, po, rs] = await Promise.all([
        getDisasterOverview().catch(() => ({ data: null })),
        getBackups().catch(() => ({ data: null })),
        getSnapshots().catch(() => ({ data: [] })),
        getRecoveryItems().catch(() => ({ data: null })),
        getRollbackTargets().catch(() => ({ data: [] })),
        getRestoreHistory({ limit: 50 }).catch(() => ({ data: [] })),
        getQueueMetrics().catch(() => ({ data: null })),
        getDisasterAnalytics().catch(() => ({ data: null })),
        getRecoveryHealth().catch(() => ({ data: null })),
        getPolicies().catch(() => ({ data: null })),
        getRetentionStatus().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setBackups(bk.data);
      setSnapshots(sn.data || []);
      setRecoveryItems(ri.data);
      setRollbackTargets(rt.data || []);
      setRestoreHistory(rh.data || []);
      setQueueMetrics(qm.data);
      setAnalytics(an.data);
      setHealth(h.data);
      setPolicies(po.data);
      setRetentionStatus(rs.data);
    } catch (e) {
      console.error('DR load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreateBackup() {
    try {
      const res = await createBackup({ type: createBackupType });
      setBackupResult(res.data);
      await getBackups();
    } catch (e) { alert('Failed to create backup: ' + e.message); }
  }

  async function handleSimulate() {
    try {
      const res = await simulateBackup();
      setSimulateResult(res.data);
    } catch (e) { alert('Failed to simulate: ' + e.message); }
  }

  async function handleRestore() {
    if (!restoreId) return alert('Enter a deployment ID');
    try {
      const res = await restoreDeployment(restoreId);
      setRestoreResult(res.data);
      await getRestoreHistory({ limit: 50 });
    } catch (e) { alert('Restore failed: ' + e.message); }
  }

  async function handleRollback(id) {
    try {
      const res = await executeRollback(id);
      setRestoreResult(res.data);
      await getRestoreHistory({ limit: 50 });
    } catch (e) { alert('Rollback failed: ' + e.message); }
  }

  async function handlePolicyUpdate(type, updates) {
    try {
      await updatePolicy(type, updates);
      const res = await getPolicies();
      setPolicies(res.data);
      setPolicyEdit(null);
    } catch (e) { alert('Failed to update policy: ' + e.message); }
  }

  const renderScoreBadge = (score) => {
    if (score >= 80) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-bold">{score}</span>;
    if (score >= 60) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-bold">{score}</span>;
    if (score >= 40) return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-bold">{score}</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-bold">{score}</span>;
  };

  const renderRiskBadge = (level) => {
    const colors = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${colors[level] || 'bg-gray-100 text-gray-700'}`}>{level || 'unknown'}</span>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {overview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Recovery Score" value={overview.recoveryScore != null ? `${overview.recoveryScore}/100` : 'N/A'} icon={Shield} color="green" />
                  <CMSStatsCard title="Backup Status" value={overview.backupStatus || 'Unknown'} icon={Database} color="blue" />
                  <CMSStatsCard title="Policies" value={overview.policyCount || 0} icon={BookOpen} color="purple" />
                  <CMSStatsCard title="Recoverable Versions" value={overview.totalDeployableVersions || 0} icon={RotateCcw} color="indigo" />
                </div>
                {overview.environments && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Recoverable Environments</h3>
                    <div className="flex flex-wrap gap-2">
                      {overview.environments.map(e => (
                        <span key={e.id} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">{e.name} ({e.type})</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Loading overview...</p></div>}
          </div>
        );

      case 'backups':
        return (
          <div className="space-y-4">
            {backups ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Last Backup" value={backups.lastBackup ? new Date(backups.lastBackup).toLocaleString() : 'Never'} icon={Database} color="blue" />
                  <CMSStatsCard title="Backups (30d)" value={backups.backupCount || 0} icon={Upload} color="green" />
                  <CMSStatsCard title="Total Size" value={backups.totalSizeMB ? `${backups.totalSizeMB} MB` : '0 MB'} icon={HardDrive} color="purple" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Backup History</h3>
                  <div className="space-y-2">
                    {(backups.history || []).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                        <span className="font-bold">{b.type}</span>
                        <span>{b.status}</span>
                        <span className="text-gray-400">{new Date(b.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                    {(!backups.history || backups.history.length === 0) && <p className="text-xs text-gray-400 text-center py-4">No backups yet</p>}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-8"><Database className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Backup status not loaded</p></div>}
          </div>
        );

      case 'create-backup':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Create New Backup</h3>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="backupType" value="full" checked={createBackupType === 'full'} onChange={e => setCreateBackupType(e.target.value)} />
                  <span className="text-xs font-semibold">Full Backup</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="backupType" value="partial" checked={createBackupType === 'partial'} onChange={e => setCreateBackupType(e.target.value)} />
                  <span className="text-xs font-semibold">Partial Backup</span>
                </label>
              </div>
              <button onClick={handleCreateBackup} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                <Upload className="w-3 h-3 inline mr-1" />Start Backup
              </button>
              {backupResult && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">Backup created: {backupResult.id}</p>
                  <p className="text-xs text-green-600">Type: {backupResult.type} | Status: {backupResult.status}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'simulate':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Simulate Backup</h3>
              <p className="text-xs text-gray-500 mb-4">Simulate a backup operation without executing it — validates configuration.</p>
              <button onClick={handleSimulate} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                <Terminal className="w-3 h-3 inline mr-1" />Run Simulation
              </button>
              {simulateResult && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">Simulation Result</p>
                  <pre className="text-xs text-blue-600 mt-1">{JSON.stringify(simulateResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        );

      case 'snapshots':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Virtual snapshots discovered from Deployment Artifacts, Uploaded ZIPs, Assets, and Rollback Targets.</p>
            {snapshots.length === 0 ? (
              <div className="text-center py-8"><HardDrive className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No snapshots found</p></div>
            ) : (
              <div className="space-y-2">
                {snapshots.slice(0, 100).map(s => (
                  <div key={s.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold">{s.type}</span>
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-gray-400 ml-auto">{new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-400">Source: {s.source} {s.version && `| v${s.version}`} {s.fileSize ? `| ${(s.fileSize / 1024).toFixed(1)} KB` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'recovery-items':
        return (
          <div className="space-y-4">
            {recoveryItems ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CMSStatsCard title="Environments" value={recoveryItems.environments?.length || 0} icon={Globe} color="blue" />
                  <CMSStatsCard title="Deployable Versions" value={recoveryItems.totalDeployableVersions || 0} icon={Layers} color="green" />
                  <CMSStatsCard title="Domains" value={recoveryItems.domains?.length || 0} icon={Wifi} color="purple" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Recoverable Domains</h3>
                  <div className="space-y-2">
                    {(recoveryItems.domains || []).map(d => (
                      <div key={d.domain} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span>{d.domain}</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded-full ${d.recoverable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {d.recoverable ? 'Recoverable' : 'Not Recoverable'}
                        </span>
                        <span className="text-gray-400">{d.status}</span>
                      </div>
                    ))}
                    {(!recoveryItems.domains || recoveryItems.domains.length === 0) && <p className="text-xs text-gray-400 text-center py-4">No domains found</p>}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-8"><Archive className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Recovery items not loaded</p></div>}
          </div>
        );

      case 'restore':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Restore Deployment</h3>
              <p className="text-xs text-gray-500 mb-4">Enter a deployment ID to restore from a previous deployment.</p>
              <div className="flex gap-2 mb-4">
                <input value={restoreId} onChange={e => setRestoreId(e.target.value)} placeholder="Deployment ID..." className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                <button onClick={handleRestore} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                  <RotateCcw className="w-3 h-3 inline mr-1" />Restore
                </button>
              </div>
              {restoreResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">Restore completed: {JSON.stringify(restoreResult).substring(0, 200)}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'rollback':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Available rollback targets — previous deployments that can be rolled back to.</p>
            {rollbackTargets.length === 0 ? (
              <div className="text-center py-8"><Layers className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No rollback targets available</p></div>
            ) : (
              <div className="space-y-2">
                {(rollbackTargets || []).map(t => (
                  <div key={t.deploymentId || t.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div className="text-xs">
                      <p className="font-bold">{t.deploymentId || t.id}</p>
                      <p className="text-gray-400">{t.status} | {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</p>
                    </div>
                    <button onClick={() => handleRollback(t.deploymentId || t.id)} className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:opacity-90">
                      <RotateCcw className="w-3 h-3 inline mr-1" />Rollback
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'restore-history':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">History of all restore operations performed.</p>
            {restoreHistory.length === 0 ? (
              <div className="text-center py-8"><Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No restore history</p></div>
            ) : (
              <div className="space-y-2">
                {(restoreHistory || []).map(h => (
                  <div key={h.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded-full font-bold ${h.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : h.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status}</span>
                      <span className="font-bold">{h.deploymentId}</span>
                      <span className="text-gray-400 ml-auto">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'queue':
        return (
          <div className="space-y-4">
            {queueMetrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Waiting" value={queueMetrics.waiting || 0} icon={Clock} color="blue" />
                <CMSStatsCard title="Active" value={queueMetrics.active || 0} icon={Activity} color="green" />
                <CMSStatsCard title="Completed" value={queueMetrics.completed || 0} icon={CheckCircle} color="purple" />
                <CMSStatsCard title="Failed" value={queueMetrics.failed || 0} icon={XCircle} color="red" />
              </div>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Queue metrics not loaded</p></div>}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Backups" value={analytics.backupTrend?.buckets?.reduce((s, b) => s + b.count, 0) || 0} icon={Database} color="blue" />
                  <CMSStatsCard title="SSL Coverage" value={analytics.sslCoverage != null ? `${analytics.sslCoverage}%` : 'N/A'} icon={Lock} color="green" />
                  <CMSStatsCard title="Environment Coverage" value={analytics.environmentCoverage?.coveragePercent != null ? `${analytics.environmentCoverage.coveragePercent}%` : 'N/A'} icon={Globe} color="purple" />
                  <CMSStatsCard title="Total Storage" value={analytics.storage?.totalMB ? `${analytics.storage.totalMB} MB` : '0 MB'} icon={HardDrive} color="indigo" />
                </div>
                {analytics.restoreSuccessRate != null && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Restore Success Rate</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${analytics.restoreSuccessRate}%` }} />
                      </div>
                      <span className="font-bold text-sm">{analytics.restoreSuccessRate}%</span>
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Analytics not loaded</p></div>}
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            {health ? (
              <>
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${health.overall >= 80 ? 'bg-green-100' : health.overall >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <Shield className={`w-10 h-10 ${health.overall >= 80 ? 'text-green-600' : health.overall >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                  </div>
                  <h2 className="text-2xl font-bold">{health.overall}/100</h2>
                  <p className="text-sm text-gray-500 mt-1">Recovery Health Score</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(health.dimensions || {}).map(([key, val]) => (
                    <div key={key} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                        {renderScoreBadge(val.score || 0)}
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(val.score / 100) >= 0.7 ? 'bg-green-500' : (val.score / 100) >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Health score not loaded</p></div>}
          </div>
        );

      case 'policies':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">DR policies stored in CmsAiSettings — no new model needed.</p>
            {policies ? (
              <div className="space-y-4">
                {Object.entries(policies).map(([type, policy]) => (
                  <div key={type} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm capitalize">{type} Policy</h3>
                      <div className="flex gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${policy.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {policy.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button onClick={() => setPolicyEdit(policyEdit === type ? null : type)} className="text-xs text-primary hover:underline">Edit</button>
                      </div>
                    </div>
                    {policyEdit === type && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex gap-2">
                          {policy.retentionDays != null && (
                            <div>
                              <label className="text-xs text-gray-500 block">Retention Days</label>
                              <input type="number" defaultValue={policy.retentionDays} className="w-24 px-2 py-1 text-xs border rounded-lg" onChange={e => policy.retentionDays = parseInt(e.target.value)} />
                            </div>
                          )}
                          {policy.storageProvider && (
                            <div>
                              <label className="text-xs text-gray-500 block">Storage</label>
                              <span className="text-xs font-bold">{policy.storageProvider}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => handlePolicyUpdate(type, { ...policy, enabled: !policy.enabled })} className={`px-3 py-1 text-xs rounded-lg ${policy.enabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {policy.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Policies not loaded</p></div>}
          </div>
        );

      case 'backup-policy':
      case 'retention-policy':
      case 'storage-policy':
      case 'snapshot-policy':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{activeTab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} configuration.</p>
            {policies && policies[activeTab.replace('-policy', '')] ? (
              (() => {
                const policy = policies[activeTab.replace('-policy', '')];
                return (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm capitalize">{activeTab.replace('-policy', '')} Policy</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${policy.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {policy.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(policy).filter(([k]) => k !== 'enabled').map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-bold">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white border rounded-lg p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Policy config not available</p>
              </div>
            )}
          </div>
        );

      case 'retention-status':
        return (
          <div className="space-y-4">
            {retentionStatus ? (
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(retentionStatus.status || retentionStatus).filter(([k]) => typeof k === 'string').map(([key, val]) => (
                  <div key={key} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                      {val.retentionDays && <span className="text-xs text-gray-400">Retention: {val.retentionDays}d</span>}
                    </div>
                    {val.recordsBeyondRetention != null && (
                      <p className="text-xs text-gray-500">Records beyond retention: <span className={`font-bold ${val.recordsBeyondRetention > 0 ? 'text-orange-600' : 'text-green-600'}`}>{val.recordsBeyondRetention}</span></p>
                    )}
                    {val.thresholdDate && <p className="text-xs text-gray-400 mt-1">Threshold: {new Date(val.thresholdDate).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Retention status not loaded</p></div>}
          </div>
        );

      case 'environments':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Recoverable deployment environments discovered from DeploymentEnvironment model.</p>
            {recoveryItems?.environments ? (
              <div className="grid grid-cols-1 gap-2">
                {recoveryItems.environments.map(e => (
                  <div key={e.id} className="bg-white border rounded-lg p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold">{e.name}</span>
                      <span className="ml-2 text-gray-400">{e.type}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full ${e.recoverable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {e.recoverable ? 'Recoverable' : 'Not Recoverable'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Globe className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Environments not loaded</p></div>}
          </div>
        );

      case 'domains':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Recoverable domains — discovered from DeploymentDomain model.</p>
            {recoveryItems?.domains ? (
              <div className="space-y-2">
                {recoveryItems.domains.map(d => (
                  <div key={d.domain} className="bg-white border rounded-lg p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold">{d.domain}</span>
                      <span className="ml-2 text-gray-400">{d.status}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full ${d.recoverable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {d.recoverable ? 'Recoverable' : 'Unrecoverable'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Wifi className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Domains not loaded</p></div>}
          </div>
        );

      case 'ssl':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">SSL certificate coverage across all deployment domains.</p>
            {analytics?.sslCoverage != null ? (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${analytics.sslCoverage >= 80 ? 'bg-green-100' : analytics.sslCoverage >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <Lock className={`w-10 h-10 ${analytics.sslCoverage >= 80 ? 'text-green-600' : analytics.sslCoverage >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
                <h2 className="text-2xl font-bold">{analytics.sslCoverage}%</h2>
                <p className="text-sm text-gray-500 mt-1">SSL Coverage</p>
              </div>
            ) : <div className="text-center py-8"><Lock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">SSL data not available</p></div>}
          </div>
        );

      case 'coverage':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Environment backup coverage analysis.</p>
            {analytics?.environmentCoverage ? (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-bold text-sm mb-4">Environment Coverage</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{analytics.environmentCoverage.total}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Covered</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.environmentCoverage.covered}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${analytics.environmentCoverage.coveragePercent}%` }} />
                  </div>
                  <span className="font-bold text-sm">{analytics.environmentCoverage.coveragePercent}%</span>
                </div>
                {analytics.environmentCoverage.missingEnvironments?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-red-500">Missing Coverage:</p>
                    {analytics.environmentCoverage.missingEnvironments.map(name => (
                      <p key={name} className="text-xs text-red-400">- {name}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : <div className="text-center py-8"><Eye className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Coverage data not available</p></div>}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">DR Center Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Data Sources</p>
                    <p className="text-xs text-gray-400">All data aggregated from existing models (no new models)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Reuse Only</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Backup Engine</p>
                    <p className="text-xs text-gray-400">Uses DeploymentQueue (BullMQ + in-memory fallback)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Reused</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Restore Engine</p>
                    <p className="text-xs text-gray-400">Uses existing rollback.service.js</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Reused</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Policy Storage</p>
                    <p className="text-xs text-gray-400">Stored in CmsAiSettings (disaster category)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">CmsAiSettings</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cache':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">DR Cache Management</h3>
              <p className="text-xs text-gray-500 mb-4">12th Redis cache with prefix <code>cms:dr:</code> — follows existing cache pattern.</p>
              <button onClick={async () => { await refreshDisasterCache(); alert('DR cache cleared!'); }} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                <RefreshCw className="w-3 h-3 inline mr-1" />Clear Cache
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">{TABS.find(t => t.id === activeTab)?.label || 'Tab'} content coming soon</p>
          </div>
        );
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <CMSPage
      title="Disaster Recovery Center"
      description="Enterprise Disaster Recovery & Backup Center — orchestration-only dashboard over existing deployment infrastructure"
    >
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 border-b pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary bg-white border border-b-white -mb-[3px] border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </CMSPage>
  );
}
