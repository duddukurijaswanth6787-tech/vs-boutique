import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, RefreshCw, Save, RotateCcw, LayoutList, Users, Receipt, FileText, Percent, Coins, Webhook, BarChart3, Activity } from 'lucide-react';
import Tabs from '../../../../../core/components/ui/Tabs';
import { subscriptionsApi } from '../services/subscriptions.api';

const TABS = [
  { id: 'plans', label: 'Plans', icon: LayoutList },
  { id: 'subscriptions', label: 'Subscriptions', icon: Users },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'tax', label: 'Tax', icon: Percent },
  { id: 'credits', label: 'Credits', icon: Coins },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'usage_metering', label: 'Usage Metering', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function SubscriptionPlans() {
  const [activeTab, setActiveTab] = useState('plans');
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.getAll();
      setAllData(res.data || {});
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshTab = async (tabId) => {
    try {
      const res = await subscriptionsApi.getCategory(tabId);
      setAllData(prev => ({ ...prev, [tabId]: res.data }));
    } catch {}
  };

  const handleSave = async () => {
    const category = activeTab;
    const data = editing;
    if (Object.keys(data).length === 0) return;
    setSaving(true);
    try {
      const res = await subscriptionsApi.updateCategory(category, data);
      setAllData(prev => ({ ...prev, [category]: res.data }));
      setEditing({});
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleInit = async () => {
    if (!confirm('Reset subscription defaults?')) return;
    try {
      await subscriptionsApi.initialize();
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><CreditCard className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SaaS Subscription & Billing</h1>
            <p className="text-sm text-gray-500">Manage subscription plans, billing, invoices, tax, and usage metering</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInit} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RotateCcw className="w-4 h-4" /> Initialize Defaults</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <Tabs tabs={TABS.map(t => ({ id: t.id, label: t.label }))} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : !allData ? <div className="text-center py-12 text-gray-500">No data. Click "Initialize Defaults" to get started.</div> : (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            {React.createElement(TABS.find(t => t.id === activeTab)?.icon || CreditCard, { className: 'w-4 h-4 text-gray-500' })}
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{activeTab.replace(/_/g, ' ')}</h2>
          </div>
          <div className="p-4">
            {activeTab === 'plans' && renderPlans(allData.plans)}
            {activeTab === 'subscriptions' && renderSubscriptions(allData.subscriptions)}
            {activeTab === 'billing' && renderBilling(allData.billing)}
            {activeTab === 'invoices' && renderSettingsTab(allData.invoices, editing, changeValue)}
            {activeTab === 'tax' && renderSettingsTab(allData.tax, editing, changeValue)}
            {activeTab === 'credits' && renderCredits(allData.credits)}
            {activeTab === 'webhooks' && renderSettingsTab(allData.webhooks, editing, changeValue)}
            {activeTab === 'usage_metering' && renderUsageMetering(allData.usage_metering, editing, changeValue)}
            {activeTab === 'analytics' && renderAnalytics(allData.analytics)}

            {hasEdits && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
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
  if (entries.length === 0) return <div className="text-sm text-gray-400">No settings configured. Click Initialize Defaults.</div>;
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

function renderPlans(data) {
  if (!data) return <div className="text-sm text-gray-400">No plan data</div>;
  const plans = data.plans || [];
  return (
    <div>
      {plans.length === 0 ? <div className="text-sm text-gray-400">No subscription plans. Manage plans in <a href="/admin/subscriptions" className="text-purple-600 hover:underline">Subscriptions Control</a>.</div> : (
        <div className="space-y-3">
          {plans.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium">{p.name} <span className="text-xs text-gray-400">({p.planCode})</span></div>
                <div className="text-xs text-gray-400">${parseFloat(p.monthlyPrice).toFixed(2)}/mo · ${parseFloat(p.yearlyPrice).toFixed(2)}/yr · {p.trialPeriodDays}d trial · {p.gracePeriodDays}d grace</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{p.subscriberCount} subscribers</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                {p.recommendedPlan && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Recommended</span>}
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-400 mt-2">Full plan management with feature matrix in <a href="/admin/subscriptions" className="text-purple-600 hover:underline">Subscriptions Control → Plans</a></div>
        </div>
      )}
    </div>
  );
}

function renderSubscriptions(data) {
  if (!data) return <div className="text-sm text-gray-400">No subscription data</div>;
  const byStatus = data.byStatus || {};
  const recent = data.recent || [];
  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className="p-3 bg-gray-50 rounded text-center">
            <div className="text-lg font-bold">{count}</div>
            <div className="text-xs text-gray-500">{status}</div>
          </div>
        ))}
        <div className="p-3 bg-gray-50 rounded text-center">
          <div className="text-lg font-bold">{data.total || 0}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
      {recent.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Subscriptions</div>
          <div className="space-y-2">
            {recent.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span>{s.boutique?.name || 'Unknown'} — {s.plan?.name || 'Unknown'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  s.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                  s.status === 'PAST_DUE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2">Full subscription management in <a href="/admin/subscriptions" className="text-purple-600 hover:underline">Subscriptions Control → Boutiques</a></div>
        </div>
      )}
    </div>
  );
}

function renderBilling(data) {
  if (!data) return <div className="text-sm text-gray-400">No billing data</div>;
  const history = data.history || [];
  return (
    <div>
      {history.length === 0 ? <div className="text-sm text-gray-400">No billing history</div> : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div>
                <span className="font-medium">{h.subscription?.boutique?.name || 'Unknown'}</span>
                <span className="text-gray-400 mx-2">—</span>
                <span>{h.subscription?.plan?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">${parseFloat(h.amount).toFixed(2)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${h.paymentStatus === 'captured' || h.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.paymentStatus}</span>
                {h.invoiceUrl && <a href={h.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">Invoice</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderSettingsTab(data, editing, onChange) {
  return <SettingsForm data={data} editing={editing} onChange={onChange} />;
}

function renderCredits(data) {
  if (!data) return <div className="text-sm text-gray-400">No credit data</div>;
  const entries = data.entries || [];
  return (
    <div>
      {entries.length === 0 ? <div className="text-sm text-gray-400">No credit ledger entries</div> : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.key} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div><span className="font-medium">{e.key}</span>{e.description && <span className="text-gray-400 ml-2">{e.description}</span>}</div>
              <div className="text-xs text-gray-400">{JSON.stringify(e.value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderUsageMetering(data, editing, onChange) {
  if (!data) return <div className="text-sm text-gray-400">No usage metering data</div>;
  return (
    <div>
      {data.currentUsage && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-xs text-gray-500">AI Token Usage</span>
            <div className="text-sm font-medium">{(data.currentUsage.aiTokens?.totalTokens || 0).toLocaleString()} tokens</div>
            <div className="text-xs text-gray-400">Cost: ${(data.currentUsage.aiTokens?.totalCost || 0).toFixed(4)}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-xs text-gray-500">Deployments</span>
            <div className="text-sm font-medium">{data.currentUsage.deployments || 0}</div>
          </div>
        </div>
      )}
      <SettingsForm data={{ settings: data.settings || {} }} editing={editing} onChange={onChange} />
    </div>
  );
}

function renderAnalytics(data) {
  if (!data) return <div className="text-sm text-gray-400">No analytics data</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Plans" value={data.totalPlans || 0} />
      <StatCard label="Active Plans" value={data.activePlans || 0} />
      <StatCard label="Total Subscriptions" value={data.totalSubs || 0} />
      <StatCard label="Active Subscriptions" value={data.activeSubs || 0} />
      <StatCard label="Trial Subscriptions" value={data.trialSubs || 0} />
      <StatCard label="Expired Subscriptions" value={data.expiredSubs || 0} />
      <StatCard label="MRR" value={`$${parseFloat(data.mrr || 0).toFixed(2)}`} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
