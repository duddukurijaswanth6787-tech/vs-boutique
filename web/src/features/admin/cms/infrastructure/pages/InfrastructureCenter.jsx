import React, { useState, useEffect, useCallback } from 'react';
import {
  getInfrastructureOverview, getRegions, createRegion, updateRegion, deleteRegion,
  getInfrastructureEnvironments, getServers, getStorage, getDNS, getSSL,
  getCapacity, getInfrastructureAnalytics, getInfrastructureHealth,
  refreshInfrastructureCache, initializeInfrastructureDefaults
} from '../services/infrastructure.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Shield, Database, Server, Globe, Wifi, Lock, Cloud, BarChart3,
  Activity, HardDrive, Layers, RefreshCw, Clock, Settings, Terminal,
  Map, Users, Eye, BookOpen, Upload, Cpu, DollarSign, CheckCircle,
  AlertTriangle
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Infra Overview', icon: Shield },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'zones', label: 'Availability Zones', icon: Map },
  { id: 'environments', label: 'Deploy Environments', icon: Layers },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'cdn', label: 'CDN', icon: Cloud },
  { id: 'dns', label: 'DNS', icon: Wifi },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'ssl', label: 'SSL', icon: Lock },
  { id: 'load-balancing', label: 'Load Balancing', icon: Activity },
  { id: 'traffic', label: 'Traffic', icon: BarChart3 },
  { id: 'capacity', label: 'Capacity', icon: Cpu },
  { id: 'queue-health', label: 'Queue Health', icon: Clock },
  { id: 'env-vars', label: 'Environment Variables', icon: Terminal },
  { id: 'deployments', label: 'Deployments', icon: Upload },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'disaster-recovery', label: 'Disaster Recovery', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'recommendations', label: 'Recommendations', icon: BookOpen },
  { id: 'health', label: 'Health', icon: CheckCircle },
  { id: 'costs', label: 'Costs', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'infra-map', label: 'Infrastructure Map', icon: Map }
];

