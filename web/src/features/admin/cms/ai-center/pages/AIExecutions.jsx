import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, RefreshCw, Search, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

const STATUS_COLORS = { PENDING: 'bg-gray-100 text-gray-600', PROCESSING: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700', FAILED: 'bg-red-100 text-red-700', RETRYING: 'bg-yellow-100 text-yellow-700' };

export default function AIExecutions() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await aiCenterApi.getExecutions(params);
      setExecutions(res.data?.executions || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const showDetails = async (id) => {
    setSelected(id);
    try {
      const [exRes, logRes] = await Promise.all([aiCenterApi.getExecution(id), aiCenterApi.getExecutionLogs(id)]);
      setDetails({ ...exRes.data, logs: logRes.data || [] });
    } catch { setDetails(null); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">AI Executions</h1>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 text-xs rounded-full border ${statusFilter === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{s || 'All'}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? <div className="p-12 text-center text-gray-500">Loading...</div> : executions.length === 0 ? <div className="p-12 text-center text-gray-500">No executions</div> : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {executions.map(e => (
                  <div key={e.id} onClick={() => showDetails(e.id)} className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selected === e.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{e.agentKey || e.id.substring(0, 12)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>{e.tokensUsed > 0 ? `${e.tokensUsed} tokens` : '-'}</span>
                      <span>{e.latencyMs > 0 ? `${e.latencyMs}ms` : '-'}</span>
                      <span>{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t">
                  <span className="text-xs text-gray-500">{total} total</span>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30">Prev</button>
                    <span className="text-xs text-gray-600 self-center">{page}/{totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4">
          {details ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Execution Details</h2>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs">{details.id}</span></div>
                <div><span className="text-gray-500">Agent:</span> <span>{details.agentId}</span></div>
                <div><span className="text-gray-500">Status:</span> <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[details.status] || 'bg-gray-100'}`}>{details.status}</span></div>
                <div><span className="text-gray-500">Tokens:</span> <span>{details.tokensUsed || 0}</span></div>
                <div><span className="text-gray-500">Latency:</span> <span>{details.latencyMs || 0}ms</span></div>
                <div><span className="text-gray-500">Retries:</span> <span>{details.retryCount || 0}</span></div>
                <div><span className="text-gray-500">Created:</span> <span>{new Date(details.createdAt).toLocaleString()}</span></div>

                {details.logs?.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-gray-600 mt-3 mb-1">Logs</h3>
                    <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
                      {details.logs.map(log => (
                        <div key={log.id} className={`py-0.5 ${log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARN' ? 'text-yellow-600' : 'text-gray-600'}`}>
                          [{log.level}] {log.message}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {details.steps?.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-gray-600 mt-3 mb-1">Steps</h3>
                    {details.steps.map(s => (
                      <div key={s.id} className="flex items-center gap-2 py-1 text-xs">
                        <span className={`w-2 h-2 rounded-full ${s.status === 'COMPLETED' ? 'bg-green-500' : s.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">{s.agentName || s.agentKey}</span>
                        <span className="text-gray-400">{s.latencyMs > 0 ? `${s.latencyMs}ms` : ''}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-12">Select an execution to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
