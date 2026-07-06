import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight, BarChart3, Activity } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIGURING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-blue-100 text-blue-700',
  DEPLOYING: 'bg-purple-100 text-purple-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-100 text-red-700'
};

export default function BusinessAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const limit = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assignmentApi.list({ page, limit, search: search || undefined, status: statusFilter || undefined });
      setAssignments(res.data?.assignments || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try { const res = await assignmentApi.getStats(); setStats(res.data); } catch {}
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Assign certified templates to businesses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/cms/business-assignment/analytics')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
          <button onClick={() => navigate('/admin/cms/business-assignment/jobs')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Activity className="w-4 h-4" /> Queue
          </button>
          <button onClick={() => navigate('/admin/cms/business-assignment/wizard')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.statusBreakdown?.ACTIVE || 0}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.statusBreakdown?.READY || 0}</div>
            <div className="text-sm text-gray-500">Ready</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.statusBreakdown?.DEPLOYING || 0}</div>
            <div className="text-sm text-gray-500">Deploying</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search assignments..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIGURING">Configuring</option>
            <option value="READY">Ready</option>
            <option value="DEPLOYING">Deploying</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={fetch} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-600" /></button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No assignments yet</p>
            <button onClick={() => navigate('/admin/cms/business-assignment/wizard')} className="mt-3 text-sm text-blue-600 hover:underline">Create your first assignment</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/cms/business-assignment/${a.id}`)}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.template?.name || a.templateId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.businessId?.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{a.template?.tier || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.assignedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); navigate(`/admin/cms/business-assignment/${a.id}`); }} className="text-sm text-blue-600 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">{total} total</span>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
