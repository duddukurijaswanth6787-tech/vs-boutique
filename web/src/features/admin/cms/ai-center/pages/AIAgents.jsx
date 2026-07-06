import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, RefreshCw, Search, Filter, CheckCircle, XCircle, Play, Edit3, RotateCw } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AIAgents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sources, setSources] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      const [res, srcRes] = await Promise.all([aiCenterApi.getAgents(params), aiCenterApi.getAgentSources().catch(() => ({}))]);
      setAgents(res.data || []);
      setSources(srcRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [category]);

  const handleSync = async () => {
    try { const res = await aiCenterApi.syncAgents(); alert(`Synced: ${res.data.synced} agents`); load(); } catch (err) { alert(err.message); }
  };

  const handleToggle = async (id, current) => {
    try { await aiCenterApi.updateAgent(id, { isEnabled: !current }); load(); } catch (err) { alert(err.message); }
  };

  const handleTest = async (id) => {
    try { const res = await aiCenterApi.testAgent(id); alert(`${res.data.healthy ? 'Healthy' : 'Offline'}: ${res.data.message}`); load(); } catch (err) { alert(err.message); }
  };

  const CATEGORIES = ['pipeline', 'certification', 'prompt', 'aifix', 'workflow', 'custom'];
  const CATEGORY_COLORS = { pipeline: 'bg-blue-100 text-blue-700', certification: 'bg-green-100 text-green-700', prompt: 'bg-purple-100 text-purple-700', aifix: 'bg-orange-100 text-orange-700', workflow: 'bg-indigo-100 text-indigo-700', custom: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RotateCw className="w-4 h-4" /> Sync Agents</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {sources && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Agent Sources</h2>
          <div className="flex gap-4 text-sm">
            <span>Pipeline: <strong>{sources.pipeline?.count || 0}</strong></span>
            <span>Certification: <strong>{sources.certification?.count || 0}</strong></span>
            <span>Workflow: <strong>{sources.workflow?.count || 0}</strong></span>
            <span>Registered: <strong>{sources.registered || 0}</strong></span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setCategory('')} className={`px-3 py-1.5 text-xs rounded-full border ${!category ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-xs rounded-full border ${category === c ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{c}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : agents.length === 0 ? <div className="text-center py-12 text-gray-500">No agents found. Click "Sync Agents" to discover existing agents.</div> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Health</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900">{a.name}</div><div className="text-xs text-gray-400">{a.key}</div></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[a.category] || 'bg-gray-100'}`}>{a.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{a.source}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(a.id, a.isEnabled)} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${a.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.isEnabled ? 'Enabled' : 'Disabled'}</button>
                  </td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${a.healthStatus === 'healthy' ? 'text-green-600' : 'text-gray-400'}`}>{a.healthStatus === 'healthy' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{a.healthStatus || 'unknown'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.executionOrder}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleTest(a.id)} className="text-blue-600 hover:text-blue-800"><Play className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
