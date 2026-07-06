import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, DollarSign, Activity, TrendingUp, RefreshCw, Database } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AIUsage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [costSummary, setCostSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [usageRes, costRes] = await Promise.all([aiCenterApi.getUsageSummary(), aiCenterApi.getCostSummary()]);
      setSummary(usageRes.data);
      setCostSummary(costRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Usage & Cost</h1>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><BarChart3 className="w-4 h-4" /> All Time Tokens</div>
          <div className="text-2xl font-bold">{(summary?.allTime?.tokens || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Activity className="w-4 h-4" /> Today</div>
          <div className="text-2xl font-bold">{(summary?.today?.tokens || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><TrendingUp className="w-4 h-4" /> This Month</div>
          <div className="text-2xl font-bold">{(summary?.thisMonth?.tokens || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><DollarSign className="w-4 h-4" /> Total Cost</div>
          <div className="text-2xl font-bold text-green-600">${(summary?.allTime?.cost || 0).toFixed(4)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><DollarSign className="w-4 h-4" /> Today</div>
          <div className="text-2xl font-bold">${(summary?.today?.cost || 0).toFixed(4)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><DollarSign className="w-4 h-4" /> This Month</div>
          <div className="text-2xl font-bold">${(summary?.thisMonth?.cost || 0).toFixed(4)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Usage by Model</h2>
          {summary?.byModel?.length > 0 ? (
            <div className="space-y-2">
              {summary.byModel.map(m => (
                <div key={m.model} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600">{m.model}</span>
                  <div className="flex gap-3 text-xs">
                    <span>{(m._sum?.totalTokens || 0).toLocaleString()} tokens</span>
                    <span className="text-green-600">${(m._sum?.cost || 0).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-gray-400 text-center py-4">No data</div>}
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cost by Provider</h2>
          {costSummary?.byProvider?.length > 0 ? (
            <div className="space-y-2">
              {costSummary.byProvider.map(p => (
                <div key={p.providerId} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600">{p.providerName || p.providerId}</span>
                  <span className="text-green-600 font-medium">${(p.cost || 0).toFixed(4)}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-gray-400 text-center py-4">No data</div>}
        </div>
      </div>
    </div>
  );
}
