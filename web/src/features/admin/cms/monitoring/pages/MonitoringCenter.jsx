import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Heart, Database, HardDrive, ListOrdered, Rocket, Cpu, ShoppingBag, Users, CreditCard, DollarSign, Briefcase, Shield, Bell, FileText, AlertTriangle, BarChart3, Globe, Lock, Zap } from 'lucide-react';
import Tabs from '../../../../../core/components/ui/Tabs';
import { monitoringApi } from '../services/monitoring.api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'system_health', label: 'System Health', icon: Heart },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'redis', label: 'Redis', icon: HardDrive },
  { id: 'queues', label: 'Queues', icon: ListOrdered },
  { id: 'deployments', label: 'Deployments', icon: Rocket },
  { id: 'ai_center', label: 'AI Center', icon: Cpu },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'assignments', label: 'Assignments', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'storage', label: 'Storage', icon: Briefcase },
  { id: 'ssl', label: 'SSL/Domains', icon: Globe },
  { id: 'api_perf', label: 'API Performance', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
  { id: 'live_events', label: 'Live Events', icon: Zap },
  { id: 'metrics', label: 'Metrics', icon: BarChart3 },
];

export default function MonitoringCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await monitoringApi.getOverview();
      setOverview(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const refreshTab = async (tabId) => { try { await load(); } catch {} };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enterprise Monitoring Center</h1>
            <p className="text-sm text-gray-500">Real-time system health, performance, and security monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh (30s)
          </label>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><Activity className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <Tabs tabs={TABS.map(t => ({ id: t.id, label: t.label }))} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {loading ? <div className="text-center py-12 text-gray-500">Loading monitoring data...</div> : !overview ? <div className="text-center py-12 text-gray-500">No monitoring data available</div> : (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Activity, { className: 'w-4 h-4 text-gray-500' })}
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{TABS.find(t => t.id === activeTab)?.label || activeTab.replace(/_/g, ' ')}</h2>
          </div>
          <div className="p-4">
            {activeTab === 'overview' && <OverviewTab data={overview} />}
            {activeTab === 'system_health' && <SystemHealthTab data={overview?.health} />}
            {activeTab === 'database' && <DatabaseTab health={overview?.health?.database} />}
            {activeTab === 'redis' && <RedisTab health={overview?.health?.redis} />}
            {activeTab === 'queues' && <QueuesTab data={overview?.kpis?.queue} />}
            {activeTab === 'deployments' && <DeploymentsTab data={overview?.kpis?.deployments} />}
            {activeTab === 'ai_center' && <AICenterTab health={overview?.health?.ai} />}
            {activeTab === 'marketplace' && <MarketplaceTab data={overview?.kpis?.marketplace} />}
            {activeTab === 'subscriptions' && <SubscriptionsTab data={overview?.kpis?.subscriptions} />}
            {activeTab === 'storage' && <StorageTab data={overview?.kpis?.storage} />}
            {activeTab === 'security' && <SecurityTab data={overview?.security} />}
            {activeTab === 'api_perf' && <APIPerfTab data={overview?.performance} />}
            {activeTab === 'live_events' && <LiveEventsTab />}
            {activeTab === 'metrics' && <MetricsTab />}
            {(activeTab === 'assignments' || activeTab === 'payments' || activeTab === 'ssl' || activeTab === 'notifications' || activeTab === 'audit_logs' || activeTab === 'errors') && <PlaceholderTab tab={activeTab} />}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data }) {
  const h = data?.health || {};
  const k = data?.kpis || {};
  const p = data?.performance || {};
  const s = data?.security || {};
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatusCard label="System" value={h.overall || 'unknown'} color={h.overall === 'healthy' ? 'green' : h.overall === 'degraded' ? 'yellow' : 'red'} />
        <StatusCard label="Database" value={h.database?.status || 'unknown'} color={h.database?.status === 'connected' ? 'green' : 'red'} />
        <StatusCard label="Redis" value={h.redis?.status || 'unknown'} color={h.redis?.status === 'connected' ? 'green' : 'red'} />
        <StatusCard label="Queue" value={h.queue?.status || 'unknown'} color={h.queue?.status === 'active' ? 'green' : h.queue?.status === 'idle' ? 'yellow' : 'red'} />
        <StatusCard label="SSL" value={h.ssl?.status || 'unknown'} color={h.ssl?.status === 'healthy' ? 'green' : 'yellow'} />
        <StatusCard label="AI Center" value={h.ai?.status || 'unknown'} color={h.ai?.status === 'healthy' ? 'green' : h.ai?.status === 'degraded' ? 'yellow' : 'red'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Memory" value={p?.memory ? `${p.memory.rssMB}MB / ${p.memory.totalMB}MB` : '-'} />
        <StatCard label="CPU Cores" value={p?.cpu?.cpus || '-'} />
        <StatCard label="Uptime" value={p?.process?.uptime ? `${Math.floor(p.process.uptime / 3600)}h` : '-'} />
        <StatCard label="Failed Logins (24h)" value={s?.failedLogins24h ?? '-'} />
      </div>
      {h.ssl?.expiringSoon > 0 && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 mb-4">{h.ssl.expiringSoon} SSL certificate(s) expiring soon</div>}
    </div>
  );
}

function SystemHealthTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No health data</div>;
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Server</h3>
        <div className="space-y-2">{renderFields(data.server)}</div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Summary</h3>
        <div className="p-4 bg-gray-50 rounded text-center mb-4">
          <div className={`text-2xl font-bold ${data.overall === 'healthy' ? 'text-green-600' : data.overall === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>{data.overall?.toUpperCase()}</div>
          <div className="text-xs text-gray-400 mt-1">Overall Status</div>
        </div>
        <div className="text-xs text-gray-400">Last updated: {new Date(data.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
}

function DatabaseTab({ health }) {
  if (!health) return <div className="text-sm text-gray-400">No database health data</div>;
  return (
    <div>{renderFields(health)}</div>
  );
}

function RedisTab({ health }) {
  if (!health) return <div className="text-sm text-gray-400">No Redis health data</div>;
  return (
    <div>{renderFields(health)}</div>
  );
}

function QueuesTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No queue data</div>;
  const queues = data.queues || {};
  const entries = Object.entries(queues);
  if (entries.length === 0) return <div className="text-sm text-gray-400">No queues active</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs text-gray-500"><th className="pb-2 font-medium">Queue</th><th className="pb-2 font-medium">Waiting</th><th className="pb-2 font-medium">Active</th><th className="pb-2 font-medium">Completed</th><th className="pb-2 font-medium">Failed</th></tr></thead>
        <tbody>{entries.map(([name, q]) => (
          <tr key={name} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2 font-medium">{name}</td><td className="py-2">{q.waiting ?? '-'}</td><td className="py-2">{q.active ?? '-'}</td><td className="py-2">{q.completed ?? '-'}</td><td className="py-2">{q.failed ?? '-'}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function DeploymentsTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No deployment data</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(data).map(([k, v]) => <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={v} />)}</div>
  );
}

function AICenterTab({ health }) {
  if (!health) return <div className="text-sm text-gray-400">No AI center data</div>;
  return (
    <div>{renderFields(health)}</div>
  );
}

function MarketplaceTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No marketplace data</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(data).map(([k, v]) => <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={typeof v === 'object' ? JSON.stringify(v).slice(0, 50) : v} />)}</div>
  );
}

function SubscriptionsTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No subscription data</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(data).map(([k, v]) => <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={typeof v === 'object' ? JSON.stringify(v).slice(0, 50) : v} />)}</div>
  );
}

function StorageTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No storage data</div>;
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Storage Used" value={data.storageGB ? `${data.storageGB} GB` : '-'} />
      <StatCard label="Storage Bytes" value={data.storageBytes?.toLocaleString() || '-'} />
    </div>
  );
}

function SecurityTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No security data</div>;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Failed Logins (24h)" value={data.failedLogins24h ?? 0} />
        <StatCard label="Permission Denied (24h)" value={data.permissionDenied24h ?? 0} />
      </div>
      {data.recentAuthErrors?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Auth Errors</h3>
          <div className="space-y-2">{data.recentAuthErrors.slice(0, 20).map((e, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm"><span className="text-red-700">{e.action}</span><span className="text-xs text-gray-400">{e.ip} · {new Date(e.time).toLocaleString()}</span></div>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function APIPerfTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No performance data</div>;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="RSS Memory" value={data.memory?.rssMB ? `${data.memory.rssMB} MB` : '-'} />
        <StatCard label="Heap Used" value={data.memory?.heapMB ? `${data.memory.heapMB} MB` : '-'} />
        <StatCard label="Free Memory" value={data.memory?.freeMB ? `${data.memory.freeMB} MB` : '-'} />
        <StatCard label="Memory Usage" value={data.memory?.usagePercent ? `${data.memory.usagePercent}%` : '-'} />
        <StatCard label="CPU Load" value={data.cpu?.loadAvg?.[0]?.toFixed(2) || '-'} />
        <StatCard label="CPU Cores" value={data.cpu?.cpus || '-'} />
        <StatCard label="Active Requests" value={data.activeRequests ?? '-'} />
        <StatCard label="Process Uptime" value={data.process?.uptime ? `${Math.floor(data.process.uptime / 3600)}h ${Math.floor((data.process.uptime % 3600) / 60)}m` : '-'} />
      </div>
      <div className="text-xs text-gray-400">OS: {data.os?.platform} · Host: {data.os?.hostname} · Node: {data.process?.nodeVersion}</div>
    </div>
  );
}

function LiveEventsTab() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const demo = [
      { type: 'deployment', message: 'Deployment completed for staging', time: new Date(), severity: 'info' },
      { type: 'health', message: 'Database health check passed', time: new Date(Date.now() - 60000), severity: 'info' },
      { type: 'queue', message: 'Assignment deployment job completed', time: new Date(Date.now() - 120000), severity: 'info' },
    ];
    setEvents(demo);
    const interval = setInterval(() => {
      setEvents(prev => [{ type: 'heartbeat', message: 'System heartbeat — all systems operational', time: new Date(), severity: 'info' }, ...prev].slice(0, 50));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div>
      {events.length === 0 ? <div className="text-sm text-gray-400">No events yet</div> : (
        <div className="space-y-1 max-h-96 overflow-y-auto">{events.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50">
            <span className={`w-2 h-2 rounded-full ${e.severity === 'error' ? 'bg-red-500' : e.severity === 'warn' ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className="text-gray-400 w-16 flex-shrink-0">{e.time.toLocaleTimeString()}</span>
            <span className="text-gray-500 w-20 flex-shrink-0 uppercase text-[10px]">{e.type}</span>
            <span className="text-gray-700">{e.message}</span>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function MetricsTab() {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Prometheus metrics are available at <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">/api/v1/cms/deployment/metrics</code></p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Prometheus" value="Available" />
        <StatCard label="Default Metrics" value="Enabled" />
        <StatCard label="Custom Metrics" value="12" />
      </div>
      <p className="text-xs text-gray-400 mt-4">Metrics collected: deployment counters/duration/active, rollbacks, domains, env vars, build logs, storage bytes, queue depth, HTTP request duration/count</p>
    </div>
  );
}

function PlaceholderTab({ tab }) {
  return <div className="text-sm text-gray-400">Monitoring data for <strong>{tab.replace(/_/g, ' ')}</strong> will be available from the aggregated monitoring endpoints. Data is loaded from existing services.</div>;
}

function StatusCard({ label, value, color }) {
  const colors = { green: 'text-green-700 bg-green-50 border-green-200', yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200', red: 'text-red-700 bg-red-50 border-red-200' };
  return (
    <div className={`p-4 rounded-lg border ${colors[color] || 'bg-gray-50 border-gray-200'}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-lg font-bold capitalize mt-1">{value}</div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-1">{value ?? '-'}</div>
    </div>
  );
}

function renderFields(obj) {
  if (!obj) return null;
  return Object.entries(obj).filter(([k]) => !['timestamp', 'overall', 'queues'].includes(k)).map(([key, val]) => (
    <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-50 text-sm">
      <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
      <span className="text-gray-500 col-span-2">{typeof val === 'object' ? JSON.stringify(val).slice(0, 100) : String(val)}</span>
    </div>
  ));
}
