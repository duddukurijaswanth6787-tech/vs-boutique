import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Server, RefreshCw, CheckCircle, XCircle, AlertTriangle, Edit3, Trash2, Play, Zap, Brain } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AIProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', key: '', provider: 'gemini', model: 'gemini-1.5-pro', apiKey: '', baseUrl: '', temperature: 0.7, maxTokens: 4096, priority: 0, isEnabled: true, supportsStreaming: true, supportsThinking: false });

  const load = async () => {
    setLoading(true);
    try { const res = await aiCenterApi.getProviders(); setProviders(res.data || []); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) await aiCenterApi.updateProvider(editing, form);
      else await aiCenterApi.createProvider(form);
      setShowForm(false); setEditing(null); setForm({ name: '', key: '', provider: 'gemini', model: 'gemini-1.5-pro', apiKey: '', baseUrl: '', temperature: 0.7, maxTokens: 4096, priority: 0, isEnabled: true, supportsStreaming: true, supportsThinking: false });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleTest = async (id) => {
    try { const res = await aiCenterApi.testProvider(id); alert(`${res.data.healthy ? 'Healthy' : 'Offline'}: ${res.data.message}`); load(); } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this provider?')) return;
    try { await aiCenterApi.deleteProvider(id); load(); } catch (err) { alert(err.message); }
  };

  const editProvider = (p) => {
    setForm({ name: p.name, key: p.key, provider: p.provider, model: p.model, apiKey: '', baseUrl: p.baseUrl || '', temperature: p.temperature, maxTokens: p.maxTokens, priority: p.priority, isEnabled: p.isEnabled, supportsStreaming: p.supportsStreaming, supportsThinking: p.supportsThinking });
    setEditing(p.id); setShowForm(true);
  };

  const providerColors = { gemini: 'bg-blue-100 text-blue-700', openai: 'bg-green-100 text-green-700', claude: 'bg-purple-100 text-purple-700', deepseek: 'bg-cyan-100 text-cyan-700', grok: 'bg-pink-100 text-pink-700', openrouter: 'bg-indigo-100 text-indigo-700' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">AI Providers</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { try { await aiCenterApi.checkAllProviders(); alert('Health check complete'); load(); } catch {} }} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Check All</button>
          <button onClick={() => { setEditing(null); setForm({ name: '', key: '', provider: 'gemini', model: 'gemini-1.5-pro', apiKey: '', baseUrl: '', temperature: 0.7, maxTokens: 4096, priority: 0, isEnabled: true, supportsStreaming: true, supportsThinking: false }); setShowForm(true); }} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Provider</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Provider' : 'New Provider'}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-gray-500">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Key</label><input value={form.key} onChange={e => setForm({...form, key: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Provider</label><select value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1"><option value="gemini">Gemini</option><option value="openai">OpenAI</option><option value="claude">Claude</option><option value="deepseek">DeepSeek</option><option value="grok">Grok</option><option value="openrouter">OpenRouter</option><option value="bolt">Bolt</option></select></div>
            <div><label className="text-xs text-gray-500">Model</label><input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">API Key {editing && '(leave blank to keep)'}</label><input type="password" value={form.apiKey} onChange={e => setForm({...form, apiKey: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Base URL</label><input value={form.baseUrl} onChange={e => setForm({...form, baseUrl: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Temperature</label><input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Max Tokens</label><input type="number" value={form.maxTokens} onChange={e => setForm({...form, maxTokens: parseInt(e.target.value)})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">Priority</label><input type="number" value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value)})} className="w-full border rounded px-2 py-1.5 text-sm mt-1" /></div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.isEnabled} onChange={e => setForm({...form, isEnabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Enabled</span></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.supportsStreaming} onChange={e => setForm({...form, supportsStreaming: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Streaming</span></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.supportsThinking} onChange={e => setForm({...form, supportsThinking: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Thinking</span></label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : providers.length === 0 ? <div className="text-center py-12 text-gray-500">No providers configured</div> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Model</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Health</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Features</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${providerColors[p.provider] || 'bg-gray-100'}`}>{p.name}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.model}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${p.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isEnabled ? 'Enabled' : 'Disabled'}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${p.healthStatus === 'healthy' || p.healthStatus === 'online' ? 'text-green-600' : p.healthStatus === 'offline' ? 'text-red-600' : 'text-gray-400'}`}>{p.healthStatus === 'healthy' || p.healthStatus === 'online' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{p.healthStatus || 'unknown'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.priority}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">{p.supportsStreaming && <Zap className="w-3 h-3 text-yellow-500" title="Streaming" />}{p.supportsThinking && <Brain className="w-3 h-3 text-purple-500" title="Thinking" />}</div></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleTest(p.id)} className="text-blue-600 hover:text-blue-800"><Play className="w-4 h-4" /></button><button onClick={() => editProvider(p)} className="text-gray-600 hover:text-gray-800"><Edit3 className="w-4 h-4" /></button><button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
