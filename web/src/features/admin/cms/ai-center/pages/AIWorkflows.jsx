import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Activity, Play, PauseCircle, XCircle, RefreshCw, Layers, Layout, Zap, Globe, Download, Shield, Rocket, CheckCircle, UserPlus, CreditCard, Package, RotateCcw, Settings, ExternalLink, BarChart3, List } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';
import { workflowApi } from '../../workflows/services/workflow.api';

const TYPE_COLORS = {
  'ai': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'certification': { bg: 'bg-green-100', text: 'text-green-700' },
  'workflow_execution': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'template-pipeline': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'deployment': { bg: 'bg-red-100', text: 'text-red-700' },
  'business-assignment': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'ai-core': { bg: 'bg-pink-100', text: 'text-pink-700' }
};

const STATUS_COLORS = {
  PENDING: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  RETRYING: 'bg-yellow-100 text-yellow-700'
};

export default function AIWorkflows() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [engines, setEngines] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', trigger: 'manual', stages: [] });
  const [stageForm, setStageForm] = useState({ type: '', name: '', agentKey: '' });
  const [execFilter, setExecFilter] = useState({ status: '', type: '' });
  const [launchStatus, setLaunchStatus] = useState(null);

  const loadWorkflows = async () => {
    try {
      const [wfRes, engRes] = await Promise.all([aiCenterApi.getWorkflows(), aiCenterApi.getEngineIntegrations().catch(() => ({}))]);
      setWorkflows(wfRes.data || []);
      setEngines(engRes.data || []);
    } catch {}
  };

  const loadTemplates = async () => {
    try {
      const res = await workflowApi.getTemplates();
      setTemplates(res.data || []);
    } catch {}
  };

  const loadExecutions = async () => {
    try {
      const params = { page: 1, limit: 50 };
      if (execFilter.status) params.status = execFilter.status;
      if (execFilter.type) params.type = execFilter.type;
      const res = await workflowApi.getExecutions(params);
      setExecutions(res.data?.executions || []);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const res = await workflowApi.getAnalytics();
      setAnalytics(res.data);
    } catch {}
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadWorkflows(), loadTemplates(), loadExecutions(), loadAnalytics()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { if (activeTab === 'executions') loadExecutions(); }, [execFilter, activeTab]);
  useEffect(() => { if (activeTab === 'templates') loadTemplates(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'analytics') loadAnalytics(); }, [activeTab]);

  const addStage = () => {
    if (!stageForm.name) return;
    setForm({ ...form, stages: [...form.stages, { ...stageForm }] });
    setStageForm({ type: '', name: '', agentKey: '' });
  };

  const removeStage = (idx) => {
    setForm({ ...form, stages: form.stages.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    try { await aiCenterApi.createWorkflow(form); setShowForm(false); setForm({ name: '', description: '', trigger: 'manual', stages: [] }); loadWorkflows(); } catch (err) { alert(err.message); }
  };

  const handleExecute = async (id) => {
    try { const res = await aiCenterApi.executeWorkflow(id); alert(`Workflow ${res.data.status}`); loadWorkflows(); } catch (err) { alert(err.message); }
  };

  const handleToggle = async (id, action) => {
    try { await aiCenterApi.toggleWorkflow(id, action); loadWorkflows(); } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    try { await aiCenterApi.deleteWorkflow(id); loadWorkflows(); } catch (err) { alert(err.message); }
  };

  const handleLaunchTemplate = async (slug) => {
    setLaunchStatus(slug);
    try {
      const res = await workflowApi.execute({ template: slug });
      alert(`Workflow launched: ${res.data?.execution?.status || 'started'}`);
      loadExecutions();
    } catch (err) { alert(err.message); }
    setLaunchStatus(null);
  };

  const TABS = [
    { id: 'workflows', label: 'My Workflows', icon: Layers },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'executions', label: 'All Executions', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
          {activeTab === 'workflows' && <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> Create Workflow</button>}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {/* Tab: My Workflows */}
          {activeTab === 'workflows' && (
            <>
              {showForm && (
                <div className="bg-white rounded-lg border p-4 mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">New Workflow</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="text-xs text-gray-500">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
                    <div><label className="text-xs text-gray-500">Trigger</label><select value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1"><option value="manual">Manual</option><option value="scheduled">Scheduled</option><option value="event">Event</option></select></div>
                    <div className="col-span-2"><label className="text-xs text-gray-500">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" rows={2} /></div>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-600 mb-2">Stages</h3>
                  <div className="flex gap-2 mb-2">
                    <select value={stageForm.type} onChange={e => setStageForm({...stageForm, type: e.target.value})} className="border rounded px-2 py-1.5 text-sm"><option value="">Select type</option><option value="prompt">Prompt</option><option value="blueprint">Blueprint</option><option value="verification">Verification</option><option value="certification">Certification</option><option value="ai-fix">AI Fix</option><option value="validation-report">Validation Report</option><option value="template">Template</option><option value="business-assignment">Business Assignment</option><option value="deployment">Deployment</option><option value="pipeline">Pipeline Agent</option></select>
                    <input placeholder="Stage name" value={stageForm.name} onChange={e => setStageForm({...stageForm, name: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                    <input placeholder="Agent key (optional)" value={stageForm.agentKey} onChange={e => setStageForm({...stageForm, agentKey: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                    <button onClick={addStage} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Add</button>
                  </div>
                  {form.stages.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {form.stages.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{s.type}</span>
                          <span>{s.name}</span>
                          {s.agentKey && <span className="text-gray-400">({s.agentKey})</span>}
                          <button onClick={() => removeStage(i)} className="ml-auto text-red-500 hover:text-red-700"><XCircle className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={!form.name} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button>
                    <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {workflows.length === 0 ? <div className="text-center py-12 text-gray-500">No workflows yet</div> : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Stages</th><th className="px-4 py-3">Trigger</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {workflows.map(w => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">{w.name}</div>{w.description && <div className="text-xs text-gray-400">{w.description}</div>}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{w.stages?.length || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{w.trigger}</td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${w.status === 'active' ? 'bg-green-100 text-green-700' : w.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{w.status}</span></td>
                          <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleExecute(w.id)} className="text-green-600 hover:text-green-800" title="Execute"><Play className="w-4 h-4" /></button><button onClick={() => handleToggle(w.id, 'pause')} className="text-yellow-600 hover:text-yellow-800" title="Pause"><PauseCircle className="w-4 h-4" /></button><button onClick={() => handleToggle(w.id, 'cancel')} className="text-red-600 hover:text-red-800" title="Cancel"><XCircle className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab: Templates */}
          {activeTab === 'templates' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">Launch pre-built workflow templates across all CMS engines. Each template delegates execution to the appropriate engine.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(tpl => {
                  const engineColors = TYPE_COLORS[tpl.engine] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                  return (
                    <div key={tpl.slug} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tpl.color || '#6B7280' + '20' }}>
                            <Zap className="w-4 h-4" style={{ color: tpl.color || '#6B7280' }} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{tpl.name}</h3>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${engineColors.bg} ${engineColors.text}`}>{tpl.engine}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tpl.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(tpl.stages || []).slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s.name}</span>
                          ))}
                          {(tpl.stages || []).length > 3 && <span className="text-[10px] text-gray-400">+{tpl.stages.length - 3}</span>}
                        </div>
                        <span className="text-[10px] text-gray-400">{tpl.estimatedDuration}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleLaunchTemplate(tpl.slug)}
                          disabled={launchStatus === tpl.slug}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Play className="w-3 h-3" />
                          {launchStatus === tpl.slug ? 'Launching...' : 'Launch'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Quick Links to Existing Pages */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Deep Links to Workflow Engines</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { path: '/admin/cms/ai-center/workflows', label: 'AI Workflows', icon: Layers },
                    { path: '/admin/cms/certification', label: 'Certification Engine', icon: CheckCircle },
                    { path: '/admin/cms/templates', label: 'Template Pipeline', icon: Layout },
                    { path: '/admin/cms/deployment', label: 'Deployment Center', icon: Rocket },
                    { path: '/admin/cms/business-assignment', label: 'Business Assignment', icon: UserPlus },
                    { path: '/admin/cms/ai-center/executions', label: 'AI Executions', icon: Activity },
                  ].map(link => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border rounded-lg hover:bg-gray-50"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {link.label}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: All Executions */}
          {activeTab === 'executions' && (
            <div>
              <div className="flex gap-2 mb-4">
                <select value={execFilter.status} onChange={e => setExecFilter(f => ({...f, status: e.target.value}))} className="border rounded px-2 py-1.5 text-sm">
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
                <select value={execFilter.type} onChange={e => setExecFilter(f => ({...f, type: e.target.value}))} className="border rounded px-2 py-1.5 text-sm">
                  <option value="">All Types</option>
                  <option value="ai">AI</option>
                  <option value="certification">Certification</option>
                  <option value="workflow_execution">Workflow Execution</option>
                </select>
                <button onClick={loadExecutions} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Filter</button>
              </div>
              {executions.length === 0 ? <div className="text-center py-12 text-gray-500">No executions found</div> : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {executions.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.name || e.id.substring(0, 12)}</td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${TYPE_COLORS[e.type]?.bg || 'bg-gray-100'} ${TYPE_COLORS[e.type]?.text || 'text-gray-600'}`}>{e.type}</span></td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <div>
              {analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-2xl font-bold text-gray-900">{analytics.total}</div>
                      <div className="text-xs text-gray-500 mt-1">Total Executions</div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
                      <div className="text-xs text-gray-500 mt-1">Completed</div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-2xl font-bold text-red-600">{analytics.failed}</div>
                      <div className="text-xs text-gray-500 mt-1">Failed</div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                      <div className="text-2xl font-bold text-blue-600">{analytics.successRate}%</div>
                      <div className="text-xs text-gray-500 mt-1">Success Rate</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Engine</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.breakdown || {}).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-500">{val.total} total</span>
                            <span className="text-green-600">{val.completed} ok</span>
                            <span className="text-red-600">{val.failed} failed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No analytics data available</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
