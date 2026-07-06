import React, { useState, useEffect, useCallback } from 'react';
import {
  getNotificationOverview, getNotificationDashboard, getRecentNotifications, getSystemNotifications,
  getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, launchCampaign,
  completeCampaign, getCampaignAnalytics,
  getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, previewTemplate,
  getTemplateVariables,
  getPreferences, updatePreferences,
  getChannels, updateChannel,
  getNotificationAnalytics, getDeliveryStatus, retryFailed, retryNotification,
  getSubscription, updateSubscription, updateDigest, updateRetention,
  getNotificationHealth, refreshNotificationCache, initializeNotificationDefaults
} from '../services/notification.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Bell, BellOff, BellRing, Mail, MessageSquare, Smartphone, Globe,
  Send, CheckCircle, XCircle, Clock, AlertTriangle, Activity,
  BarChart3, FileText, Settings, RefreshCw, Users, Layers,
  TrendingUp, DollarSign, Shield, Server, BookOpen, Eye
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Dashboard', icon: Bell },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'channels', label: 'Channels', icon: Globe },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'delivery', label: 'Delivery Status', icon: CheckCircle },
  { id: 'retry', label: 'Retry Failed', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'subscription', label: 'Subscription', icon: Users },
  { id: 'digest', label: 'Digest Config', icon: Clock },
  { id: 'retention', label: 'Retention', icon: Shield },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'recent', label: 'Recent', icon: BellRing },
  { id: 'system', label: 'System', icon: BellOff },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'push', label: 'Push', icon: Smartphone },
  { id: 'webhook', label: 'Webhook', icon: Globe },
  { id: 'campaign-detail', label: 'Campaign Detail', icon: Send },
  { id: 'template-detail', label: 'Template Detail', icon: FileText },
  { id: 'campaign-analytics', label: 'Campaign Analytics', icon: TrendingUp },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'provider', label: 'Provider', icon: Server },
  { id: 'guide', label: 'User Guide', icon: BookOpen }
];

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [recent, setRecent] = useState([]);
  const [systemNotifs, setSystemNotifs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [channels, setChannels] = useState({ email: {}, sms: {}, push: {}, webhook: {} });
  const [preferences, setPreferences] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [digest, setDigest] = useState({});
  const [retention, setRetention] = useState({});
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [templateDetail, setTemplateDetail] = useState(null);
  const [campaignAnalyticsData, setCampaignAnalyticsData] = useState(null);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [previewResult, setPreviewResult] = useState(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email', status: 'DRAFT' });
  const [newTemplate, setNewTemplate] = useState({ name: '', type: 'email', subject: '', body: '' });
  const [editDigest, setEditDigest] = useState(null);
  const [editRetention, setEditRetention] = useState(null);
  const [editPrefs, setEditPrefs] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, db, rn, sn, cp, tp, ch, pr, dv, an, sb, dg, rt, he] = await Promise.all([
        getNotificationOverview().catch(() => ({ data: null })),
        getNotificationDashboard().catch(() => ({ data: null })),
        getRecentNotifications(20).catch(() => ({ data: [] })),
        getSystemNotifications(20).catch(() => ({ data: [] })),
        getCampaigns().catch(() => ({ data: [] })),
        getTemplates().catch(() => ({ data: [] })),
        getChannels().catch(() => ({ data: { email: {}, sms: {}, push: {}, webhook: {} } })),
        getPreferences().catch(() => ({ data: null })),
        getDeliveryStatus().catch(() => ({ data: null })),
        getNotificationAnalytics().catch(() => ({ data: null })),
        getSubscription().catch(() => ({ data: { config: {}, digest: {}, retention: {} } })),
        getTemplateVariables().catch(() => ({ data: [] })),
        getNotificationHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setDashboard(db.data);
      setRecent(Array.isArray(rn.data) ? rn.data : []);
      setSystemNotifs(Array.isArray(sn.data) ? sn.data : []);
      setCampaigns(Array.isArray(cp.data) ? cp.data : []);
      setTemplates(Array.isArray(tp.data) ? tp.data : []);
      setChannels(ch.data || { email: {}, sms: {}, push: {}, webhook: {} });
      setPreferences(pr.data);
      setDelivery(dv.data);
      setAnalytics(an.data);
      setSubscription(sb.data?.config || {});
      setDigest(sb.data?.digest || {});
      setRetention(sb.data?.retention || {});
      setTemplateVariables(Array.isArray(he) ? he : tv.data || []);
      setHealth(he || he?.data);
    } catch (e) {
      console.error('Notification center load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleLaunchCampaign(id) {
    try { await launchCampaign(id); await loadAll(); } catch (e) { alert('Launch failed: ' + e.message); }
  }

  async function handleCompleteCampaign(id) {
    try { await completeCampaign(id); await loadAll(); } catch (e) { alert('Complete failed: ' + e.message); }
  }

  async function handleDeleteCampaign(id) {
    if (!window.confirm('Delete this campaign?')) return;
    try { await deleteCampaign(id); await loadAll(); } catch (e) { alert('Delete failed: ' + e.message); }
  }

  async function handleViewCampaign(id) {
    try {
      const [cp, ca] = await Promise.all([
        getCampaign(id).catch(() => ({ data: null })),
        getCampaignAnalytics(id).catch(() => ({ data: null }))
      ]);
      setCampaignDetail(cp.data);
      setCampaignAnalyticsData(ca.data);
    } catch (e) { alert('Failed to load campaign: ' + e.message); }
  }

  async function handleCreateCampaign() {
    if (!newCampaign.name) return;
    try { await createCampaign(newCampaign); setNewCampaign({ name: '', type: 'email', status: 'DRAFT' }); await loadAll(); } catch (e) { alert('Create failed: ' + e.message); }
  }

  async function handleCreateTemplate() {
    if (!newTemplate.name) return;
    try { await createTemplate(newTemplate); setNewTemplate({ name: '', type: 'email', subject: '', body: '' }); await loadAll(); } catch (e) { alert('Create failed: ' + e.message); }
  }

  async function handlePreviewTemplate(id) {
    try {
      const res = await previewTemplate(id, {});
      setPreviewResult(res.data);
    } catch (e) { alert('Preview failed: ' + e.message); }
  }

  async function handleRetryAll() {
    try { const res = await retryFailed(); alert(`Retried ${res.data?.count || 0} notifications`); await loadAll(); } catch (e) { alert('Retry failed: ' + e.message); }
  }

  async function handleDigestSave() {
    if (!editDigest) return;
    try { await updateDigest(editDigest); setEditDigest(null); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handleRetentionSave() {
    if (!editRetention) return;
    try { await updateRetention(editRetention); setEditRetention(null); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  async function handlePrefsSave() {
    if (!editPrefs) return;
    try { await updatePreferences(editPrefs); setEditPrefs(null); await loadAll(); } catch (e) { alert('Failed: ' + e.message); }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {overview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Sent" value={overview.totalSent?.toLocaleString() || '0'} icon={Bell} color="blue" />
                  <CMSStatsCard title="Delivered" value={overview.totalDelivered?.toLocaleString() || '0'} icon={CheckCircle} color="green" />
                  <CMSStatsCard title="Failed" value={overview.totalFailed?.toLocaleString() || '0'} icon={XCircle} color="red" />
                  <CMSStatsCard title="Pending" value={overview.totalPending?.toLocaleString() || '0'} icon={Clock} color="yellow" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Open Rate" value={overview.openRate ? `${overview.openRate}%` : '0%'} icon={Eye} color="blue" />
                  <CMSStatsCard title="Click Rate" value={overview.clickRate ? `${overview.clickRate}%` : '0%'} icon={TrendingUp} color="green" />
                  <CMSStatsCard title="Bounce Rate" value={overview.bounceRate ? `${overview.bounceRate}%` : '0%'} icon={AlertTriangle} color="red" />
                  <CMSStatsCard title="Campaigns" value={campaigns.length || 0} icon={Send} color="purple" />
                </div>
              </>
            ) : <div className="text-center py-8"><Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Loading overview...</p></div>}
          </div>
        );

      case 'campaigns':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">New Campaign</h3>
              <div className="flex gap-2">
                <input value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                <select value={newCampaign.type} onChange={e => setNewCampaign(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 text-xs border rounded-lg">
                  <option value="email">Email</option><option value="sms">SMS</option><option value="push">Push</option><option value="webhook">Webhook</option>
                </select>
                <button onClick={handleCreateCampaign} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">Create</button>
              </div>
            </div>
            {campaigns.length === 0 ? (
              <div className="text-center py-8"><Send className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No campaigns yet</p></div>
            ) : (
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{c.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${c.status === 'ACTIVE' || c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : c.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                        <span className="text-xs text-gray-400">{c.type}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Created {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedCampaign(c.id); setActiveTab('campaign-detail'); handleViewCampaign(c.id); }} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">View</button>
                      {c.status === 'DRAFT' && <button onClick={() => handleLaunchCampaign(c.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Launch</button>}
                      {c.status === 'ACTIVE' && <button onClick={() => handleCompleteCampaign(c.id)} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Complete</button>}
                      <button onClick={() => handleDeleteCampaign(c.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'campaign-detail':
        return (
          <div className="space-y-4">
            {campaignDetail ? (
              <>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{campaignDetail.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${campaignDetail.status === 'ACTIVE' || campaignDetail.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{campaignDetail.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Type:</strong> {campaignDetail.type}</p>
                    <p><strong>Sent:</strong> {campaignDetail.sentCount || 0}</p>
                    <p><strong>Delivered:</strong> {campaignDetail.deliveredCount || 0}</p>
                    <p><strong>Failed:</strong> {campaignDetail.failedCount || 0}</p>
                    <p><strong>Opened:</strong> {campaignDetail.openedCount || 0}</p>
                    <p><strong>Clicked:</strong> {campaignDetail.clickedCount || 0}</p>
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Campaign Analytics</h3>
                  {campaignAnalyticsData ? (
                    <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(campaignAnalyticsData, null, 2)}</pre>
                  ) : <p className="text-xs text-gray-400">No analytics data.</p>}
                </div>
              </>
            ) : <div className="text-center py-8"><Send className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Select a campaign to view details</p></div>}
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">New Template</h3>
              <div className="flex gap-2">
                <input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} placeholder="Template name" className="flex-1 px-3 py-2 text-xs border rounded-lg" />
                <select value={newTemplate.type} onChange={e => setNewTemplate(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 text-xs border rounded-lg">
                  <option value="email">Email</option><option value="sms">SMS</option><option value="push">Push</option>
                </select>
                <button onClick={handleCreateTemplate} className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">Create</button>
              </div>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-8"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No templates yet</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                  <div key={t.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{t.name}</span>
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100">{t.type}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Subject: {t.subject || 'N/A'}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedTemplate(t.id); setTemplateDetail(t); setActiveTab('template-detail'); }} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">View</button>
                      <button onClick={() => handlePreviewTemplate(t.id)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg">Preview</button>
                      <button onClick={async () => { if (window.confirm('Delete?')) { try { await deleteTemplate(t.id); await loadAll(); } catch (e) { alert(e.message); } } }} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {previewResult && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">Preview</h3>
                  <button onClick={() => setPreviewResult(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>
                <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(previewResult, null, 2)}</pre>
              </div>
            )}
          </div>
        );

      case 'template-detail':
        return (
          <div className="space-y-4">
            {templateDetail ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold mb-2">{templateDetail.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Type:</strong> {templateDetail.type}</p>
                  <p><strong>Subject:</strong> {templateDetail.subject || 'N/A'}</p>
                  <p><strong>Created:</strong> {new Date(templateDetail.createdAt).toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {new Date(templateDetail.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-xs mb-2">Body</h4>
                  <pre className="text-xs bg-gray-50 p-4 rounded max-h-48 overflow-auto whitespace-pre-wrap">{templateDetail.body || 'No body content'}</pre>
                </div>
              </div>
            ) : <div className="text-center py-8"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Select a template to view details</p></div>}
          </div>
        );

      case 'channels':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Notification channel configuration — stored in CmsAiSettings.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(channels).map(([name, config]) => (
                <div key={name} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {name === 'email' ? <Mail className="w-4 h-4 text-blue-500" /> : name === 'sms' ? <MessageSquare className="w-4 h-4 text-green-500" /> : name === 'push' ? <Smartphone className="w-4 h-4 text-purple-500" /> : <Globe className="w-4 h-4 text-orange-500" />}
                    <h3 className="font-bold text-sm capitalize">{name}</h3>
                  </div>
                  <p className="text-xs text-gray-400">Provider: {config.provider || 'Not configured'}</p>
                  <p className="text-xs text-gray-400">Status: {config.enabled ? 'Enabled' : 'Disabled'}</p>
                  <button onClick={() => updateChannel(name, { enabled: !config.enabled }).then(loadAll).catch(e => alert(e.message))} className="mt-2 px-3 py-1 text-xs bg-primary text-white rounded-lg hover:opacity-90">
                    {config.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Notification preferences — stored in CmsAiSettings.</p>
            {preferences ? (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Current Preferences</h3>
                  <button onClick={() => setEditPrefs(editPrefs ? null : { ...preferences })} className="px-3 py-1 text-xs bg-primary text-white rounded-lg">{editPrefs ? 'Cancel' : 'Edit'}</button>
                </div>
                <div className="space-y-2 text-sm">
                  {Object.entries(preferences).filter(([k]) => k !== 'source' && k !== '_id').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {editPrefs ? (
                        <input value={editPrefs[key] ?? val} onChange={e => setEditPrefs(p => ({ ...p, [key]: e.target.value }))} className="w-40 px-2 py-1 text-xs border rounded-lg" />
                      ) : (
                        <span className="font-bold text-xs">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                      )}
                    </div>
                  ))}
                </div>
                {editPrefs && <button onClick={handlePrefsSave} className="mt-3 px-4 py-1.5 bg-green-500 text-white text-xs rounded-lg">Save Preferences</button>}
              </div>
            ) : <div className="text-center py-8"><Settings className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No preferences loaded</p></div>}
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-4">
            {delivery ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total" value={delivery.total?.toLocaleString() || '0'} icon={Bell} color="blue" />
                  <CMSStatsCard title="Delivered" value={delivery.delivered?.toLocaleString() || '0'} icon={CheckCircle} color="green" />
                  <CMSStatsCard title="Failed" value={delivery.failed?.toLocaleString() || '0'} icon={XCircle} color="red" />
                  <CMSStatsCard title="Pending" value={delivery.pending?.toLocaleString() || '0'} icon={Clock} color="yellow" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <CMSStatsCard title="Queue Size" value={delivery.queue?.size || 0} icon={Activity} color="blue" />
                  <CMSStatsCard title="Queue Active" value={delivery.queue?.active || 0} icon={Activity} color="green" />
                  <CMSStatsCard title="Queue Waiting" value={delivery.queue?.waiting || 0} icon={Clock} color="yellow" />
                </div>
                {delivery.failures?.length > 0 && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3">Failure Reasons</h3>
                    <div className="space-y-2">
                      {delivery.failures.slice(0, 20).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 bg-red-50 rounded-lg">
                          <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span className="text-gray-700">{f.reason || f.error || 'Unknown error'}</span>
                          <span className="ml-auto text-gray-400">{new Date(f.createdAt || f.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <div className="text-center py-8"><CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Delivery status not loaded</p></div>}
          </div>
        );

      case 'retry':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6 text-center">
              <RefreshCw className="w-12 h-12 mx-auto text-primary mb-3" />
              <h3 className="font-bold mb-2">Retry Failed Notifications</h3>
              <p className="text-sm text-gray-500 mb-4">Attempt to resend all failed notifications</p>
              <button onClick={handleRetryAll} className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90">Retry All Failed</button>
            </div>
            {delivery?.failures?.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Failed Notifications</h3>
                <div className="space-y-2">
                  {delivery.failures.slice(0, 30).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span>{f.reason || f.error || 'Unknown'}</span>
                      </div>
                      <button onClick={() => retryNotification(f.id).then(loadAll).catch(e => alert(e.message))} className="px-2 py-0.5 bg-primary text-white rounded text-xs">Retry</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Delivery Rate" value={analytics.delivery?.rate ? `${analytics.delivery.rate}%` : '0%'} icon={CheckCircle} color="green" />
                  <CMSStatsCard title="Open Rate" value={analytics.delivery?.openRate ? `${analytics.delivery.openRate}%` : '0%'} icon={Eye} color="blue" />
                  <CMSStatsCard title="Click Rate" value={analytics.delivery?.clickRate ? `${analytics.delivery.clickRate}%` : '0%'} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Bounce Rate" value={analytics.delivery?.bounceRate ? `${analytics.delivery.bounceRate}%` : '0%'} icon={AlertTriangle} color="red" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Channel Performance</h3>
                  {analytics.channels ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.channels).map(([ch, perf]) => (
                        <div key={ch} className="flex items-center gap-2 text-sm">
                          <span className="w-16 px-2 py-0.5 bg-gray-100 rounded text-xs font-bold capitalize">{ch}</span>
                          <span className="text-xs">Sent: {perf.sent || 0}</span>
                          <span className="text-xs">Delivered: {perf.delivered || 0}</span>
                          <span className="text-xs">Rate: {perf.rate ? `${perf.rate}%` : '0%'}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">No channel data</p>}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Campaign Performance</h3>
                  {analytics.campaigns ? (
                    <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(analytics.campaigns, null, 2)}</pre>
                  ) : <p className="text-xs text-gray-400">No campaign data</p>}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3">Open Rate Trend (30 days)</h3>
                  {analytics.openRateTrend ? (
                    <div className="flex items-end gap-1 h-32">
                      {analytics.openRateTrend.map((b, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary/20 rounded-t" style={{ height: `${Math.min(100, (b.rate || 0) * 100)}%`, minHeight: '2px' }} />
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">No trend data</p>}
                </div>
              </>
            ) : <div className="text-center py-8"><BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Analytics not loaded</p></div>}
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Subscription/digest/retention configuration — stored in CmsAiSettings.</p>
            {subscription && Object.keys(subscription).length > 0 ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Subscription Configuration</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(subscription).filter(([k]) => k !== 'source').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-bold text-xs">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="text-center py-8"><Users className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No subscription config</p></div>}
          </div>
        );

      case 'digest':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Digest notification configuration.</p>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Digest Settings</h3>
                <button onClick={() => setEditDigest(editDigest ? null : { ...digest })} className="px-3 py-1 text-xs bg-primary text-white rounded-lg">{editDigest ? 'Cancel' : 'Edit'}</button>
              </div>
              {Object.keys(digest).length === 0 ? (
                <p className="text-xs text-gray-400">No digest config loaded.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {Object.entries(digest).filter(([k]) => k !== 'source').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {editDigest ? (
                        <input value={editDigest[key] ?? val} onChange={e => setEditDigest(p => ({ ...p, [key]: ['enabled', 'active'].includes(key) ? e.target.value === 'true' : e.target.value }))} className="w-32 px-2 py-1 text-xs border rounded-lg" />
                      ) : (
                        <span className="font-bold text-xs">{typeof val === 'boolean' ? (val ? 'Enabled' : 'Disabled') : String(val)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {editDigest && <button onClick={handleDigestSave} className="mt-3 px-4 py-1.5 bg-green-500 text-white text-xs rounded-lg">Save Digest</button>}
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Notification data retention configuration.</p>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Retention Settings</h3>
                <button onClick={() => setEditRetention(editRetention ? null : { ...retention })} className="px-3 py-1 text-xs bg-primary text-white rounded-lg">{editRetention ? 'Cancel' : 'Edit'}</button>
              </div>
              {Object.keys(retention).length === 0 ? (
                <p className="text-xs text-gray-400">No retention config loaded.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {Object.entries(retention).filter(([k]) => k !== 'source' && k !== 'calculatedAt').map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      {editRetention ? (
                        <input type="number" value={editRetention[key] || val} onChange={e => setEditRetention(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} className="w-20 px-2 py-1 text-xs border rounded-lg text-right" />
                      ) : (
                        <span className="font-bold text-xs">{val}d</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {editRetention && <button onClick={handleRetentionSave} className="mt-3 px-4 py-1.5 bg-green-500 text-white text-xs rounded-lg">Save Retention</button>}
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            {health ? (
              <>
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${health.status === 'healthy' || health.status === 'ok' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {health.status === 'healthy' || health.status === 'ok' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                  </div>
                  <h2 className="text-xl font-bold">{health.status || 'Unknown'}</h2>
                  <p className="text-xs text-gray-400 mt-1">Last checked: {new Date(health.timestamp || Date.now()).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Queue Health" value={health.queue?.status || health.providers?.queue?.status || 'Unknown'} icon={Activity} color={health.queue?.status === 'healthy' ? 'green' : 'red'} />
                  <CMSStatsCard title="Redis Health" value={health.redis?.status || health.monitoring?.redis?.status || 'Unknown'} icon={Server} color={health.redis?.status === 'healthy' ? 'green' : 'red'} />
                  <CMSStatsCard title="EventBus" value={health.eventBus?.status || health.monitoring?.eventBus?.status || 'Unknown'} icon={Bell} color={health.eventBus?.status === 'healthy' ? 'green' : 'red'} />
                  <CMSStatsCard title="Providers" value={health.providers?.healthy || health.providers?.total || 0} icon={Globe} color="blue" />
                </div>
              </>
            ) : <div className="text-center py-8"><Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Health not loaded</p></div>}
          </div>
        );

      case 'recent':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Recently sent notifications.</p>
            {recent.length === 0 ? (
              <div className="text-center py-8"><BellRing className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No recent notifications</p></div>
            ) : (
              <div className="space-y-2">
                {recent.map(n => (
                  <div key={n.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${n.type === 'SYSTEM_ALERT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{n.type}</span>
                      <span className="text-gray-400">{n.channel || n.type}</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded ${n.status === 'SENT' || n.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : n.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{n.status}</span>
                    </div>
                    <p className="font-bold">{n.title || n.subject}</p>
                    <p className="text-gray-400 mt-0.5">{new Date(n.createdAt || n.sentAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'system':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">System-generated notifications and alerts.</p>
            {systemNotifs.length === 0 ? (
              <div className="text-center py-8"><BellOff className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No system notifications</p></div>
            ) : (
              <div className="space-y-2">
                {systemNotifs.map(n => (
                  <div key={n.id} className="bg-white border rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">{n.type}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${n.priority === 'HIGH' ? 'bg-red-100 text-red-700' : n.priority === 'NORMAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{n.priority}</span>
                    </div>
                    <p className="font-bold">{n.title}</p>
                    <p className="text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'email':
      case 'sms':
      case 'push':
      case 'webhook': {
        const channelConfig = channels[activeTab] || {};
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {activeTab === 'email' ? <Mail className="w-6 h-6 text-blue-500" /> : activeTab === 'sms' ? <MessageSquare className="w-6 h-6 text-green-500" /> : activeTab === 'push' ? <Smartphone className="w-6 h-6 text-purple-500" /> : <Globe className="w-6 h-6 text-orange-500" />}
                <h2 className="text-lg font-bold capitalize">{activeTab} Channel</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Provider:</strong> {channelConfig.provider || 'Not configured'}</p>
                <p><strong>Status:</strong> {channelConfig.enabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Priority:</strong> {channelConfig.priority || 'normal'}</p>
                {channelConfig.rateLimit && <p><strong>Rate Limit:</strong> {channelConfig.rateLimit}/min</p>}
              </div>
              <button onClick={() => updateChannel(activeTab, { enabled: !channelConfig.enabled }).then(loadAll).catch(e => alert(e.message))} className="mt-4 px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90">
                {channelConfig.enabled ? 'Disable Channel' : 'Enable Channel'}
              </button>
            </div>
          </div>
        );
      }

      case 'campaign-analytics':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Aggregated campaign analytics.</p>
            {analytics?.campaigns ? (
              <pre className="text-xs bg-gray-50 p-4 rounded max-h-96 overflow-auto">{JSON.stringify(analytics.campaigns, null, 2)}</pre>
            ) : <div className="text-center py-8"><TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No campaign analytics data</p></div>}
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Notification-related revenue and cost analytics.</p>
            <div className="bg-white border rounded-lg p-6 text-center">
              <DollarSign className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-gray-400 text-sm">Revenue analytics delegated to Phase 25 Analytics Center.</p>
            </div>
          </div>
        );

      case 'provider':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Provider health and status — delegated to Phase 18 Monitoring Center.</p>
            {health?.providers ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Provider Status</h3>
                <pre className="text-xs bg-gray-50 p-4 rounded max-h-60 overflow-auto">{JSON.stringify(health.providers, null, 2)}</pre>
              </div>
            ) : <div className="text-center py-8"><Server className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No provider data</p></div>}
          </div>
        );

      case 'guide':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Enterprise Notification Center Guide</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Dashboard</strong> — High-level KPIs: total sent, delivered, failed, pending, open/click/bounce rates.</p>
                <p><strong>Campaigns</strong> — Create, launch, complete, and analyze notification campaigns.</p>
                <p><strong>Templates</strong> — Manage notification templates with preview support.</p>
                <p><strong>Channels</strong> — Configure email, SMS, push, and webhook channels.</p>
                <p><strong>Preferences</strong> — Global notification preferences stored in CmsAiSettings.</p>
                <p><strong>Delivery Status</strong> — Queue status, delivery stats, failure reasons.</p>
                <p><strong>Retry Failed</strong> — Bulk retry or individual retry for failed notifications.</p>
                <p><strong>Analytics</strong> — Delivery rates, channel performance, campaign performance, open rate trend.</p>
                <p><strong>Subscription/Digest/Retention</strong> — Digest schedule, retention periods, subscription config.</p>
                <p><strong>Health</strong> — Queue, Redis, EventBus, and provider health status.</p>
                <hr className="my-3" />
                <p className="text-xs text-gray-400">All CRUD delegated to notificationsService. All analytics delegated to Phase 25 Analytics Center. All health delegated to Phase 18 Monitoring Center. Zero new Prisma models. Zero new queues.</p>
              </div>
            </div>
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
      title="Enterprise Notification Center"
      description="Unified notification orchestration — zero duplicate CRUD, delegates to notificationsService, Phase 25 Analytics, Phase 18 Monitoring"
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
