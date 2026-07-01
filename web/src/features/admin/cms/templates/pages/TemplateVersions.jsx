import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, RotateCcw, Clock, User, AlertTriangle, X } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

export default function TemplateVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState(null);

  useEffect(() => {
    if (!id) return;
    templatesApi.getVersions(id).then(r => {
      setVersions(r.versions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    try {
      await templatesApi.rollbackVersion(id, rollbackTarget.version);
      setRollbackTarget(null);
      alert(`Rolled back to version ${rollbackTarget.version}`);
      const res = await templatesApi.getVersions(id);
      setVersions(res.versions || []);
    } catch (err) { alert('Rollback failed: ' + err.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/cms/templates/${id}`)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Version History</h1>
          <p className="text-sm text-gray-400 mt-0.5">All versions of this template</p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-20">
          <History size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No Version History</h3>
          <p className="text-sm text-gray-300">No versions recorded for this template yet.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Change Notes</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Created By</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {versions.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-bold">v{v.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-800">{v.name || `Version ${v.version}`}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-xs text-gray-500 max-w-xs truncate">{v.changeNotes || '-'}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={12} className="text-gray-300" />
                        {v.createdBy?.name || v.createdBy || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} className="text-gray-300" />
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setRollbackTarget(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 ml-auto">
                        <RotateCcw size={12} /> Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {versions.length > 1 && (
        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Version Diff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Compare From</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {versions.map(v => <option key={v.id} value={v.version}>v{v.version}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Compare To</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {versions.map(v => <option key={v.id} value={v.version}>v{v.version}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {rollbackTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setRollbackTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Confirm Rollback</h3>
                <p className="text-xs text-gray-400">Rollback to version {rollbackTarget.version}?</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">This action will revert the template to the state it was in at version {rollbackTarget.version}. Any changes made after this version will be lost.</p>
            <div className="flex items-center gap-2">
              <button onClick={handleRollback}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Confirm Rollback</button>
              <button onClick={() => setRollbackTarget(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
