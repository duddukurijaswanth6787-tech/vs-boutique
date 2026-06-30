import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket, Activity, Globe, RotateCcw, Terminal, Clock, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, Download, Plus, Server,
  Layers, BarChart3, Play, Square, ExternalLink, FileArchive
} from 'lucide-react';
import { deploymentApi } from '../../../../../core/services/api/deployment.api';
import CMSWorkspace from '../../components/CMSWorkspace';
import CMSBadge from '../../components/CMSBadge';
import CMSEmptyState from '../../components/CMSEmptyState';

const STATUS_COLORS = {
  DEPLOYED: 'success',
  BUILDING: 'info',
  BUILD_FAILED: 'danger',
  FAILED: 'danger',
  PENDING: 'secondary',
  DEPLOYING: 'info',
  CANCELLED: 'warning',
  VALIDATING: 'info',
  ROLLED_BACK: 'warning'
};

const STATUS_ICONS = {
  DEPLOYED: CheckCircle2,
  BUILDING: RefreshCw,
  BUILD_FAILED: XCircle,
  FAILED: XCircle,
  PENDING: Clock,
  DEPLOYING: Rocket,
  CANCELLED: Square,
  VALIDATING: RefreshCw,
  ROLLED_BACK: RotateCcw
};

function DeploymentStatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || AlertCircle;
  const variant = STATUS_COLORS[status] || 'secondary';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border" style={{
      color: variant === 'success' ? '#059669' : variant === 'danger' ? '#dc2626' : variant === 'info' ? '#2563eb' : variant === 'warning' ? '#d97706' : '#6b7280',
      backgroundColor: variant === 'success' ? '#ecfdf5' : variant === 'danger' ? '#fef2f2' : variant === 'info' ? '#eff6ff' : variant === 'warning' ? '#fffbeb' : '#f3f4f6',
      borderColor: variant === 'success' ? '#a7f3d0' : variant === 'danger' ? '#fecaca' : variant === 'info' ? '#bfdbfe' : variant === 'warning' ? '#fde68a' : '#e5e7eb'
    }}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '0'}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function EnvironmentTab({ env, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer min-h-[44px] ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
      <span className="flex items-center gap-2">
        <Server size={14} />
        {env.name}
        <CMSBadge variant={env.type === 'PRODUCTION' ? 'danger' : env.type === 'STAGING' ? 'warning' : 'info'}>
          {env.type}
        </CMSBadge>
      </span>
    </button>
  );
}

