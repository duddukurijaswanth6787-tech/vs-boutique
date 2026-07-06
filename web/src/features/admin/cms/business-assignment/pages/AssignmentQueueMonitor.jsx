import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Activity, CheckCircle, XCircle, Clock, Server, Database } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

export default function AssignmentQueueMonitor() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await assignmentApi.getJobs(); setJobs(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/business-assignment/analytics')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">Queue Monitor</h1>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <Server className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">Queue Provider:</span>
        <span className={`font-medium ${jobs?.redis ? 'text-green-600' : 'text-orange-600'}`}>
          {jobs?.redis ? 'Redis (BullMQ)' : 'In-Memory (Fallback)'}
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500">Loading queue status...</div>
      ) : !jobs?.queues || Object.keys(jobs.queues).length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500">No assignment queue data available</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-3">Queue</th>
                <th className="px-4 py-3 text-center"><Activity className="w-3 h-3 inline" /> Waiting</th>
                <th className="px-4 py-3 text-center"><Clock className="w-3 h-3 inline" /> Active</th>
                <th className="px-4 py-3 text-center"><CheckCircle className="w-3 h-3 inline text-green-500" /> Completed</th>
                <th className="px-4 py-3 text-center"><XCircle className="w-3 h-3 inline text-red-500" /> Failed</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(jobs.queues).map(([name, data]) => {
                const total = data.waiting + data.active + data.completed + data.failed;
                return (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                    <td className="px-4 py-3 text-sm text-center">{data.waiting}</td>
                    <td className="px-4 py-3 text-sm text-center">{data.active}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-600">{data.completed}</td>
                    <td className="px-4 py-3 text-sm text-center text-red-600">{data.failed}</td>
                    <td className="px-4 py-3 text-center">
                      {data.active > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Processing</span>
                      ) : data.waiting > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                      ) : data.failed > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Has Failures</span>
                      ) : total > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Healthy</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Idle</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <button onClick={async () => { try { await assignmentApi.clearCache(); alert('Cache cleared'); } catch {} }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 border rounded hover:bg-gray-50">
          <Database className="w-3 h-3" /> Clear Assignment Cache
        </button>
      </div>
    </div>
  );
}
