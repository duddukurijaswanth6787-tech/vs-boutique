import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

export default function ReportAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [analyticsRes, trendsRes] = await Promise.all([
        reportsApi.getAnalytics({ periodStart: '', periodEnd: '' }),
        reportsApi.getTrends()
      ]);
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading analytics...</div>;
  }

  const distKeys = analytics?.scoreDistribution ? Object.keys(analytics.scoreDistribution) : [];
  const maxDist = analytics?.scoreDistribution ? Math.max(...Object.values(analytics.scoreDistribution)) : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/reports')} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Report Analytics</h1>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">Total Reports</span>
              </div>
              <div className="text-2xl font-bold mt-1">{analytics.totalReports}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">Average Score</span>
              </div>
              <div className="text-2xl font-bold mt-1">{analytics.avgScore}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500">Pass Rate</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{analytics.passRate}%</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-500">Pass / Fail</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {analytics.passCount}<span className="text-sm text-gray-400 font-normal"> / {analytics.failCount}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Distribution</h2>
              <div className="space-y-2">
                {distKeys.map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-12">{key}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${
                          key === '81-100' ? 'bg-green-500' :
                          key === '61-80' ? 'bg-blue-500' :
                          key === '41-60' ? 'bg-yellow-500' :
                          key === '21-40' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(analytics.scoreDistribution[key] / maxDist) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-8 text-right">{analytics.scoreDistribution[key]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Section Averages</h2>
              {analytics.sectionAverages && Object.keys(analytics.sectionAverages).length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(analytics.sectionAverages).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-32 truncate">{key}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${val >= 70 ? 'bg-green-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">{Math.round(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No section data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Trends</h2>
            {trends.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trends.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24">{new Date(t.date).toLocaleDateString()}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${t.score >= 70 ? 'bg-green-500' : t.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${t.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-20 text-right">{t.score} - {t.label?.substring(0, 20)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No trend data available</p>
            )}
          </div>
        </>
      )}

      {!analytics && (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
          No analytics data available
        </div>
      )}
    </div>
  );
}