export default function InfrastructureCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [regions, setRegions] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [servers, setServers] = useState([]);
  const [storage, setStorage] = useState(null);
  const [dns, setDns] = useState([]);
  const [ssl, setSsl] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regionName, setRegionName] = useState('');
  const [regionProvider, setRegionProvider] = useState('aws');
  const [regionLocations, setRegionLocations] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, rg, ev, sv, st, dn, sl, ca, an, he] = await Promise.all([
        getInfrastructureOverview().catch(() => ({ data: null })),
        getRegions().catch(() => ({ data: [] })),
        getInfrastructureEnvironments().catch(() => ({ data: [] })),
        getServers().catch(() => ({ data: [] })),
        getStorage().catch(() => ({ data: null })),
        getDNS().catch(() => ({ data: [] })),
        getSSL().catch(() => ({ data: [] })),
        getCapacity().catch(() => ({ data: null })),
        getInfrastructureAnalytics().catch(() => ({ data: null })),
        getInfrastructureHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setRegions(rg.data || []);
      setEnvs(ev.data || []);
      setServers(sv.data || []);
      setStorage(st.data);
      setDns(dn.data || []);
      setSsl(sl.data || []);
      setCapacity(ca.data);
      setAnalytics(an.data);
      setHealth(he.data);
    } catch (e) {
      console.error('Infra load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreateRegion() {
    if (!regionName) return alert('Enter a region name');
    try {
      await createRegion({ name: regionName, provider: regionProvider, locations: regionLocations.split(',').map(s => s.trim()).filter(Boolean) });
      setRegionName(''); setRegionProvider('aws'); setRegionLocations('');
      const res = await getRegions();
      setRegions(res.data || []);
    } catch (e) { alert('Failed to create region: ' + e.message); }
  }

  async function handleDeleteRegion(id) {
    if (!window.confirm('Delete this region?')) return;
    try {
      await deleteRegion(id);
      const res = await getRegions();
      setRegions(res.data || []);
    } catch (e) { alert('Failed: ' + e.message); }
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
                  <CMSStatsCard title="Infra Score" value={overview.infrastructureScore != null ? `${overview.infrastructureScore}/100` : 'N/A'} icon={Shield} color="green" />
                  <CMSStatsCard title="Environments" value={overview.environments?.total || 0} icon={Layers} color="blue" />
                  <CMSStatsCard title="Domains (DNS)" value={overview.dns?.total || 0} icon={Globe} color="purple" />
                  <CMSStatsCard title="SSL Active" value={overview.ssl?.active || 0} icon={Lock} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="CDN" value={overview.cdn?.enabled ? 'Enabled' : 'Disabled'} icon={Cloud} color="blue" />
                  <CMSStatsCard title="Regions" value={overview.regions?.total || 0} icon={Map} color="green" />
                  <CMSStatsCard title="Deployments" value={overview.capacity?.deployments || 0} icon={Upload} color="purple" />
                  <CMSStatsCard title="Storage" value={overview.capacity?.storageMB ? `${overview.capacity.storageMB} MB` : '0 MB'} icon={HardDrive} color="indigo" />
                </div>
                {overview.riskLevel && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Infrastructure Risk: {renderRiskBadge(overview.riskLevel)}</h3>
                    <p className="text-xs text-gray-400">Last updated: {new Date(overview.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Loading overview...</p></div>}
          </div>
        );

      case 'regions':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">Create Region</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <input value={regionName} onChange={e => setRegionName(e.target.value)} placeholder="Region name..." className="flex-1 min-w-[120px] px-3 py-2 text-xs border rounded-lg" />
                <select value={regionProvider} onChange={e => setRegionProvider(e.target.value)} className="px-3 py-2 text-xs border rounded-lg">
                  <option value="aws">AWS</option>
                  <option value="gcp">GCP</option>
                  <option value="azure">Azure</option>
                </select>
                <input value={regionLocations} onChange={e => setRegionLocations(e.target.value)} placeholder="Locations (comma-separated)..." className="flex-1 min-w-[150px] px-3 py-2 text-xs border rounded-lg" />
                <button onClick={handleCreateRegion} className="px-3 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">Add Region</button>
              </div>
            </div>
            {regions.length === 0 ? (
              <div className="text-center py-8"><Globe className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No regions configured. Regions stored in CmsAiSettings.</p></div>
            ) : (
              <div className="space-y-2">
                {regions.map(r => (
                  <div key={r.id} className="bg-white border rounded-lg p-4 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="font-bold">{r.name || r.key}</span>
                        <span className={`px-1.5 py-0.5 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                      </div>
                      <button onClick={() => handleDeleteRegion(r.id)} className="text-red-500 hover:underline">Delete</button>
                    </div>
                    <p className="text-gray-400">Provider: {r.provider} | Envs: {r.environmentCount} | Domains: {r.domainCount}</p>
                    {r.locations?.length > 0 && <p className="text-gray-400">Locations: {r.locations.join(', ')}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'zones':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Availability zones discovered from region configurations.</p>
            {regions.length === 0 ? (
              <div className="text-center py-8"><Map className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No zones — configure regions first</p></div>
            ) : (
              <div className="space-y-2">
                {regions.map(r => (
                  <div key={r.id} className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">{r.name || r.key} Zones</h3>
                    <div className="flex flex-wrap gap-2">
                      {(r.locations || ['default']).map(loc => (
                        <span key={loc} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{loc}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'environments':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment environments discovered from DeploymentEnvironment model.</p>
            {envs.length === 0 ? (
              <div className="text-center py-8"><Layers className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No environments found</p></div>
            ) : (
              <div className="space-y-2">
                {envs.map(e => (
                  <div key={e.id} className="bg-white border rounded-lg p-4 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{e.name}</span>
                      <span className="text-gray-400">{e.type}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${e.health === 'healthy' ? 'bg-green-100 text-green-700' : e.health === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{e.health}</span>
                      {renderScoreBadge(e.recentFailures > 0 ? Math.max(0, 100 - e.recentFailures * 20) : 100)}
                    </div>
                    <p className="text-gray-400">Deployments: {e.deploymentCount} | Domains: {e.domainCount} | Variables: {e.variableCount}</p>
                    {e.latestDeployment && <p className="text-gray-400">Last: v{e.latestDeployment.version} ({e.latestDeployment.status})</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'servers':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Servers discovered from DeploymentEnvironment model — each environment represents a server target.</p>
            {servers.length === 0 ? (
              <div className="text-center py-8"><Server className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No servers found</p></div>
            ) : (
              <div className="space-y-2">
                {servers.map(s => (
                  <div key={s.id} className="bg-white border rounded-lg p-4 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="w-4 h-4 text-gray-400" />
                      <span className="font-bold">{s.name}</span>
                      <span className="text-gray-400">{s.type}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${s.status === 'healthy' ? 'bg-green-100 text-green-700' : s.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{s.status}</span>
                    </div>
                    <p className="text-gray-400">Deployments: {s.deploymentCount} | Domains: {s.domainCount} | Failures (24h): {s.recentFailures}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-4">
            {storage ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Storage" value={storage.totalMB ? `${storage.totalMB} MB` : '0 MB'} icon={HardDrive} color="blue" />
                  <CMSStatsCard title="Deployments" value={storage.deployments || 0} icon={Upload} color="green" />
                  <CMSStatsCard title="Artifacts" value={storage.artifacts || 0} icon={Database} color="purple" />
                  <CMSStatsCard title="Assets" value={storage.assets || 0} icon={Cloud} color="indigo" />
                </div>
                {storage.score != null && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2">Storage Health: {renderScoreBadge(storage.score)}</h3>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><HardDrive className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Storage data not loaded</p></div>}
          </div>
        );

      case 'cdn':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">CDN configuration stored in CmsAiSettings (category: cdn). Asset CDN URLs discovered from AssetLibrary meta.</p>
            {overview?.cdn ? (
              <div className="bg-white border rounded-lg p-6 text-center">
                <Cloud className={`w-12 h-12 mx-auto mb-2 ${overview.cdn.enabled ? 'text-green-500' : 'text-gray-300'}`} />
                <h3 className="font-bold text-sm">{overview.cdn.enabled ? 'CDN Active' : 'CDN Not Configured'}</h3>
                <p className="text-xs text-gray-400 mt-1">Score: {renderScoreBadge(overview.cdn.score)}</p>
              </div>
            ) : <div className="text-center py-8"><Cloud className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">CDN data not loaded</p></div>}
          </div>
        );

      case 'dns':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">DNS infrastructure discovered from DeploymentDomain model — verification and propagation status.</p>
            {dns.length === 0 ? (
              <div className="text-center py-8"><Wifi className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No DNS records found</p></div>
            ) : (
              <div className="space-y-2">
                {dns.map(d => (
                  <div key={d.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <span className="font-bold">{d.domain}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${d.dnsVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.dnsVerified ? 'Verified' : 'Pending'}
                      </span>
                      <span className="text-gray-400 ml-auto">{d.propagationStatus}</span>
                    </div>
                    {d.cnameTarget && <p className="text-gray-400">CNAME: {d.cnameTarget}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'domains':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">All deployment domains from DeploymentDomain model.</p>
            {dns.length === 0 ? (
              <div className="text-center py-8"><Globe className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No domains found</p></div>
            ) : (
              <div className="space-y-2">
                {dns.map(d => (
                  <div key={d.id} className="bg-white border rounded-lg p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold">{d.domain}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full ${
                        d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        d.status === 'SSL_PENDING' ? 'bg-blue-100 text-blue-700' :
                        d.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}>{d.status}</span>
                    </div>
                    <span className="text-gray-400">{d.propagationStatus || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'ssl':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">SSL certificate status from DeploymentDomain sslStatus/sslExpiresAt fields.</p>
            {ssl.length === 0 ? (
              <div className="text-center py-8"><Lock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No SSL data found</p></div>
            ) : (
              <div className="space-y-2">
                {ssl.map(s => (
                  <div key={s.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="font-bold">{s.domain}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        s.sslStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        s.sslStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        s.sslStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>{s.sslStatus || 'N/A'}</span>
                    </div>
                    <p className="text-gray-400">
                      {s.daysUntilExpiry !== null ? `${s.daysUntilExpiry} days until expiry` : 'No expiry set'}
                      {s.sslExpiresAt ? ` | Expires: ${new Date(s.sslExpiresAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'load-balancing':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Load balancing inferred from DNS CNAME targets and active domain distribution across environments.</p>
            <div className="bg-white border rounded-lg p-6 text-center">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Load balancing status aggregated from {dns.length} DNS records across {envs.length} environments</p>
            </div>
          </div>
        );

      case 'traffic':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Traffic metrics derived from deployment activity and Prometheus metrics.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CMSStatsCard title="Total Deployments" value={capacity?.deployments?.total || 0} icon={BarChart3} color="blue" />
              <CMSStatsCard title="Recent (7d)" value={capacity?.deployments?.recent7d || 0} icon={Activity} color="green" />
              <CMSStatsCard title="Queue Depth" value={capacity?.queue?.depth || 0} icon={Clock} color="purple" />
            </div>
          </div>
        );

      case 'capacity':
        return (
          <div className="space-y-4">
            {capacity ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Deployments" value={capacity.deployments?.total || 0} icon={Upload} color="blue" />
                  <CMSStatsCard title="Environments" value={capacity.environments} icon={Layers} color="green" />
                  <CMSStatsCard title="Domains" value={capacity.domains} icon={Globe} color="purple" />
                  <CMSStatsCard title="Storage" value={capacity.storage?.totalMB ? `${capacity.storage.totalMB} MB` : '0 MB'} icon={HardDrive} color="indigo" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2">Capacity Score: {renderScoreBadge(capacity.score?.overall)}</h3>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${capacity.score?.overall >= 80 ? 'bg-green-500' : capacity.score?.overall >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${capacity.score?.overall || 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Level: <span className="font-bold capitalize">{capacity.score?.level}</span></p>
                </div>
              </>
            ) : <div className="text-center py-8"><Cpu className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Capacity data not loaded</p></div>}
          </div>
        );

      case 'queue-health':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment Queue health — reused from existing DeploymentQueue (BullMQ + in-memory fallback).</p>
            {capacity?.queue ? (
              <div className="grid grid-cols-2 gap-4">
                <CMSStatsCard title="Queue Depth" value={capacity.queue.depth} icon={Clock} color="blue" />
                <CMSStatsCard title="Redis" value={capacity.queue.redisConnected ? 'Connected' : 'In-Memory'} icon={Database} color={capacity.queue.redisConnected ? 'green' : 'yellow'} />
              </div>
            ) : <div className="text-center py-8"><Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Queue data not loaded</p></div>}
          </div>
        );

      case 'env-vars':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Environment variables across all environments — AES-256-GCM encrypted at rest.</p>
            <div className="bg-white border rounded-lg p-6 text-center">
              <Terminal className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-sm">{capacity?.variables || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Total variables across {envs.length} environments</p>
            </div>
          </div>
        );

      case 'deployments':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Deployment activity — reused from existing Deployment model.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CMSStatsCard title="Total" value={capacity?.deployments?.total || 0} icon={Upload} color="blue" />
              <CMSStatsCard title="Last 7 Days" value={capacity?.deployments?.recent7d || 0} icon={Activity} color="green" />
              <CMSStatsCard title="Artifacts" value={capacity?.artifacts || 0} icon={Database} color="purple" />
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Monitoring status — reused from existing Monitoring Center.</p>
            <div className="bg-white border rounded-lg p-6 text-center">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Monitoring infrastructure connected. See Monitoring Center for detailed metrics.</p>
              {health?.dimensions?.monitoringStatus && (
                <p className="text-xs text-gray-500 mt-2">Score: {renderScoreBadge(health.dimensions.monitoringStatus.score)}</p>
              )}
            </div>
          </div>
        );

      case 'disaster-recovery':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Disaster Recovery status — reused from existing Disaster Recovery Center.</p>
            <div className="bg-white border rounded-lg p-6 text-center">
              <Shield className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">DR health integrated into infrastructure score.</p>
              {health?.dimensions?.disasterRecovery && (
                <p className="text-xs text-gray-500 mt-2">DR Score: {renderScoreBadge(health.dimensions.disasterRecovery.score)}</p>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Infra Score" value={analytics.score?.overall != null ? `${analytics.score.overall}/100` : 'N/A'} icon={BarChart3} color="green" />
                  <CMSStatsCard title="Environments" value={analytics.environments?.totalEnvironments || 0} icon={Layers} color="blue" />
                  <CMSStatsCard title="SSL Coverage" value={analytics.ssl?.coveragePercent != null ? `${analytics.ssl.coveragePercent}%` : 'N/A'} icon={Lock} color="purple" />
                  <CMSStatsCard title="DNS Coverage" value={analytics.dns?.coveragePercent != null ? `${analytics.dns.coveragePercent}%` : 'N/A'} icon={Wifi} color="indigo" />
                </div>
                {analytics.score?.dimensions && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3">Score Dimensions</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.score.dimensions).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="w-32 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${val.score >= 80 ? 'bg-green-500' : val.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val.score}%` }} />
                          </div>
                          <span className="font-bold w-8 text-right">{val.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Analytics not loaded</p></div>}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Infrastructure recommendations — reuse Customer Success recommendation engine pattern.</p>
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Infrastructure Health Insights</h3>
              <div className="space-y-3">
                {health?.dimensions ? (
                  <>
                    {Object.entries(health.dimensions).filter(([, v]) => v.score < 60).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-xs text-red-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}: {val.score}/100</p>
                          <p className="text-xs text-red-500">Score below threshold — infrastructure attention required</p>
                        </div>
                      </div>
                    ))}
                    {Object.entries(health.dimensions).filter(([, v]) => v.score >= 60).length === Object.keys(health.dimensions).length && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-green-700">All infrastructure dimensions healthy</p>
                      </div>
                    )}
                  </>
                ) : <p className="text-xs text-gray-400">No recommendations available</p>}
              </div>
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            {health ? (
              <>
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${health.overall >= 80 ? 'bg-green-100' : health.overall >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <CheckCircle className={`w-10 h-10 ${health.overall >= 80 ? 'text-green-600' : health.overall >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                  </div>
                  <h2 className="text-2xl font-bold">{health.overall}/100</h2>
                  <p className="text-sm text-gray-500 mt-1">Infrastructure Health: {renderRiskBadge(health.riskLevel)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(health.dimensions || {}).map(([key, val]) => (
                    <div key={key} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                        {renderScoreBadge(val.score)}
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${val.score >= 80 ? 'bg-green-500' : val.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center py-8"><CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Health score not loaded</p></div>}
          </div>
        );

      case 'costs':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Infrastructure cost estimation — calculated from storage, deployments, and domain counts.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CMSStatsCard title="Storage" value={capacity?.storage?.totalMB ? `${capacity.storage.totalMB} MB` : '0 MB'} icon={HardDrive} color="blue" />
              <CMSStatsCard title="Environments" value={capacity?.environments || 0} icon={Layers} color="green" />
              <CMSStatsCard title="Domains" value={capacity?.domains || 0} icon={Globe} color="purple" />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-bold text-sm mb-4">Infrastructure Center Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Data Sources</p>
                    <p className="text-xs text-gray-400">All data aggregated from existing models — zero new Prisma models</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Reuse Only</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Cache</p>
                    <p className="text-xs text-gray-400">13th Redis cache with prefix cms:infra:</p>
                  </div>
                  <button onClick={async () => { await refreshInfrastructureCache(); alert('Cache cleared!'); }} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                    <RefreshCw className="w-3 h-3 inline mr-1" />Clear Cache
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Policy Storage</p>
                    <p className="text-xs text-gray-400">Stored in CmsAiSettings (infrastructure, region, cdn, dns, ssl, capacity)</p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">CmsAiSettings</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Infrastructure Score</p>
                    <p className="text-xs text-gray-400">9-dimension weighted — dynamically calculated, never persisted</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Dynamic</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Defaults</p>
                    <p className="text-xs text-gray-400">Seed default infrastructure policies</p>
                  </div>
                  <button onClick={async () => { await initializeInfrastructureDefaults(); alert('Defaults initialized!'); }} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                    <Settings className="w-3 h-3 inline mr-1" />Initialize
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'infra-map':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Infrastructure topology map — visual representation of all infrastructure components.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4 text-center">
                <Globe className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <h3 className="font-bold text-sm">{regions.length} Regions</h3>
                <p className="text-xs text-gray-400">Infrastructure regions</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Layers className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <h3 className="font-bold text-sm">{envs.length} Environments</h3>
                <p className="text-xs text-gray-400">Deployment targets</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Globe className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <h3 className="font-bold text-sm">{dns.length} Domains</h3>
                <p className="text-xs text-gray-400">DNS records</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Lock className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                <h3 className="font-bold text-sm">{ssl.length} SSL Certs</h3>
                <p className="text-xs text-gray-400">SSL certificates</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <HardDrive className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <h3 className="font-bold text-sm">{capacity?.storage?.totalMB || 0} MB</h3>
                <p className="text-xs text-gray-400">Storage used</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <h3 className="font-bold text-sm">{capacity?.deployments?.total || 0} Deployments</h3>
                <p className="text-xs text-gray-400">Total deployments</p>
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
      title="Infrastructure Center"
      description="Enterprise Multi-Region Infrastructure Manager — orchestration-only dashboard over existing deployment infrastructure"
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
