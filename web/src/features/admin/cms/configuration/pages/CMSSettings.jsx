import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Globe, Palette, Cpu, Server, HardDrive, Mail, Database, Shield, Flag, FileJson, Globe2, Puzzle, BarChart3, Activity, Clock, Wrench, Languages, RefreshCw, Save, RotateCcw } from 'lucide-react';
import Tabs from '../../../../../core/components/ui/Tabs';
import { settingsApi } from '../services/settings.api';

const TAB_GROUPS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'ai_providers', label: 'AI Providers', icon: Cpu },
  { id: 'deployment', label: 'Deployment', icon: Server },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'smtp', label: 'SMTP', icon: Mail },
  { id: 'redis', label: 'Redis', icon: Database },
  { id: 'queue', label: 'Queue', icon: Activity },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'feature_flag', label: 'Feature Flags', icon: Flag },
  { id: 'environment_variables', label: 'Env Variables', icon: FileJson },
  { id: 'domains', label: 'Domains', icon: Globe2 },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
  { id: 'backup', label: 'Backups', icon: Clock },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'localization', label: 'Localization', icon: Languages },
];

export default function CMSSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getAll();
      setAllData(res.data || {});
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshTab = async (tabId) => {
    try {
      const res = await settingsApi.getCategory(tabId);
      setAllData(prev => ({ ...prev, [tabId]: res.data }));
    } catch {}
  };

  const handleSave = async () => {
    const category = activeTab;
    const data = editing;
    if (Object.keys(data).length === 0) return;
    setSaving(true);
    try {
      const res = await settingsApi.updateCategory(category, data);
      setAllData(prev => ({ ...prev, [category]: res.data }));
      setEditing({});
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleInit = async () => {
    if (!confirm('Reset all settings to defaults? Existing values will be preserved.')) return;
    try {
      await settingsApi.initialize();
      await load();
    } catch (err) { alert(err.message); }
  };

  const changeValue = (key, rawValue) => {
    let value = rawValue;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = Number(value);
    setEditing(prev => ({ ...prev, [key]: value }));
  };

  const hasEdits = Object.keys(editing).length > 0;

  const TabIcon = TAB_GROUPS.find(t => t.id === activeTab)?.icon || Settings;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Settings className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CMS Settings</h1>
            <p className="text-sm text-gray-500">Central configuration hub for the Antaire platform</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInit} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RotateCcw className="w-4 h-4" /> Initialize Defaults</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <Tabs tabs={TAB_GROUPS.map(t => ({ id: t.id, label: t.label }))} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {loading ? <div className="text-center py-12 text-gray-500">Loading settings...</div> : !allData ? <div className="text-center py-12 text-gray-500">No settings data. Click "Initialize Defaults" to get started.</div> : (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <TabIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{activeTab.replace(/_/g, ' ')}</h2>
          </div>
          <div className="p-4">
            {activeTab === 'general' && renderGeneral(allData.general, editing, changeValue)}
            {activeTab === 'branding' && renderBranding(allData.branding)}
            {activeTab === 'ai_providers' && renderAiProviders(allData.ai_providers)}
            {activeTab === 'deployment' && renderDeployment(allData.deployment)}
            {activeTab === 'storage' && renderStorage(allData.storage, editing, changeValue)}
            {activeTab === 'smtp' && renderSmtp(allData.smtp, editing, changeValue)}
            {activeTab === 'redis' && renderRedis(allData.redis, editing, changeValue)}
            {activeTab === 'queue' && renderQueue(allData.queue, editing, changeValue)}
            {activeTab === 'security' && renderSecurity(allData.security, editing, changeValue)}
            {activeTab === 'feature_flag' && renderFeatureFlags(allData.feature_flag, editing, changeValue)}
            {activeTab === 'environment_variables' && renderEnvVars(allData.environment_variables)}
            {activeTab === 'domains' && renderDomains(allData.domains)}
            {activeTab === 'integrations' && renderIntegrations(allData.integration, editing, changeValue)}
            {activeTab === 'monitoring' && renderMonitoring(allData.monitoring, editing, changeValue)}
            {activeTab === 'backup' && renderBackup(allData.backup, editing, changeValue)}
            {activeTab === 'maintenance' && renderMaintenance(allData.maintenance, editing, changeValue)}
            {activeTab === 'analytics' && renderAnalytics(allData.analytics, editing, changeValue)}
            {activeTab === 'localization' && renderLocalization(allData.localization, editing, changeValue)}

            {hasEdits && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditableRow({ label, description, value, onChange, type }) {
  const inputType = type === 'boolean' ? 'select' : type === 'number' ? 'number' : 'text';
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-50 last:border-0">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && <div className="text-xs text-gray-400">{description}</div>}
      </div>
      <div>
        {inputType === 'select' ? (
          <select value={String(value)} onChange={e => onChange(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full">
            <option value="true">Enabled</option><option value="false">Disabled</option>
          </select>
        ) : (
          <input type={inputType} value={value ?? ''} onChange={e => onChange(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full" />
        )}
      </div>
      <div className="text-xs text-gray-400">{typeof value}</div>
    </div>
  );
}

function SettingsForm({ data, editing, onChange }) {
  if (!data || !data.settings) return <div className="text-sm text-gray-400">No settings configured</div>;
  const entries = Object.entries(data.settings);
  if (entries.length === 0) return <div className="text-sm text-gray-400">No settings configured</div>;
  return (
    <div>
      {entries.map(([key, value]) => (
        <EditableRow
          key={key}
          label={key.replace(/_/g, ' ')}
          value={editing[key] !== undefined ? editing[key] : value}
          onChange={(v) => onChange(key, v)}
          type={typeof value}
        />
      ))}
    </div>
  );
}

function renderGeneral(data, editing, onChange) {
  return <SettingsForm data={{ settings: data }} editing={editing} onChange={onChange} />;
}

function renderBranding(data) {
  if (!data) return <div className="text-sm text-gray-400">No branding data</div>;
  return (
    <div className="space-y-4">
      {data.assignment ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Theme</span><div className="text-sm font-medium">{data.assignment.theme}</div></div>
          <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Primary Color</span><div className="text-sm font-medium flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ backgroundColor: data.assignment.primaryColor }} />{data.assignment.primaryColor}</div></div>
          <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Secondary Color</span><div className="text-sm font-medium flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ backgroundColor: data.assignment.secondaryColor }} />{data.assignment.secondaryColor}</div></div>
          {data.assignment.logoUrl && <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Logo</span><div className="text-sm font-medium truncate">{data.assignment.logoUrl}</div></div>}
          {data.assignment.faviconUrl && <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Favicon</span><div className="text-sm font-medium truncate">{data.assignment.faviconUrl}</div></div>}
        </div>
      ) : <div className="text-sm text-gray-400">No branding assignment configured. Configure branding per-business in <a href="/admin/cms/business-assignment" className="text-blue-600 hover:underline">Business Assignments</a>.</div>}
      <div className="text-xs text-gray-400 mt-2">Branding is managed per-business through Business Assignments. Visit the Business Assignment module to configure themes, colors, and logos.</div>
    </div>
  );
}

function renderAiProviders(data) {
  if (!data) return <div className="text-sm text-gray-400">No AI provider data</div>;
  const providers = data.providers || [];
  return (
    <div>
      {providers.length === 0 ? <div className="text-sm text-gray-400">No AI providers configured. Manage providers in <a href="/admin/cms/ai-center/providers" className="text-blue-600 hover:underline">AI Center → Providers</a>.</div> : (
        <div className="space-y-2">
          {providers.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-gray-400">{p.provider} / {p.model}</div></div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isEnabled ? 'Enabled' : 'Disabled'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' : p.healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{p.healthStatus}</span>
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-2">Manage AI providers in <a href="/admin/cms/ai-center/providers" className="text-blue-600 hover:underline">AI Center → Providers</a></div>
        </div>
      )}
    </div>
  );
}

function renderDeployment(data) {
  if (!data) return <div className="text-sm text-gray-400">No deployment data</div>;
  const envs = data.environments || [];
  return (
    <div>
      {envs.length === 0 ? <div className="text-sm text-gray-400">No deployment environments configured. Manage in <a href="/admin/cms/deployment" className="text-blue-600 hover:underline">Deployment Center</a>.</div> : (
        <div className="space-y-2">
          {envs.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div><div className="text-sm font-medium">{e.name}</div><div className="text-xs text-gray-400">{e.type}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{e.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-2">Manage deployment environments, releases, and rollbacks in <a href="/admin/cms/deployment" className="text-blue-600 hover:underline">Deployment Center</a></div>
        </div>
      )}
    </div>
  );
}

function renderStorage(data, editing, onChange) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Provider</span><div className="text-sm font-medium">{data?.provider || 'auto'}</div></div>
        <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">AWS Configured</span><div className="text-sm font-medium">{data?.hasAwsConfig ? 'Yes' : 'No'}</div></div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderSmtp(data, editing, onChange) {
  return (
    <div>
      <div className="p-3 bg-gray-50 rounded mb-4 inline-block">
        <span className="text-xs text-gray-500">Status</span>
        <div className="text-sm font-medium">{data?.configured ? 'Configured' : 'Not Configured'}</div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderRedis(data, editing, onChange) {
  return (
    <div>
      <div className="p-3 bg-gray-50 rounded mb-4 inline-block">
        <span className="text-xs text-gray-500">URL</span>
        <div className="text-sm font-medium font-mono">{data?.url || 'Not set'}</div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderQueue(data, editing, onChange) {
  return (
    <div>
      <div className="p-3 bg-gray-50 rounded mb-4 inline-block">
        <span className="text-xs text-gray-500">Mode</span>
        <div className="text-sm font-medium">{data?.status?.mode || 'unknown'}</div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderSecurity(data, editing, onChange) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Rate Limit Window</span><div className="text-sm font-medium">{(data?.rateLimits?.windowMs || 900000) / 60000} min</div></div>
        <div className="p-3 bg-gray-50 rounded"><span className="text-xs text-gray-500">Max Requests</span><div className="text-sm font-medium">{data?.rateLimits?.max || 500}</div></div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderFeatureFlags(data, editing, onChange) {
  const flags = Array.isArray(data) ? data : [];
  return (
    <div>
      {flags.length === 0 ? <div className="text-sm text-gray-400">No feature flags configured</div> : (
        <div className="space-y-2">
          {flags.map(f => (
            <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div><div className="text-sm font-medium">{f.key.replace(/_/g, ' ')}</div>{f.description && <div className="text-xs text-gray-400">{f.description}</div>}</div>
              <select value={String(editing[f.key] !== undefined ? editing[f.key] : f.enabled)} onChange={e => onChange(f.key, e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderEnvVars(data) {
  if (!data) return <div className="text-sm text-gray-400">No environment variable data</div>;
  const vars = data.variables || [];
  return (
    <div>
      {vars.length === 0 ? <div className="text-sm text-gray-400">No environment variables configured. Manage in <a href="/admin/cms/deployment" className="text-blue-600 hover:underline">Deployment Center</a>.</div> : (
        <div className="space-y-2">
          {vars.map(v => (
            <div key={v.key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div><div className="text-sm font-medium font-mono">{v.key}</div><div className="text-xs text-gray-400">v{v.version}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${v.isSecret ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{v.isSecret ? 'Secret' : 'Plain'}</span>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-2">Manage environment variables per-deployment environment in <a href="/admin/cms/deployment" className="text-blue-600 hover:underline">Deployment Center</a></div>
        </div>
      )}
    </div>
  );
}

function renderDomains(data) {
  if (!data) return <div className="text-sm text-gray-400">No domain data</div>;
  const domains = data.domains || [];
  return (
    <div>
      {domains.length === 0 ? <div className="text-sm text-gray-400">No domains configured. Manage in <a href="/admin/cms/domains" className="text-blue-600 hover:underline">Domains Manager</a>.</div> : (
        <div className="space-y-2">
          {domains.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div><div className="text-sm font-medium">{d.domain}</div><div className="text-xs text-gray-400">{d.type} · SSL: {d.sslEnabled ? 'Enabled' : 'Disabled'}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                d.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>{d.status}</span>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-2">Manage domains, DNS verification, and SSL in <a href="/admin/cms/domains" className="text-blue-600 hover:underline">Domains Manager</a></div>
        </div>
      )}
    </div>
  );
}

function renderIntegrations(data, editing, onChange) {
  return <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />;
}

function renderMonitoring(data, editing, onChange) {
  return (
    <div>
      <div className="p-3 bg-gray-50 rounded mb-4 inline-block">
        <span className="text-xs text-gray-500">Monitoring</span>
        <div className="text-sm font-medium">{data?.enabled !== false ? 'Enabled' : 'Disabled'}</div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderBackup(data, editing, onChange) {
  return (
    <div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderMaintenance(data, editing, onChange) {
  const mode = editing.maintenance_mode !== undefined ? editing.maintenance_mode : data?.maintenanceMode;
  return (
    <div>
      <div className="p-3 bg-gray-50 rounded mb-4 inline-block">
        <span className="text-xs text-gray-500">Status</span>
        <div className={`text-sm font-medium ${mode ? 'text-red-600' : 'text-green-600'}`}>{mode ? 'Maintenance Mode Active' : 'Normal Operation'}</div>
      </div>
      <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderAnalytics(data, editing, onChange) {
  return <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />;
}

function renderLocalization(data, editing, onChange) {
  return <SettingsForm data={{ settings: data?.settings || {} }} editing={editing} onChange={onChange} />;
}
