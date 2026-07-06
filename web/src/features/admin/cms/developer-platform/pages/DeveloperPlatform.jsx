import React, { useState, useEffect, useCallback } from 'react';
import {
  getDeveloperOverview, getRegistry, getOpenApi, getDocumentation,
  getSdk, getApiKeys, createApiKey, revokeApiKey, rotateApiKey, deleteApiKey,
  getWebhooks, createWebhook, deleteWebhook,
  getDeveloperAnalytics, getHealth, refreshCache, initializeRegistry
} from '../services/developer.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import CMSLoading from '../../components/CMSLoading';
import { Copy, CheckCircle, XCircle, Key, RefreshCw, Globe, Book, Terminal, Activity, Webhook, Shield, BarChart3, FileText, Code, AlertTriangle, Settings } from 'lucide-react';

const TABS = [
  { id: 'registry', label: 'API Registry', icon: Globe },
  { id: 'explorer', label: 'API Explorer', icon: Terminal },
  { id: 'docs', label: 'API Documentation', icon: Book },
  { id: 'openapi', label: 'OpenAPI', icon: FileText },
  { id: 'sdk', label: 'SDK Downloads', icon: Code },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
  { id: 'health', label: 'API Health', icon: Activity },
  { id: 'testing', label: 'API Testing', icon: Terminal },
  { id: 'versions', label: 'API Versions', icon: FileText },
  { id: 'deprecations', label: 'Deprecations', icon: AlertTriangle },
  { id: 'rate-limits', label: 'Rate Limits', icon: Shield },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'examples', label: 'Examples', icon: Code },
  { id: 'postman', label: 'Postman Collection', icon: Globe },
  { id: 'applications', label: 'Applications', icon: Settings },
  { id: 'oauth', label: 'OAuth Clients', icon: Shield },
  { id: 'graphql', label: 'GraphQL', icon: Terminal },
  { id: 'settings', label: 'Developer Settings', icon: Settings }
];

