import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, RefreshCw, Activity } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

export default function AssignmentHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentApi.getHistory(id).then(res => setHistory(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading history...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/cms/business-assignment/${id}`)} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Assignment History</h1>
      </div>

      <div className="bg-white rounded-lg border">
        {history.length === 0 ? (
          <div className="p-12 text-center"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No history records</p></div>
        ) : (
          <div className="divide-y">
            {history.map((entry, i) => (
              <div key={entry.id || i} className="p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {entry.action === 'ASSIGNMENT_CREATED' ? <FileText className="w-4 h-4 text-blue-600" /> :
                   entry.action === 'STATUS_CHANGED' ? <Activity className="w-4 h-4 text-purple-600" /> :
                   <RefreshCw className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                    {entry.newStatus && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{entry.newStatus}</span>}
                    {entry.previousStatus && <span className="text-xs text-gray-400">from {entry.previousStatus}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(entry.createdAt).toLocaleString()} by {entry.performedBy || 'system'}</div>
                  {entry.changes && <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-20">{JSON.stringify(entry.changes, null, 2)}</pre>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
