import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, XCircle, Filter, Building, Calendar, CheckCircle, Clock } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

export default function TemplateDeployments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!id) return;
    templatesApi.getVersions(id).then(() => {}).catch(() => {});
    setLoading(true);
    Promise.resolve().then(async () => {
      try {
        const res = await templatesApi.list({ limit: 100 });
        const allTemplates = res.templates || [];
        Promise.all(
          allTemplates.map(async (t) => {
            try {
              const detail = await templatesApi.get(t.id);
              return detail.template;
            } catch { return null; }
          })
        ).then(results => {
          const allAssignments = [];
          results.forEach(t => {
            if (t?.assignments) {
              t.assignments.forEach(a => {
                allAssignments.push({ ...a, templateName: t.name, templateId: t.id });
              });
            }
          });
          const filtered = allAssignments.filter(a => a.templateId === id || !id);
          setAssignments(filtered);
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    });
  }, [id]);

  const handleUnassign = async (businessId) => {
    if (!confirm('Unassign this template from this business?')) return;
    try {
      await templatesApi.unassignFromBusiness(id, businessId);
      setAssignments(prev => prev.filter(a => a.businessId !== businessId));
    } catch (err) { alert('Unassign failed: ' + err.message); }
  };

  const filtered = filterStatus === 'all' ? assignments : assignments.filter(a => a.status === filterStatus);
  const statuses = [...new Set(assignments.map(a => a.status))];

  const StatusBadge = ({ status }) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-600',
      deployed: 'bg-green-50 text-green-600',
      pending: 'bg-amber-50 text-amber-600',
      failed: 'bg-red-50 text-red-600',
      inactive: 'bg-gray-50 text-gray-500'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/cms/templates/${id}`)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deployments & Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business assignments and deployment status</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
          <button onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            All ({assignments.length})
          </button>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filterStatus === s ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              {s} ({assignments.filter(a => a.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Layers size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No Deployments</h3>
          <p className="text-sm text-gray-300">This template has not been assigned to any businesses yet.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Deployment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Assigned At</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-gray-300" />
                        <span className="text-sm font-bold text-gray-800">{a.businessName || a.businessId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status || 'pending'} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {a.deploymentUrl ? (
                          <a href={a.deploymentUrl} target="_blank" rel="noopener noreferrer"
                            className="text-primary font-bold hover:underline flex items-center gap-1">
                            <CheckCircle size={12} className="text-emerald-500" /> Deployed
                          </a>
                        ) : (
                          <span className="flex items-center gap-1"><Clock size={12} /> Pending</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleUnassign(a.businessId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 ml-auto">
                        <XCircle size={12} /> Unassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
