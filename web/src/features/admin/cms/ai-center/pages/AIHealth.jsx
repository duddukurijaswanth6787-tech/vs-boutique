import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, RefreshCw, Server, Cpu, CheckCircle, XCircle, AlertTriangle, Clock, Database, Activity } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AIHealth() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await aiCenterApi.getHealth(); setHealth(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const runCheck = async () => {
    try { const res = await aiCenterApi.runHealthCheck(); setHealth(res.data); alert('Health check complete'); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading health status...</div>;

  const overallColor = health?.overall === 'healthy' ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">AI Health</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={runCheck} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Activity className="w-4 h-4" /> Run Health Check</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-3">
          <Shield className={`w-8 h-8 ${overallColor}`} />
          <div>
            <div className="text-xl font-bold capitalize">{health?.overall || 'Unknown'}</div>
            <div className="text-sm text-gray-500">Overall System Health</div>
          </div>
          <div className="ml-auto text-xs text-gray-400">Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Server className="w-4 h-4" /> Provider Health</h2>
          <div className="space-y-2">
            {health?.providers?.length > 0 ? health.providers.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.provider} / {p.model}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs ${p.healthStatus === 'healthy' || p.healthStatus === 'online' ? 'text-green-600' : p.healthStatus === 'offline' ? 'text-red-600' : 'text-gray-400'}`}>
                    {p.healthStatus === 'healthy' || p.healthStatus === 'online' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{p.healthStatus}
                  </span>
                  {p.lastHealthCheck && <span className="text-xs text-gray-400">{new Date(p.lastHealthCheck).toLocaleTimeString()}</span>}
                </div>
              </div>
            )) : <div className="text-gray-400 text-center py-4">No providers</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4" /> Agent Health</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {health?.agents?.length > 0 ? health.agents.map(a => (
              <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.category}</div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs ${a.healthStatus === 'healthy' ? 'text-green-600' : 'text-gray-400'}`}>
                  {a.healthStatus === 'healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}{a.healthStatus || 'unknown'}
                </span>
              </div>
            )) : <div className="text-gray-400 text-center py-4">No agents</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Database className="w-4 h-4" /> Infrastructure</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Redis</span>
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${health?.infrastructure?.redis?.status === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>
              {health?.infrastructure?.redis?.status === 'connected' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{health?.infrastructure?.redis?.status || 'unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Queue</span>
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${health?.infrastructure?.queue?.status === 'bullmq' ? 'text-green-600' : health?.infrastructure?.queue?.status === 'in-memory' ? 'text-orange-600' : 'text-gray-400'}`}>
              {health?.infrastructure?.queue?.status === 'bullmq' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{health?.infrastructure?.queue?.mode || health?.infrastructure?.queue?.status || 'unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
