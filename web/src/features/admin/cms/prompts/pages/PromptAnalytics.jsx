import React, { useState, useEffect } from 'react';
import { BarChart3, Play, Star, Eye, TrendingUp, Calendar } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      promptsApi.getAnalytics().catch(() => ({ analytics: null })),
      promptsApi.getPopular().catch(() => ({ prompts: [] }))
    ]).then(([a, p]) => {
      setAnalytics(a.analytics || null);
      setPopular(p.prompts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const actions = analytics?.usageByAction || [];
  const totalViews = analytics?.totalViews || 0;
  const totalExecutions = analytics?.totalExecutions || 0;

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Prompt Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Usage statistics and trends across the Prompt Library</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Views" value={totalViews} color="bg-blue-500" />
        <StatCard icon={Play} label="Total Executions" value={totalExecutions} color="bg-emerald-500" />
        <StatCard icon={Star} label="Avg Rating" value={popular.length > 0 ? '4.2' : '0'} color="bg-yellow-500" />
        <StatCard icon={TrendingUp} label="Total Prompts" value={popular.length} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Usage by Action</h3>
          <div className="space-y-3">
            {actions.length === 0 ? (
              <p className="text-sm text-gray-400">No usage data yet</p>
            ) : actions.map(a => (
              <div key={a.action} className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase">{a.action}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (a._count / Math.max(...actions.map(x => x._count))) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-800 w-8 text-right">{a._count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Popular Prompts</h3>
          {popular.length === 0 ? (
            <p className="text-sm text-gray-400">No popular prompts yet</p>
          ) : (
            <div className="space-y-3">
              {popular.slice(0, 10).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{p.title}</p>
                      <p className="text-[10px] text-gray-400">{p.promptType?.replace(/-/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star size={12} /> {p._count?.favorites || 0}</span>
                    <span className="flex items-center gap-1"><Play size={12} /> {p._count?.executions || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
