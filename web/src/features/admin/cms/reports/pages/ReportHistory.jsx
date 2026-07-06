import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw, FileText, Eye } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

export default function ReportHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [historyRes, reportRes] = await Promise.all([
        reportsApi.getHistory(id),
        reportsApi.get(id)
      ]);
      setHistory(historyRes.data || []);
      setReport(reportRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading history...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/cms/reports/${id}`)} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report History</h1>
          {report && <p className="text-sm text-gray-500">{report.sourceLabel}</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No history records for this report</p>
          </div>
        ) : (
          <div className="divide-y">
            {history.map((entry, i) => (
              <div key={entry.id || i} className="p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {entry.action === 'GENERATED' ? <FileText className="w-4 h-4 text-blue-600" /> :
                   entry.action === 'REGENERATED' ? <RefreshCw className="w-4 h-4 text-purple-600" /> :
                   <Clock className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.newStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      entry.newStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{entry.newStatus}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(entry.createdAt).toLocaleString()} - by {entry.performedBy || 'system'}
                  </div>
                  {entry.changes && (
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-20">
                      {JSON.stringify(entry.changes, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
