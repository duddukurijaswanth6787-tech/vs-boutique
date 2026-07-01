import React, { useState, useEffect } from 'react';
import { BarChart3, Layers, Star, TrendingUp, Calendar, Filter, Eye, Download, Heart } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

export default function TemplateAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    Promise.all([
      templatesApi.getAnalytics({ dateRange, templateId: selectedTemplate || undefined }).catch(() => ({ analytics: null })),
      templatesApi.getPopular().catch(() => ({ templates: [] }))
    ]).then(([a, p]) => {
      setAnalytics(a.analytics || null);
      setPopular(p.templates || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dateRange, selectedTemplate]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const actions = analytics?.usageByAction || [];
  const totalDeployments = analytics?.totalDeployments || 0;
  const totalViews = analytics?.totalViews || 0;
  const totalFavorites = analytics?.totalFavorites || 0;
  const maxActionCount = actions.length > 0 ? Math.max(...actions.map(a => a._count)) : 1;

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
        <h1 className="text-xl font-bold text-gray-900">Template Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Usage statistics across templates</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '1y', label: '1 Year' }
          ].map(r => (
            <button key={r.value} onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === r.value ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-300" />
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Templates</option>
            {popular.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Total Views" value={totalViews} color="bg-blue-500" />
        <StatCard icon={Layers} label="Total Deployments" value={totalDeployments} color="bg-emerald-500" />
        <StatCard icon={Heart} label="Total Favorites" value={totalFavorites} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Total Templates" value={popular.length} color="bg-purple-500" />
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
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (a._count / maxActionCount) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-800 w-8 text-right">{a._count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Popular Templates</h3>
          {popular.length === 0 ? (
            <p className="text-sm text-gray-400">No popular templates yet</p>
          ) : (
            <div className="space-y-3">
              {popular.slice(0, 10).map((t, i) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{t.name}</p>
                      <p className="text-[10px] text-gray-400">{t.tier} {t.category?.name ? `· ${t.category.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star size={12} /> {t.rating || '0'}</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> {t._count?.favorites || 0}</span>
                    <span className="flex items-center gap-1"><Layers size={12} /> {t._count?.deployments || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Deployment Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{totalDeployments}</p>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1">Total Deployments</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{popular.filter(t => t._count?.deployments > 0).length}</p>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Active Templates</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{popular.length}</p>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mt-1">Total Templates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
