import React, { useState, useEffect, useCallback } from 'react';
import {
  getDevOpsOverview, getDevOpsDashboard, getPipelines, getReleases, getBuilds, getArtifacts,
  getDeployments, getEnvironments, getDevOpsAnalytics, getDevOpsHealth,
  runPipeline, pausePipeline, resumePipeline, cancelPipeline, createRelease, executeRollback,
  refreshDevOpsCache, initializeDevOpsDefaults
} from '../services/devops.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Activity, Bell, Box, CheckCircle, Clock, Code, Database, Download, Eye, FileText,
  GitBranch, Globe, HardDrive, Layers, Play, RefreshCw, Server, Settings,
  Shield, Terminal, TrendingUp, Upload, Users, Zap, XCircle
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'pipelines', label: 'Pipelines', icon: GitBranch },
  { id: 'builds', label: 'Builds', icon: Terminal },
  { id: 'releases', label: 'Releases', icon: Download },
  { id: 'deployments', label: 'Deployments', icon: Upload },
  { id: 'artifacts', label: 'Artifacts', icon: Box },
  { id: 'environments', label: 'Environments', icon: Layers },
  { id: 'variables', label: 'Variables', icon: Code },
  { id: 'quality-gates', label: 'Quality Gates', icon: Shield },
  { id: 'coverage', label: 'Coverage', icon: Eye },
  { id: 'security', label: 'Security', icon: Zap },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'rollback', label: 'Rollback', icon: RefreshCw },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'queue', label: 'Queue', icon: Clock },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server },
  { id: 'monitoring', label: 'Monitoring', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'activity', label: 'Activity', icon: Eye }
];

