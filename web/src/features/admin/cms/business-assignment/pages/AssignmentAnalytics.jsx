import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, PieChart, Activity, RefreshCw, Database, TrendingUp, Layers, CheckCircle, XCircle, Clock, Layout } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-400', CONFIGURING: 'bg-yellow-500', READY: 'bg-blue-500',
  DEPLOYING: 'bg-purple-500', ACTIVE: 'bg-green-500', SUSPENDED: 'bg-orange-500',
  ARCHIVED: 'bg-gray-300', FAILED: 'bg-red-500'
};

const STATUS_LABELS = ['DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'FAILED'];

export default function AssignmentAnalytics() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await assignmentApi.getDashboard(); setDashboard(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await assignmentApi.clearCache(); const res = await assignmentApi.recalculateAnalytics(); setDashboard(res.data); } catch {}
    setRefreshing(false);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading analytics...</div>;
  if (!dashboard) return <div className="p-6 text-center text-gray-500">No analytics data available. Create some assignments first.</div>;

  const maxCount = Math.max(1, ...Object.values(dashboard.statusDistribution || {}));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/business-assignment')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Analytics Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => navigate('/admin/cms/business-assignment/jobs')} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
            <Activity className="w-4 h-4" /> Queue Monitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /><span className="text-sm text-gray-500">Total</span></div>
          <div className="text-2xl font-bold mt-1">{dashboard.totalAssignments}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">Active</span></div>
          <div className="text-2xl font-bold mt-1 text-green-600">{dashboard.activeAssignments}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-500" /><span className="text-sm text-gray-500">Ready</span></div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{dashboard.readyAssignments}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500" /><span className="text-sm text-gray-500">Deploy Success</span></div>
          <div className="text-2xl font-bold mt-1 text-purple-600">{dashboard.deploymentSuccessRate}%</div>
          <div className="text-xs text-gray-400">{dashboard.totalDeployments} total deployments</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4" /> Status Distribution</h2>
          <div className="space-y-2">
            {STATUS_LABELS.map(key => {
              const count = dashboard.statusDistribution?.[key] || 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24">{key}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div className={`h-full rounded transition-all ${STATUS_COLORS[key] || 'bg-gray-400'}`} style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Layout className="w-4 h-4" /> Template Usage</h2>
          {dashboard.templateUsage?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboard.templateUsage.map(t => (
                <div key={t.templateId} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600 truncate flex-1">{t.templateId.substring(0, 12)}...</span>
                  <span className="font-medium text-gray-800 ml-2">{t._count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-gray-400 py-4 text-center">No template data</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Daily Trends (30 days)</h2>
          {dashboard.dailyTrends?.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {dashboard.dailyTrends.slice(-14).map(d => (
                <div key={d.date} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-24">{d.date}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.min(100, (d.count / Math.max(1, ...dashboard.dailyTrends.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <span className="text-gray-600 w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-gray-400 py-4 text-center">No activity data</div>}
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Monthly Trends</h2>
          {dashboard.monthlyTrends?.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {dashboard.monthlyTrends.map(m => (
                <div key={m.month} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-16">{m.month}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-green-500 rounded" style={{ width: `${Math.min(100, (m.count / Math.max(1, ...dashboard.monthlyTrends.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <span className="text-gray-600 w-6 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-gray-400 py-4 text-center">No monthly data</div>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handleRefresh} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border rounded hover:bg-gray-50">
          <Database className="w-3 h-3" /> Clear Cache & Recalculate
        </button>
      </div>
    </div>
  );
}
