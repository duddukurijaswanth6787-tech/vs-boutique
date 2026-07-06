import React, { useState, useEffect, useCallback } from 'react';
import {
  getComplianceOverview, getAuditLogs, getAuditSummary, getCrossModuleActivity,
  getSecurityPosture, getRiskScore, getPolicies, updatePolicy, getFrameworks,
  getRetentionConfig, updateRetentionConfig, getRetentionStatus,
  getComplianceAnalytics, getComplianceSummary, getComplianceHealth, refreshComplianceCache
} from '../services/compliance.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Shield, ShieldCheck, ShieldAlert, Activity, FileText, Key, Clock,
  AlertTriangle, CheckCircle, XCircle, BarChart3, BookOpen, Server,
  Lock, Users, Globe, Terminal, Database, Settings, RefreshCw, Eye,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Compliance Overview', icon: Shield },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  { id: 'audit-summary', label: 'Audit Summary', icon: BarChart3 },
  { id: 'cross-module', label: 'Cross-Module Activity', icon: Activity },
  { id: 'security', label: 'Security Posture', icon: Lock },
  { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
  { id: 'policies', label: 'Compliance Policies', icon: BookOpen },
  { id: 'frameworks', label: 'Framework Mapping', icon: Globe },
  { id: 'retention', label: 'Data Retention', icon: Clock },
  { id: 'retention-status', label: 'Retention Status', icon: Database },
  { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
  { id: 'summary', label: 'Compliance Summary', icon: ShieldCheck },
  { id: 'gdpr', label: 'GDPR', icon: Shield },
  { id: 'soc2', label: 'SOC 2', icon: ShieldCheck },
  { id: 'iso27001', label: 'ISO 27001', icon: Lock },
  { id: 'hipaa', label: 'HIPAA', icon: Users },
  { id: 'pci', label: 'PCI DSS', icon: Key },
  { id: 'health', label: 'Health Check', icon: Activity },
  { id: 'users', label: 'User Audit', icon: Eye },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function ComplianceCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [crossModule, setCrossModule] = useState(null);
  const [security, setSecurity] = useState(null);
  const [risk, setRisk] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [retention, setRetention] = useState(null);
  const [retentionStatus, setRetentionStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(0);
  const [policyEdit, setPolicyEdit] = useState(null);
  const [retentionEdit, setRetentionEdit] = useState(null);
  const [auditFilter, setAuditFilter] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, al, asu, cm, sec, rsk, pol, fm, ret, rs, an, sm, h] = await Promise.all([
        getComplianceOverview().catch(() => ({ data: null })),
        getAuditLogs({ limit: 50 }).catch(() => ({ data: { logs: [], total: 0 } })),
        getAuditSummary().catch(() => ({ data: null })),
        getCrossModuleActivity().catch(() => ({ data: null })),
        getSecurityPosture().catch(() => ({ data: null })),
        getRiskScore().catch(() => ({ data: null })),
        getPolicies().catch(() => ({ data: [] })),
        getFrameworks().catch(() => ({ data: [] })),
        getRetentionConfig().catch(() => ({ data: null })),
        getRetentionStatus().catch(() => ({ data: null })),
        getComplianceAnalytics().catch(() => ({ data: null })),
        getComplianceSummary().catch(() => ({ data: null })),
        getComplianceHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setAuditLogs(al.data?.logs || []);
      setAuditSummary(asu.data);
      setCrossModule(cm.data);
      setSecurity(sec.data);
      setRisk(rsk.data);
      setPolicies(pol.data || []);
      setFrameworks(fm.data || []);
      setRetention(ret.data);
      setRetentionStatus(rs.data);
      setAnalytics(an.data);
      setSummary(sm.data);
      setHealth(h.data);
    } catch (e) {
      console.error('Compliance load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handlePolicyUpdate(framework, updates) {
    try {
      await updatePolicy(framework, updates);
      const res = await getPolicies();
      setPolicies(res.data || []);
      setPolicyEdit(null);
    } catch (e) { alert('Failed to update policy: ' + e.message); }
  }

  async function handleRetentionUpdate() {
    if (!retentionEdit) return;
    try {
      await updateRetentionConfig(retentionEdit);
      const res = await getRetentionConfig();
      setRetention(res.data);
      setRetentionEdit(null);
    } catch (e) { alert('Failed to update retention: ' + e.message); }
  }

  async function loadMoreAuditLogs() {
    const nextPage = auditPage + 1;
    try {
      const res = await getAuditLogs({ limit: 50, offset: nextPage * 50 });
      setAuditLogs(prev => [...prev, ...(res.data?.logs || [])]);
      setAuditPage(nextPage);
    } catch {}
  }

  const renderScoreBadge = (score) => {
    if (score >= 80) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-bold">{score}</span>;
    if (score >= 60) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-bold">{score}</span>;
    if (score >= 40) return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-bold">{score}</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-bold">{score}</span>;
  };

  const renderRiskBadge = (level) => {
    const colors = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${colors[level] || 'bg-gray-100 text-gray-700'}`}>{level}</span>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {overview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Audit Summary" value={overview.auditSummary?.totalLogs || 'N/A'} icon={FileText} color="blue" />
                  <CMSStatsCard title="Security Score" value={overview.security?.overall != null ? `${overview.security.overall}/100` : 'N/A'} icon={Lock} color="green" />
                  <CMSStatsCard title="Risk Score" value={overview.risk?.overall != null ? `${overview.risk.overall}/100` : 'N/A'} icon={AlertTriangle} color="red" />
                  <CMSStatsCard title="Policies" value={overview.policies?.total || 0} icon={BookOpen} color="purple" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <CMSStatsCard title="Frameworks" value={overview.policies?.frameworks?.length || 0} icon={Globe} color="indigo" />
                  <CMSStatsCard title="Retention Config" value={retention?.auditLogs ? `${retention.auditLogs}d` : 'Default'} icon={Clock} color="blue" />
                </div>
                {overview.risk && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Current Risk Level: {renderRiskBadge(overview.risk.riskLevel)}</h3>
                    <p className="text-xs text-gray-400">Calculated at {new Date(overview.risk.calculatedAt).toLocaleString()}</p>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Loading overview...</p></div>}
          </div>
        );

      case 'audit-logs':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <input value={auditFilter} onChange={e => setAuditFilter(e.target.value)} placeholder="Filter by action type..." className="flex-1 px-3 py-2 text-xs border rounded-lg" />
              <button onClick={loadAll} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90"><RefreshCw className="w-3 h-3 inline mr-1" />Refresh</button>
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No audit logs found</p></div>
            ) : (
              <div className="space-y-2">
                {auditLogs.filter(l => !auditFilter || l.actionType.toLowerCase().includes(auditFilter.toLowerCase())).slice(0, 50).map(log => (
                  <div key={log.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold">{log.actionType}</span>
                      <span className="text-gray-400">{log.entityType}:{log.entityId}</span>
                      <span className="text-gray-400 ml-auto">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-500">By {log.owner?.ownerName || log.performedBy} {log.ipAddress && `from ${log.ipAddress}`}</p>
                    {log.changesBefore && <p className="text-gray-400 mt-1">Changes: {JSON.stringify(log.changesBefore).substring(0, 100)}...</p>}
                  </div>
                ))}
                <button onClick={loadMoreAuditLogs} className="w-full py-2 text-xs text-primary hover:bg-gray-50 rounded-lg border">Load More</button>
              </div>
            )}
          </div>
        );

      case 'audit-summary':
        return (
          <div className="space-y-4">
            {auditSummary ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Audit Logs" value={auditSummary.totalLogs} icon={FileText} color="blue" />
                  <CMSStatsCard title="Last 24 Hours" value={auditSummary.last24h} icon={Activity} color="green" />
                  <CMSStatsCard title="Action Types" value={auditSummary.uniqueActionTypes} icon={BarChart3} color="purple" />
                  <CMSStatsCard title="Active Users" value={auditSummary.uniqueUsers} icon={Users} color="indigo" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Top Action Types</h3>
                  <div className="space-y-2">
                    {auditSummary.topActionTypes.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 text-gray-400 text-xs">{i + 1}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{a.actionType}</span>
                        <span className="font-bold text-xs">{a._count}</span>
                        <span className="text-gray-400 text-xs">occurrences</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Top Users</h3>
                  <div className="space-y-2">
                    {auditSummary.topUsers.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 text-gray-400 text-xs">{i + 1}</span>
                        <span className="font-bold text-xs">{u.owner?.ownerName || u.performedBy}</span>
                        <span className="text-gray-400 text-xs">{u.owner?.email}</span>
                        <span className="ml-auto font-bold text-xs">{u._count} actions</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-8"><BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Audit summary not loaded</p></div>}
          </div>
        );

      case 'cross-module':
        return (
          <div className="space-y-4">
            {crossModule ? (
              <>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Module Activity Overview</h3>
                  <div className="space-y-2">
                    {crossModule.moduleActivity.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-28 px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{m.module}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (m.totalRecords / 1000) * 100)}%` }} />
                        </div>
                        <span className="font-bold text-xs">{m.totalRecords.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Entity Coverage (Audit Log)</h3>
                  <div className="space-y-2">
                    {Object.entries(crossModule.entityCoverage).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([entity, count]) => (
                      <div key={entity} className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{entity}</span>
                        <span className="font-bold text-xs">{count.toLocaleString()}</span>
                        <span className="text-gray-400 text-xs">entries</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Cross-module data not loaded</p></div>}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            {security ? (
              <>
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${security.overall >= 80 ? 'bg-green-100' : security.overall >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <Lock className={`w-10 h-10 ${security.overall >= 80 ? 'text-green-600' : security.overall >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                  </div>
                  <h2 className="text-2xl font-bold">{security.overall}/100</h2>
                  <p className="text-sm text-gray-500 mt-1">Security Posture: {renderRiskBadge(security.riskLevel)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(security.details).map(([key, val]) => (
                    <div key={key} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                        {renderScoreBadge(val.score)}
                      </div>
                      <p className="text-xs text-gray-400">{val.label}</p>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${val.score / val.max >= 0.7 ? 'bg-green-500' : val.score / val.max >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(val.score / val.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center py-8"><Lock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Security posture not loaded</p></div>}
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-4">
            {risk ? (
              <>
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${risk.riskLevel === 'low' ? 'bg-green-100' : risk.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <AlertTriangle className={`w-10 h-10 ${risk.riskLevel === 'low' ? 'text-green-600' : risk.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'}`} />
                  </div>
                  <h2 className="text-2xl font-bold">{risk.overall}/100</h2>
                  <p className="text-sm text-gray-500 mt-1">Risk Level: {renderRiskBadge(risk.riskLevel)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(risk.details).map(([key, val]) => (
                    <div key={key} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${val.score / val.max > 0.5 ? 'bg-red-100 text-red-700' : val.score / val.max > 0.2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{val.score}</span>
                      </div>
                      <p className="text-xs text-gray-400">{val.label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center py-8"><AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Risk assessment not loaded</p></div>}
          </div>
        );

      case 'policies':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Compliance policies are stored in CmsAiSettings — no separate Policy model needed.</p>
            <div className="space-y-2">
              {policies.map(p => (
                <div key={p.framework} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-sm">{p.label}</span>
                      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full font-bold ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' :
                        p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'not_started' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{p.status}</span>
                      <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <button onClick={() => setPolicyEdit(policyEdit === p.framework ? null : p.framework)} className="text-xs text-primary hover:underline">Edit</button>
                  </div>
                  {policyEdit === p.framework && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex gap-2">
                        <select value={p.status} onChange={e => handlePolicyUpdate(p.framework, { ...p, status: e.target.value })} className="flex-1 px-2 py-1 text-xs border rounded-lg">
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="audit_required">Audit Required</option>
                        </select>
                        <button onClick={() => handlePolicyUpdate(p.framework, { ...p, enabled: !p.enabled })} className={`px-3 py-1 text-xs rounded-lg ${p.enabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.enabled ? 'Disable' : 'Enable'}</button>
                      </div>
                      {p.controls && p.controls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-bold mb-1">Controls ({p.controls.length})</p>
                          {p.controls.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 py-0.5">
                              <span className={`w-2 h-2 rounded-full ${c.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'frameworks':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Supported compliance frameworks mapped to this platform.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {frameworks.map(f => (
                <div key={f.id} className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm">{f.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{f.description}</p>
                  <span className="text-xs font-mono text-gray-400 mt-2 block">ID: {f.id}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Data retention configuration — policies stored in CmsAiSettings.</p>
            {retention ? (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Current Configuration</h3>
                  <span className="text-xs text-gray-400">Source: {retention.source}</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(retention).filter(([k]) => k !== 'source' && k !== 'calculatedAt').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {retentionEdit ? (
                        <input type="number" value={retentionEdit[key] || val} onChange={e => setRetentionEdit({ ...retentionEdit, [key]: parseInt(e.target.value) || 0 })} className="w-20 px-2 py-1 text-xs border rounded-lg text-right" />
                      ) : (
                        <span className="font-bold text-sm">{val}d</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {retentionEdit ? (
                    <>
                      <button onClick={handleRetentionUpdate} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">Save</button>
                      <button onClick={() => setRetentionEdit(null)} className="px-3 py-1.5 bg-gray-100 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setRetentionEdit({ ...retention })} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">Edit</button>
                  )}
                </div>
              </div>
            ) : <div className="text-center py-8"><Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Retention config not loaded</p></div>}
          </div>
        );

      case 'retention-status':
        return (
          <div className="space-y-4">
            {retentionStatus ? (
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(retentionStatus.status).map(([key, val]) => (
                  <div key={key} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                      <span className="text-xs text-gray-400">Retention: {val.retentionDays}d</span>
                    </div>
                    <p className="text-xs text-gray-500">Records beyond retention: <span className={`font-bold ${val.recordsBeyondRetention > 0 ? 'text-orange-600' : 'text-green-600'}`}>{val.recordsBeyondRetention}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Threshold: {new Date(val.thresholdDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Database className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Retention status not loaded</p></div>}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CMSStatsCard title="Audit Trend (30d)" value={`${analytics.auditTrend.buckets.reduce((s, b) => s + b.count, 0)} events`} icon={BarChart3} color="blue" />
                  <CMSStatsCard title="Violations (30d)" value={`${analytics.violationTrend.buckets.reduce((s, b) => s + b.count, 0)} events`} icon={AlertTriangle} color="red" />
                  <CMSStatsCard title="Coverage" value={`${analytics.coverageMetrics.coveragePercent}%`} icon={ShieldCheck} color="green" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Audit Activity (30 Days)</h3>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.auditTrend.buckets.map((b, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-primary/20 rounded-t" style={{ height: `${Math.min(100, (b.count / Math.max(...analytics.auditTrend.buckets.map(x => x.count), 1)) * 100)}%`, minHeight: b.count > 0 ? '4px' : '0' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Violation Trend (30 Days)</h3>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.violationTrend.buckets.map((b, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-red-400/20 rounded-t" style={{ height: `${Math.min(100, (b.count / Math.max(...analytics.violationTrend.buckets.map(x => x.count), 1)) * 100)}%`, minHeight: b.count > 0 ? '4px' : '0' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <div className="text-center py-8"><BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Analytics not loaded</p></div>}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4">
            {summary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Audit Logs" value={summary.totalAuditLogs.toLocaleString()} icon={FileText} color="blue" />
                <CMSStatsCard title="Total Businesses" value={summary.totalBusinesses} icon={Users} color="green" />
                <CMSStatsCard title="Businesses w/ Policies" value={summary.businessesWithPolicies} icon={BookOpen} color="purple" />
                <CMSStatsCard title="Policy Coverage" value={`${summary.policyCoveragePercent}%`} icon={ShieldCheck} color="indigo" />
              </div>
            ) : <div className="text-center py-8"><ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Summary not loaded</p></div>}
          </div>
        );

      case 'gdpr':
      case 'soc2':
      case 'iso27001':
      case 'hipaa':
      case 'pci': {
        const frameworkInfo = frameworks.find(f => f.id === activeTab) || { id: activeTab, label: activeTab.toUpperCase(), description: '' };
        const policy = policies.find(p => p.framework === activeTab);
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">{frameworkInfo.label}</h2>
              <p className="text-sm text-gray-500 mb-4">{frameworkInfo.description}</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-bold text-sm mt-1 ${policy?.status === 'completed' ? 'text-green-600' : policy?.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'}`}>{policy?.status || 'Not Started'}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Enabled</p>
                  <p className="font-bold text-sm mt-1">{policy?.enabled ? 'Yes' : 'No'}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Controls</p>
                  <p className="font-bold text-sm mt-1">{policy?.controls?.length || 0}</p>
                </div>
              </div>
              {policy?.controls && policy.controls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm">Controls</h3>
                  {policy.controls.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                      {c.passed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'health':
        return (
          <div className="space-y-4">
            {health ? (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-600">{health.status}</h2>
                <p className="text-xs text-gray-400 mt-1">Version {health.version} | Uptime: {Math.round(health.uptime / 60)}m</p>
                <p className="text-xs text-gray-400">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Health check not available</p></div>}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">User audit trail — all actions grouped by user.</p>
            {auditSummary?.topUsers ? (
              <div className="space-y-2">
                {auditSummary.topUsers.map((u, i) => (
                  <div key={i} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{u.owner?.ownerName || u.performedBy}</p>
                      <p className="text-xs text-gray-400">{u.owner?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{u._count}</p>
                      <p className="text-xs text-gray-400">actions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><Eye className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">User audit not loaded</p></div>}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Compliance Center Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Cache</p>
                    <p className="text-xs text-gray-400">Clear all cached compliance data</p>
                  </div>
                  <button onClick={async () => { await refreshComplianceCache(); alert('Cache cleared!'); }} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90"><RefreshCw className="w-3 h-3 inline mr-1" />Clear Cache</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Data Source</p>
                    <p className="text-xs text-gray-400">All data aggregated from AuditLog model (reused)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Policy Storage</p>
                    <p className="text-xs text-gray-400">Stored in CmsAiSettings — no new model</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">CmsAiSettings</span>
                </div>
              </div>
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
      title="Compliance Center"
      description="Enterprise Audit & Compliance Center — zero-duplicate aggregation over all existing audit/compliance data"
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