export default function DevOpsCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [pipelines, setPipelines] = useState({ definitions: [], executions: [] });
  const [releases, setReleases] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [deployments, setDeployments] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newReleaseTag, setNewReleaseTag] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, db, pl, rl, bd, ar, dp, en, an, he] = await Promise.all([
        getDevOpsOverview().catch(() => ({ data: null })),
        getDevOpsDashboard().catch(() => ({ data: null })),
        getPipelines().catch(() => ({ data: { definitions: [], executions: [] } })),
        getReleases().catch(() => ({ data: [] })),
        getBuilds().catch(() => ({ data: [] })),
        getArtifacts().catch(() => ({ data: [] })),
        getDeployments().catch(() => ({ data: null })),
        getEnvironments().catch(() => ({ data: [] })),
        getDevOpsAnalytics().catch(() => ({ data: null })),
        getDevOpsHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setDashboard(db.data);
      setPipelines(pl.data || { definitions: [], executions: [] });
      setReleases(Array.isArray(rl.data) ? rl.data : []);
      setBuilds(Array.isArray(bd.data) ? bd.data : []);
      setArtifacts(Array.isArray(ar.data) ? ar.data : []);
      setDeployments(dp.data);
      setEnvironments(Array.isArray(en.data) ? en.data : []);
      setAnalytics(an.data);
      setHealth(he.data);
    } catch (e) {
      console.error('DevOps load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleRunPipeline(definitionId) {
    try { await runPipeline(definitionId); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handlePausePipeline(executionId) {
    try { await pausePipeline(executionId); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handleResumePipeline(executionId) {
    try { await resumePipeline(executionId); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handleCancelPipeline(executionId) {
    try { await cancelPipeline(executionId); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handleCreateRelease() {
    if (!newReleaseTag) return;
    try {
      await createRelease({ releaseTag: newReleaseTag, version: '1.0.0' });
      setNewReleaseTag('');
      await loadAll();
    } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handleRollback(deploymentId) {
    if (!window.confirm(`Rollback deployment ${deploymentId}?`)) return;
    try { await executeRollback(deploymentId); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {overview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Deployments" value={overview.totalDeployments?.toLocaleString() || '0'} icon={Upload} color="blue" />
                  <CMSStatsCard title="Active" value={overview.activeDeployments || '0'} icon={Activity} color="green" />
                  <CMSStatsCard title="Failed" value={overview.failedDeployments || '0'} icon={XCircle} color="red" />
                  <CMSStatsCard title="Environments" value={overview.totalEnvironments || '0'} icon={Layers} color="purple" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <CMSStatsCard title="Pipeline Total" value={overview.pipelineSummary?.total || pipelines.definitions.length || '0'} icon={GitBranch} color="blue" />
                  <CMSStatsCard title="Pipeline Running" value={overview.pipelineSummary?.running || pipelines.executions.filter(e => e.status === 'RUNNING').length || '0'} icon={Play} color="green" />
                  <CMSStatsCard title="Release Total" value={overview.releaseSummary?.total || releases.length || '0'} icon={Download} color="indigo" />
                </div>
                {overview.recentDeployments?.length > 0 && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3">Recent Deployments</h3>
                    <div className="space-y-2">
                      {overview.recentDeployments.map(d => (
                        <div key={d.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                          <span className={`w-2 h-2 rounded-full ${d.status === 'DEPLOYED' ? 'bg-green-500' : d.status === 'BUILD_FAILED' || d.status === 'DEPLOY_FAILED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          <span className="font-mono text-gray-500">{d.id.substring(0, 8)}...</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100">{d.status}</span>
                          <span className="ml-auto text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Loading overview...</p></div>}
          </div>
        );

      case 'pipelines':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Pipeline definitions and executions — orchestrated via Workflow Engine.</p>
            {pipelines.definitions.length === 0 ? (
              <div className="text-center py-8"><GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No pipeline definitions found</p></div>
            ) : (
              <div className="space-y-2">
                {pipelines.definitions.map(d => (
                  <div key={d.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{d.name || d.id}</p>
                      <p className="text-xs text-gray-400">{d.description || 'No description'}</p>
                    </div>
                    <button onClick={() => handleRunPipeline(d.id)} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90"><Play className="w-3 h-3 inline mr-1" />Run</button>
                  </div>
                ))}
              </div>
            )}
            {pipelines.executions.length > 0 && (
              <div>
                <h3 className="font-bold text-sm mb-3">Executions</h3>
                <div className="space-y-2">
                  {pipelines.executions.slice(0, 20).map(e => (
                    <div key={e.id} className="bg-white border rounded-lg p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${e.status === 'COMPLETED' ? 'bg-green-500' : e.status === 'RUNNING' ? 'bg-blue-500' : e.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'}`} />
                        <span className="font-mono">{e.id.substring(0, 8)}...</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold">{e.status}</span>
                      </div>
                      <div className="flex gap-1">
                        {e.status === 'RUNNING' && <button onClick={() => handlePausePipeline(e.id)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Pause</button>}
                        {e.status === 'PAUSED' && <button onClick={() => handleResumePipeline(e.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded">Resume</button>}
                        {e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && <button onClick={() => handleCancelPipeline(e.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded">Cancel</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'builds':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Build history — delegated to Deployment module.</p>
            {builds.length === 0 ? (
              <div className="text-center py-8"><Terminal className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No builds found</p></div>
            ) : (
              <div className="space-y-2">
                {builds.slice(0, 30).map(b => (
                  <div key={b.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${b.status === 'DEPLOYED' ? 'bg-green-500' : b.status === 'BUILD_FAILED' ? 'bg-red-500' : b.status === 'BUILDING' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 font-bold">{b.status}</span>
                      <span className="text-gray-400 ml-auto">{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    {b.buildLogs?.length > 0 && b.buildLogs.slice(0, 3).map((log, i) => (
                      <p key={i} className="text-gray-500 font-mono truncate">{log.message || log.level}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'releases':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">New Release</h3>
              <div className="flex gap-2">
                <input value={newReleaseTag} onChange={e => setNewReleaseTag(e.target.value)} placeholder="Release tag (e.g. v1.2.0)" className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                <button onClick={handleCreateRelease} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">Create</button>
              </div>
            </div>
            {releases.length === 0 ? (
              <div className="text-center py-8"><Download className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No releases found</p></div>
            ) : (
              <div className="space-y-2">
                {releases.slice(0, 30).map(r => (
                  <div key={r.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{r.releaseTag || 'Untagged'}</p>
                      <p className="text-xs text-gray-400">Version: {r.version || '1.0.0'} | Created: {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{r.releaseTag ? 'Tagged' : 'Draft'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'deployments':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment summary — delegated to Deployment module.</p>
            {deployments ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Deployments" value={deployments.totalDeployments?.toLocaleString() || deployments.total || '0'} icon={Upload} color="blue" />
                <CMSStatsCard title="Active" value={deployments.activeDeployments || deployments.active || '0'} icon={Activity} color="green" />
                <CMSStatsCard title="Failed" value={deployments.failedDeployments || deployments.failed || '0'} icon={XCircle} color="red" />
                <CMSStatsCard title="Storage" value={deployments.storageUsed ? `${(deployments.storageUsed / 1024 / 1024).toFixed(1)} MB` : '0 MB'} icon={HardDrive} color="purple" />
              </div>
            ) : <div className="text-center py-8"><Upload className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No deployment data</p></div>}
          </div>
        );

      case 'artifacts':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment artifacts — delegated to DeploymentArtifact model.</p>
            {artifacts.length === 0 ? (
              <div className="text-center py-8"><Box className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No artifacts found</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artifacts.slice(0, 20).map(a => (
                  <div key={a.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Box className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-sm truncate">{a.fileName || a.storagePath?.split('/').pop() || a.id.substring(0, 12)}</span>
                    </div>
                    <p className="text-xs text-gray-400">Size: {a.size ? `${(a.size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Checksum: {a.checksum ? a.checksum.substring(0, 16) + '...' : 'N/A'}</p>
                    <p className="text-xs text-gray-400">URL: {a.url ? a.url.substring(0, 50) + '...' : 'N/A'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'environments':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment environments — delegated to DeploymentEnvironment model.</p>
            {environments.length === 0 ? (
              <div className="text-center py-8"><Layers className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No environments found</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {environments.map(e => (
                  <div key={e.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${e.type === 'PRODUCTION' ? 'bg-red-500' : e.type === 'STAGING' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <span className="font-bold text-sm">{e.name}</span>
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100">{e.type}</span>
                    </div>
                    <p className="text-xs text-gray-400">Active: {e.isActive ? 'Yes' : 'No'} | Sort: {e.sortOrder || 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'quality-gates':
      case 'coverage':
      case 'security':
      case 'performance':
      case 'rollback':
      case 'approvals':
      case 'queue':
      case 'logs':
      case 'analytics':
      case 'health':
      case 'infrastructure':
      case 'monitoring':
      case 'notifications':
      case 'workflow':
      case 'settings':
      case 'activity':
      case 'variables':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6 text-center">
              {activeTab === 'quality-gates' && <Shield className="w-12 h-12 mx-auto text-green-500 mb-3" />}
              {activeTab === 'coverage' && <Eye className="w-12 h-12 mx-auto text-blue-500 mb-3" />}
              {activeTab === 'security' && <Zap className="w-12 h-12 mx-auto text-red-500 mb-3" />}
              {activeTab === 'performance' && <TrendingUp className="w-12 h-12 mx-auto text-purple-500 mb-3" />}
              {activeTab === 'rollback' && <RefreshCw className="w-12 h-12 mx-auto text-orange-500 mb-3" />}
              {activeTab === 'approvals' && <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />}
              {activeTab === 'queue' && <Clock className="w-12 h-12 mx-auto text-yellow-500 mb-3" />}
              {activeTab === 'logs' && <FileText className="w-12 h-12 mx-auto text-gray-500 mb-3" />}
              {activeTab === 'analytics' && <TrendingUp className="w-12 h-12 mx-auto text-indigo-500 mb-3" />}
              {activeTab === 'health' && <Activity className="w-12 h-12 mx-auto text-green-500 mb-3" />}
              {activeTab === 'infrastructure' && <Server className="w-12 h-12 mx-auto text-blue-500 mb-3" />}
              {activeTab === 'monitoring' && <Globe className="w-12 h-12 mx-auto text-purple-500 mb-3" />}
              {activeTab === 'notifications' && <Bell className="w-12 h-12 mx-auto text-blue-500 mb-3" />}
              {activeTab === 'workflow' && <GitBranch className="w-12 h-12 mx-auto text-indigo-500 mb-3" />}
              {activeTab === 'settings' && <Settings className="w-12 h-12 mx-auto text-gray-500 mb-3" />}
              {activeTab === 'activity' && <Eye className="w-12 h-12 mx-auto text-blue-500 mb-3" />}
              {activeTab === 'variables' && <Code className="w-12 h-12 mx-auto text-gray-500 mb-3" />}
              <p className="text-sm text-gray-500 mt-3">
                {activeTab === 'quality-gates' && 'Quality gates configuration — stored in CmsAiSettings. Delegated to certification and testing infrastructure.'}
                {activeTab === 'coverage' && 'Code coverage metrics — stored in CmsAiSettings. Delegated to Developer Platform testing service.'}
                {activeTab === 'security' && 'Security scan results — stored in CmsAiSettings. Delegated to antivirus scanning infrastructure.'}
                {activeTab === 'performance' && 'Performance metrics — delegated to Phase 25 Analytics Center and Prometheus metrics service.'}
                {activeTab === 'rollback' && 'Rollback management — fully delegated to Deployment Rollback Service. Provides rollback targets and execution.'}
                {activeTab === 'approvals' && 'Approval workflows — delegated to Workflow Engine and Approval models.'}
                {activeTab === 'queue' && 'Queue status — delegated to DeploymentQueue and QueueManager.'}
                {activeTab === 'logs' && 'Build logs — delegated to DeploymentBuildLog model.'}
                {activeTab === 'analytics' && 'DevOps analytics — delegated to Phase 25 Analytics Center.'}
                {activeTab === 'health' && 'Health checks — delegated to Phase 18 Monitoring Center and Deployment health service.'}
                {activeTab === 'infrastructure' && 'Infrastructure status — delegated to Phase 24 Infrastructure Center.'}
                {activeTab === 'monitoring' && 'Monitoring dashboard — delegated to Phase 18 Monitoring Center.'}
                {activeTab === 'notifications' && 'DevOps notifications — delegated to Phase 27 Notification Center.'}
                {activeTab === 'workflow' && 'Workflow orchestration — delegated to Phase 19 Workflow Engine.'}
                {activeTab === 'settings' && 'DevOps Center configuration — stored in CmsAiSettings categories: devops, pipeline, release, quality, deployment, artifact, environment, approval, rollback, retention.'}
                {activeTab === 'activity' && 'Recent DevOps activity — aggregated from Deployment and WorkflowExecution audit logs.'}
                {activeTab === 'variables' && 'Environment variables — delegated to EnvironmentVariableService with AES-256-GCM encryption.'}
              </p>
              <p className="text-xs text-gray-400 mt-4">Zero duplicate architecture — all functionality delegated to existing modules.</p>
            </div>
            {activeTab === 'analytics' && analytics && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">DevOps Analytics Data</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(analytics, null, 2)}</pre>
              </div>
            )}
            {activeTab === 'health' && health && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Health Status</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(health, null, 2)}</pre>
              </div>
            )}
            {activeTab === 'rollback' && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Execute Rollback</h3>
                <div className="flex gap-2">
                  <input id="rollback-deployment-id" placeholder="Deployment ID" className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                  <button onClick={() => handleRollback(document.getElementById('rollback-deployment-id')?.value)} className="px-4 py-2 bg-orange-500 text-white text-xs rounded-lg hover:opacity-90">Rollback</button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">{TABS.find(t => t.id === activeTab)?.label || 'Tab'} content</p>
          </div>
        );
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <CMSPage
      title="Enterprise DevOps / CI-CD Center"
      description="Zero-duplicate orchestration layer managing the entire software delivery lifecycle"
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