function DeploymentRow({ deployment, onRollback, onViewLogs }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <span className="font-mono text-sm font-bold text-gray-900">v{deployment.version}</span>
      </td>
      <td className="py-3 px-4">
        {deployment.environment && (
          <span className="text-xs text-gray-500 font-medium">{deployment.environment.name}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <DeploymentStatusBadge status={deployment.status} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {deployment.builder}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
        {deployment.commitHash ? deployment.commitHash.slice(0, 8) : '-'}
      </td>
      <td className="py-3 px-4">
        {deployment.duration ? (
          <span className="text-xs text-gray-500 font-mono">{deployment.duration}ms</span>
        ) : '-'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          {deployment.status === 'DEPLOYED' && (
            <button onClick={() => onRollback(deployment.id)} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 hover:text-amber-700 transition-colors cursor-pointer" title="Rollback">
              <RotateCcw size={14} />
            </button>
          )}
          <button onClick={() => onViewLogs(deployment.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-700 transition-colors cursor-pointer" title="View Logs">
            <Terminal size={14} />
          </button>
          <span className="text-xs text-gray-400 font-medium">
            {new Date(deployment.createdAt).toLocaleDateString()}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function DeploymentCenter() {
  const [deployments, setDeployments] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeEnv, setActiveEnv] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogsFor, setShowLogsFor] = useState(null);
  const [showNewDeploy, setShowNewDeploy] = useState(false);
  const [newDeploy, setNewDeploy] = useState({ environmentId: '', version: '', builder: 'manual' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deployRes, envRes, statsRes] = await Promise.all([
        deploymentApi.getDeployments({ limit: 50 }),
        deploymentApi.getEnvironments(),
        deploymentApi.getStats()
      ]);
      setDeployments(deployRes.data.deployments || []);
      setEnvironments(envRes.data.environments || []);
      setStats(statsRes.data.stats || null);
      if (!activeEnv && envRes.data.environments?.length > 0) {
        setActiveEnv(envRes.data.environments[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [activeEnv]);

  useEffect(() => { loadData(); }, []);

  const handleCreateDeployment = async () => {
    try {
      const res = await deploymentApi.createDeployment(newDeploy);
      if (res.data.success) {
        setShowNewDeploy(false);
        setNewDeploy({ environmentId: '', version: '', builder: 'manual' });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRollback = async (deploymentId) => {
    if (!window.confirm('Are you sure you want to rollback to this deployment?')) return;
    try {
      await deploymentApi.executeRollback(deploymentId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleViewLogs = async (deploymentId) => {
    try {
      const res = await deploymentApi.getDeploymentLogs(deploymentId);
      setLogs(res.data.logs || []);
      setShowLogsFor(deploymentId);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (error && !deployments.length) {
    return (
      <CMSWorkspace title="Deployment & Release Center" description="Manage preview staging environments, authorize production deployments, track build logs, and trigger fast rollbacks.">
        <CMSEmptyState
          title="Error Loading Deployments"
          description={error}
          actionText="Retry"
          onAction={loadData}
          icon={XCircle}
        />
      </CMSWorkspace>
    );
  }

  return (
    <CMSWorkspace
      title="Deployment & Release Center"
      description="Manage preview staging environments, authorize production deployments, track build logs, and trigger fast rollbacks."
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Rocket} label="Total Deployments" value={stats?.totalDeployments} color="#6366f1" />
        <StatCard icon={CheckCircle2} label="Active" value={stats?.activeDeployments} color="#059669" />
        <StatCard icon={XCircle} label="Failed" value={stats?.failedDeployments} color="#dc2626" />
        <StatCard icon={Layers} label="Environments" value={stats?.environments} color="#2563eb" />
      </div>

      {/* Environment Tabs */}
      {environments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveEnv(null)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer min-h-[44px] ${!activeEnv ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <span className="flex items-center gap-2">
              <Layers size={14} />
              All Environments
            </span>
          </button>
          {environments.map(env => (
            <EnvironmentTab key={env.id} env={env} active={activeEnv === env.id} onClick={() => setActiveEnv(env.id)} />
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Deployment History</h3>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowNewDeploy(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer min-h-[44px]">
            <Plus size={16} />
            New Deployment
          </button>
        </div>
      </div>

      {/* New Deployment Modal */}
      {showNewDeploy && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewDeploy(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Deployment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Environment</label>
                <select value={newDeploy.environmentId} onChange={e => setNewDeploy(p => ({ ...p, environmentId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Select environment...</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name} ({env.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Version</label>
                <input type="text" value={newDeploy.version} onChange={e => setNewDeploy(p => ({ ...p, version: e.target.value }))} placeholder="e.g. 1.0.0" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Builder</label>
                <select value={newDeploy.builder} onChange={e => setNewDeploy(p => ({ ...p, builder: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="manual">Manual</option>
                  <option value="lovable">Lovable</option>
                  <option value="bolt">Bolt</option>
                  <option value="v0">v0</option>
                  <option value="cursor">Cursor</option>
                  <option value="claude-code">Claude Code</option>
                  <option value="opencode">OpenCode</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowNewDeploy(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer min-h-[44px]">Cancel</button>
              <button onClick={handleCreateDeployment} disabled={!newDeploy.environmentId || !newDeploy.version} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
                <Play size={14} className="inline mr-1" />
                Start Deployment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployments Table */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw size={24} className="animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-gray-500">Loading deployments...</p>
        </div>
      ) : deployments.length === 0 ? (
        <CMSEmptyState
          title="No Active Deployments Logged"
          description="Release verified template versions or configure CDN environment variables."
          actionText="Deploy New Release"
          onAction={() => setShowNewDeploy(true)}
          icon={Rocket}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Environment</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Builder</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Commit</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments
                .filter(d => !activeEnv || d.environmentId === activeEnv)
                .map(dep => (
                  <DeploymentRow key={dep.id} deployment={dep} onRollback={handleRollback} onViewLogs={handleViewLogs} />
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Panel */}
      {showLogsFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4" onClick={() => { setShowLogsFor(null); setLogs([]); }}>
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal size={18} />
                Build Logs
              </h3>
              <button onClick={() => { setShowLogsFor(null); setLogs([]); }} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-2">
                <XCircle size={18} />
              </button>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic p-4">No logs available</p>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id || i} className={`flex items-start gap-2 p-2 rounded ${log.level === 'ERROR' ? 'bg-red-900/20 text-red-300' : log.level === 'WARN' ? 'bg-amber-900/20 text-amber-300' : 'text-gray-300'}`}>
                    <span className="text-gray-500 shrink-0 w-16">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span className={`shrink-0 w-12 font-bold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'}`}>[{log.level}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </CMSWorkspace>
  );
}
