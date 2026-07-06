import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Server, Cpu, Database, Shield, DollarSign, BarChart3, PieChart, RefreshCw, CheckCircle, XCircle, Clock, Zap, TrendingUp, Layers, Bot } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AICenterDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await aiCenterApi.getDashboard(); setDashboard(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading AI Center dashboard...</div>;
  if (!dashboard) return <div className="p-6 text-center text-gray-500">No data available</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Center</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><Server className="w-5 h-5 text-blue-500" /><span className="text-sm text-gray-500">Providers</span></div>
          <div className="text-2xl font-bold mt-1">{dashboard.providers?.total || 0}</div>
          <div className="text-xs text-green-600">{dashboard.providers?.active || 0} active</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><Cpu className="w-5 h-5 text-purple-500" /><span className="text-sm text-gray-500">Agents</span></div>
          <div className="text-2xl font-bold mt-1">{dashboard.agents?.total || 0}</div>
          <div className="text-xs text-green-600">{dashboard.agents?.running || 0} running</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">Executions Today</span></div>
          <div className="text-2xl font-bold mt-1">{dashboard.executions?.today || 0}</div>
          <div className="text-xs text-gray-500">{dashboard.executions?.total || 0} total</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-yellow-500" /><span className="text-sm text-gray-500">Cost Today</span></div>
          <div className="text-2xl font-bold mt-1">${(dashboard.costs?.today || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">${(dashboard.costs?.thisMonth || 0).toFixed(2)} this month</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /><span className="text-sm text-gray-500">Token Usage (total)</span></div>
          <div className="text-xl font-bold mt-1">{(dashboard.usage?.totalTokens || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">${(dashboard.usage?.totalCost || 0).toFixed(2)} total cost</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">AI Availability</span></div>
          <div className="text-2xl font-bold mt-1">{dashboard.aiAvailability || 0}%</div>
          <div className="text-xs text-gray-500">{dashboard.providers?.offline || 0} offline</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /><span className="text-sm text-gray-500">Avg Response</span></div>
          <div className="text-2xl font-bold mt-1">{(dashboard.executions?.avgResponseTime || 0) < 1000 ? `${dashboard.executions?.avgResponseTime || 0}ms` : `${((dashboard.executions?.avgResponseTime || 0) / 1000).toFixed(1)}s`}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /><span className="text-sm text-gray-500">Failed</span></div>
          <div className="text-2xl font-bold mt-1 text-red-600">{dashboard.executions?.failed || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Database className="w-4 h-4" /> Infrastructure</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Queue</span><span className={`font-medium ${dashboard.queue?.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>{dashboard.queue?.length || 0} items</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Active Workflows</span><span className="font-medium">{dashboard.workflows?.active || 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Queue Mode</span><span className="font-medium">{dashboard.queue?.mode || 'N/A'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Provider Health</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dashboard.providers?.list?.length > 0 ? dashboard.providers.list.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{p.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${p.healthStatus === 'healthy' || p.healthStatus === 'online' ? 'bg-green-100 text-green-700' : p.healthStatus === 'offline' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{p.healthStatus || 'unknown'}</span>
              </div>
            )) : <div className="text-gray-400 text-center py-4">No providers configured</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Layers className="w-4 h-4" /> Quick Actions</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/admin/cms/ai-center/providers')} className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Server className="w-4 h-4" /> Manage Providers</button>
            <button onClick={() => navigate('/admin/cms/ai-center/agents')} className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Cpu className="w-4 h-4" /> Manage Agents</button>
            <button onClick={() => navigate('/admin/cms/ai-center/workflows')} className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Activity className="w-4 h-4" /> Workflows</button>
            <button onClick={() => navigate('/admin/cms/ai-center/executions')} className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"><Zap className="w-4 h-4" /> Executions</button>
            <button onClick={() => navigate('/admin/cms/ai-center/usage')} className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Usage & Cost</button>
          </div>
        </div>
      </div>
    </div>
  );
}