export default function DeveloperPlatform() {
  const [activeTab, setActiveTab] = useState('registry');
  const [overview, setOverview] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [documentation, setDocumentation] = useState(null);
  const [sdkContent, setSdkContent] = useState('');
  const [sdkLang, setSdkLang] = useState('javascript');
  const [openapi, setOpenapi] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [showRawKey, setShowRawKey] = useState(null);
  const [newKeyForm, setNewKeyForm] = useState({ name: '', environment: 'PRODUCTION' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, reg, keys, wh, an, docs, oa, h] = await Promise.all([
        getDeveloperOverview().catch(() => ({ data: null })),
        getRegistry().catch(() => ({ data: {} })),
        getApiKeys().catch(() => ({ data: [] })),
        getWebhooks().catch(() => ({ data: [] })),
        getDeveloperAnalytics().catch(() => ({ data: null })),
        getDocumentation().catch(() => ({ data: null })),
        getOpenApi().catch(() => ({ data: null })),
        getHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setRegistry(reg.data);
      setApiKeys(keys.data || []);
      setWebhooks(wh.data || []);
      setAnalytics(an.data);
      setDocumentation(docs.data);
      setOpenapi(oa.data);
      setHealth(h.data);
    } catch (e) {
      console.error('Developer load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadSdk(language) {
    setSdkLang(language);
    try {
      const res = await getSdk(language);
      const content = res?.data || '';
      setSdkContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    } catch {}
  }

  async function handleCreateKey() {
    if (!newKeyForm.name) return;
    try {
      const res = await createApiKey(newKeyForm);
      if (res.data) {
        setShowRawKey(res.data.id);
        alert(`API Key created!\n\nKey: ${res.data.raw}\n\nSave this now - it will not be shown again.`);
        loadAll();
      }
    } catch (e) { alert('Failed to create key: ' + e.message); }
  }

  async function handleRevokeKey(id) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try { await revokeApiKey(id); loadAll(); } catch {}
  }

  async function handleRotateKey(id) {
    if (!confirm('Rotate this API key? The current key will stop working.')) return;
    try {
      const res = await rotateApiKey(id);
      if (res.data) {
        alert(`New API Key: ${res.data.raw}\n\nSave this now!`);
        loadAll();
      }
    } catch {}
  }

  async function handleDeleteKey(id) {
    if (!confirm('Delete this API key permanently?')) return;
    try { await deleteApiKey(id); loadAll(); } catch {}
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => { setCopied(text); setTimeout(() => setCopied(null), 2000); });
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'registry':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => { initializeRegistry(); loadAll(); }} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90">Refresh Registry</button>
            </div>
            {registry ? (
              <div className="space-y-3">
                {Object.entries(registry).map(([basePath, info]) => (
                  <div key={basePath} className="bg-white border rounded-lg p-4">
                    <h3 className="font-mono text-sm font-bold text-primary mb-2">{basePath}</h3>
                    <div className="space-y-1">
                      {info.endpoints.map((ep, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-white font-bold ${
                            ep.method === 'GET' ? 'bg-green-500' :
                            ep.method === 'POST' ? 'bg-blue-500' :
                            ep.method === 'PUT' ? 'bg-orange-500' :
                            ep.method === 'PATCH' ? 'bg-yellow-500' :
                            ep.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>{ep.method}</span>
                          <span className="text-gray-700">{ep.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">Registry not loaded</p>}
          </div>
        );

      case 'explorer':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Browse all registered API endpoints grouped by module.</p>
            {registry && Object.entries(registry).map(([basePath, info]) => (
              <details key={basePath} className="bg-white border rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-mono text-sm font-bold text-primary hover:bg-gray-50 rounded-lg">{basePath} <span className="text-gray-400 font-normal">({info.endpoints.length} endpoints)</span></summary>
                <div className="px-4 pb-3 space-y-1">
                  {info.endpoints.map((ep, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono py-1">
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold w-14 text-center ${
                        ep.method === 'GET' ? 'bg-green-500' :
                        ep.method === 'POST' ? 'bg-blue-500' :
                        ep.method === 'PUT' ? 'bg-orange-500' :
                        ep.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>{ep.method}</span>
                      <span className="text-gray-700">{ep.path}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        );

      case 'docs':
        return (
          <div className="space-y-4">
            {documentation ? (
              <>
                <div className="bg-white border rounded-lg p-4">
                  <h2 className="text-lg font-bold">{documentation.title}</h2>
                  <p className="text-xs text-gray-400">Version {documentation.version} | {documentation.totalEndpoints} endpoints | Generated {new Date(documentation.generatedAt).toLocaleString()}</p>
                </div>
                {documentation.groups.map((group, gi) => (
                  <div key={gi} className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2 capitalize">{group.name} <span className="text-gray-400 font-normal">({group.basePath})</span></h3>
                    <div className="space-y-2">
                      {group.endpoints.slice(0, 10).map((ep, ei) => (
                        <div key={ei} className="flex items-start gap-3 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-white font-bold shrink-0 ${
                            ep.method === 'GET' ? 'bg-green-500' : ep.method === 'POST' ? 'bg-blue-500' :
                            ep.method === 'PUT' ? 'bg-orange-500' : ep.method === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>{ep.method}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-gray-700 truncate">{ep.path}</p>
                            <p className="text-gray-400">{ep.description}</p>
                          </div>
                        </div>
                      ))}
                      {group.endpoints.length > 10 && <p className="text-xs text-gray-400">...and {group.endpoints.length - 10} more</p>}
                    </div>
                  </div>
                ))}
              </>
            ) : <p className="text-gray-400 text-sm">Documentation not loaded</p>}
          </div>
        );

      case 'openapi':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">OpenAPI 3.0 specification auto-generated from all route annotations.</p>
            {openapi ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold mb-2">{openapi.info?.title || 'OpenAPI Spec'}</h3>
                <p className="text-xs text-gray-400 mb-4">Version: {openapi.info?.version || 'N/A'} | Paths: {Object.keys(openapi.paths || {}).length}</p>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">{JSON.stringify(openapi, null, 2)}</pre>
              </div>
            ) : <p className="text-gray-400 text-sm">OpenAPI spec available at /api-docs</p>}
          </div>
        );

      case 'sdk':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {['javascript', 'python', 'curl'].map(lang => (
                <button key={lang} onClick={() => loadSdk(lang)} className={`px-3 py-1.5 text-xs rounded-lg border ${sdkLang === lang ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'}`}>{lang}</button>
              ))}
            </div>
            {sdkContent ? (
              <div className="relative">
                <button onClick={() => copyToClipboard(sdkContent)} className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">{copied === sdkContent ? 'Copied!' : 'Copy'}</button>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 border">{sdkContent}</pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Select a language to generate SDK</p>
              </div>
            )}
          </div>
        );

      case 'apikeys':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">Create New API Key</h3>
              <div className="flex gap-2">
                <input value={newKeyForm.name} onChange={e => setNewKeyForm({ ...newKeyForm, name: e.target.value })} placeholder="Key name (e.g., Production CI/CD)" className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                <select value={newKeyForm.environment} onChange={e => setNewKeyForm({ ...newKeyForm, environment: e.target.value })} className="px-3 py-2 text-xs border rounded-lg">
                  <option value="DEVELOPMENT">Development</option>
                  <option value="UAT">UAT</option>
                  <option value="PRODUCTION">Production</option>
                </select>
                <button onClick={handleCreateKey} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">Create Key</button>
              </div>
            </div>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No API keys yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map(k => (
                  <div key={k.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{k.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${
                          k.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          k.status === 'REVOKED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>{k.status}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                          k.environment === 'PRODUCTION' ? 'bg-purple-100 text-purple-700' :
                          k.environment === 'UAT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>{k.environment}</span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 mt-1">{k.prefix}...</p>
                      <p className="text-xs text-gray-400 mt-0.5">Used {k.usageCount} times | Created {new Date(k.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => copyToClipboard(k.prefix + '...')} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" title="Copy prefix"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleRotateKey(k.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Rotate"><RefreshCw className="w-3.5 h-3.5" /></button>
                      {k.status === 'ACTIVE' && <button onClick={() => handleRevokeKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Revoke"><XCircle className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => handleDeleteKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Delete"><AlertTriangle className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'webhooks':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Webhooks deliver real-time events to your endpoints.</p>
            {webhooks.map(w => (
              <div key={w.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{w.name}</p>
                  <p className="text-xs font-mono text-gray-500">{w.url}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Events: {(w.events || []).join(', ')}</p>
                </div>
                <button onClick={() => { deleteWebhook(w.id); loadAll(); }} className="text-xs text-red-600 hover:text-red-800">Delete</button>
              </div>
            ))}
            {webhooks.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No webhooks configured</p>}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total API Keys" value={analytics.totalKeys} icon={Key} color="blue" />
                  <CMSStatsCard title="Active Keys" value={analytics.activeKeys} icon={CheckCircle} color="green" />
                  <CMSStatsCard title="Total Usage" value={analytics.totalUsage} icon={Activity} color="purple" />
                  <CMSStatsCard title="Revoked Keys" value={analytics.revokedKeys || 0} icon={XCircle} color="red" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CMSStatsCard title="API Calls (7 days)" value={analytics.apiCalls?.last7Days || 0} icon={BarChart3} color="blue" />
                  <CMSStatsCard title="API Calls (30 days)" value={analytics.apiCalls?.last30Days || 0} icon={BarChart3} color="indigo" />
                </div>
                {analytics.environmentBreakdown && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3">Environment Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.environmentBreakdown).map(([env, count]) => (
                        <div key={env} className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            env === 'PRODUCTION' ? 'bg-purple-100 text-purple-700' :
                            env === 'UAT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>{env}</span>
                          <span className="font-bold">{count}</span>
                          <span className="text-gray-400">keys</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Analytics not loaded</p></div>}
          </div>
        );

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
            ) : <div className="text-center py-8"><p className="text-sm text-gray-400">Health check not available</p></div>}
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
      title="Developer Platform"
      description="Enterprise API Gateway & Developer Portal — manage all APIs, keys, webhooks, SDKs, and documentation"
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
