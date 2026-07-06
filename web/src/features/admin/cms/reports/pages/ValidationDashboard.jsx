import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, BarChart3, Download, Trash2, Clock, ArrowUpDown } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

const STATUS_COLORS = {
  COMPLETED: 'bg-green-100 text-green-700',
  GENERATING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-gray-100 text-gray-600'
};

export default function ValidationDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search: search || undefined, status: statusFilter || undefined };
      const res = await reportsApi.list(params);
      setReports(res.data?.reports || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await reportsApi.getStats();
      setStats(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await reportsApi.delete(id);
      fetchReports();
      fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async (id) => {
    try {
      const res = await reportsApi.exportReport(id, 'json');
      alert(`Export generated: ${res.data?.fileUrl || 'Check exports'}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Aggregated reports from verification & certification engines</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/cms/reports/analytics')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
          <button onClick={() => navigate('/admin/cms/reports/generate')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Reports</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.avgScore}</div>
            <div className="text-sm text-gray-500">Avg Score</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.passRate}%</div>
            <div className="text-sm text-gray-500">Pass Rate</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="GENERATING">Generating</option>
            <option value="FAILED">Failed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button onClick={fetchReports} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reports yet</p>
            <button onClick={() => navigate('/admin/cms/reports/generate')} className="mt-3 text-sm text-blue-600 hover:underline">
              Generate your first report
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/cms/reports/${report.id}`)}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.sourceLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${report.overallScore >= 70 ? 'text-green-600' : report.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {report.overallScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-600'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report.sourceType}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleExport(report.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Export">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => navigate(`/admin/cms/reports/${report.id}/history`)} className="p-1.5 hover:bg-gray-100 rounded" title="History">
                            <Clock className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => handleDelete(report.id)} className="p-1.5 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">{total} total reports</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
