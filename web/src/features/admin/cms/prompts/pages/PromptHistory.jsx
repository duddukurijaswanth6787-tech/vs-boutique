import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, History, RotateCcw, Eye, Clock, User } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptHistory() {
  const { id } = useParams();
  const [versions, setVersions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('versions');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      promptsApi.getVersions(id).catch(() => ({ versions: [] })),
      promptsApi.getHistory(id).catch(() => ({ history: [] }))
    ]).then(([v, h]) => {
      setVersions(v.versions || []);
      setHistory(h.history || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleRollback = async (version) => {
    if (!confirm(`Rollback to version ${version}?`)) return;
    try {
      await promptsApi.rollback(id, version);
      alert(`Rolled back to version ${version}`);
      window.location.reload();
    } catch (err) { alert('Rollback failed: ' + err.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prompt History</h1>
          <p className="text-sm text-gray-400 mt-0.5">Version history and activity log</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        {['versions', 'activity'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {tab === 'versions' ? 'Version History' : 'Activity Log'}
          </button>
        ))}
      </div>

      {activeTab === 'versions' ? (
        versions.length === 0 ? (
          <div className="text-center py-16">
            <History size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No version history available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map(v => (
              <div key={v.id} className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-bold text-sm">v{v.version}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Version {v.version}</p>
                    {v.changeNotes && <p className="text-xs text-gray-400 mt-0.5">{v.changeNotes}</p>}
                    <p className="text-[10px] text-gray-300 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {new Date(v.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRollback(v.version)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">
                  <RotateCcw size={12} /> Rollback
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div className="text-center py-16">
            <History size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No activity recorded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.action === 'created' ? 'bg-emerald-50 text-emerald-600' : h.action === 'updated' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                    {h.action}
                  </span>
                  <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
                {h.userId && <span className="text-[10px] text-gray-400 flex items-center gap-1"><User size={10} /> {h.userId.substring(0, 8)}</span>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
