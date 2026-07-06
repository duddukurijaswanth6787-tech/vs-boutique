import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Play, CheckCircle, PauseCircle, Archive, RotateCcw, History, Activity } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700', CONFIGURING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-blue-100 text-blue-700', DEPLOYING: 'bg-purple-100 text-purple-700',
  ACTIVE: 'bg-green-100 text-green-700', SUSPENDED: 'bg-orange-100 text-orange-700',
  ARCHIVED: 'bg-gray-100 text-gray-500', FAILED: 'bg-red-100 text-red-700'
};

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const res = await assignmentApi.get(id); setAssignment(res.data); } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const action = async (fn, msg) => {
    try { await fn(id); alert(msg); load(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading assignment...</div>;
  if (!assignment) return <div className="p-6 text-center text-gray-500">Assignment not found</div>;

  const config = assignment.config;
  const recentHistory = assignment.history?.[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/business-assignment')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.template?.name || 'Assignment'}</h1>
          <p className="text-sm text-gray-500">ID: {assignment.id}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[assignment.status] || 'bg-gray-100 text-gray-600'}`}>{assignment.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Template</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{assignment.template?.name || '-'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span>{assignment.template?.status || '-'}</span></div>
              <div><span className="text-gray-500">Tier:</span> <span>{assignment.template?.tier || '-'}</span></div>
              <div><span className="text-gray-500">Version:</span> <span>{assignment.template?.version || '-'}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Description:</span> <span>{assignment.template?.description || '-'}</span></div>
            </div>
          </div>

          {config && (
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Configuration</h2>
                <button onClick={() => navigate(`/admin/cms/business-assignment/${id}/config`)} className="text-sm text-blue-600 hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Theme:</span> <span>{config.theme}</span></div>
                <div><span className="text-gray-500">Primary:</span> <span className="inline-block w-4 h-4 rounded align-middle" style={{ backgroundColor: config.primaryColor }} /> {config.primaryColor}</div>
                <div><span className="text-gray-500">Secondary:</span> <span className="inline-block w-4 h-4 rounded align-middle" style={{ backgroundColor: config.secondaryColor }} /> {config.secondaryColor}</div>
                <div><span className="text-gray-500">Language:</span> <span>{config.language}</span></div>
                <div><span className="text-gray-500">Currency:</span> <span>{config.currency}</span></div>
                <div><span className="text-gray-500">Timezone:</span> <span>{config.timezone}</span></div>
                <div><span className="text-gray-500">Email:</span> <span>{config.contactEmail || '-'}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span>{config.contactPhone || '-'}</span></div>
                <div><span className="text-gray-500">GA ID:</span> <span>{config.googleAnalyticsId || '-'}</span></div>
              </div>
            </div>
          )}

          {recentHistory && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Last Activity</h2>
              <div className="text-sm">
                <span className="font-medium">{recentHistory.action}</span>
                <span className="text-gray-500 ml-2">{new Date(recentHistory.createdAt).toLocaleString()}</span>
                {recentHistory.performedBy && <span className="text-gray-400 ml-2">by {recentHistory.performedBy}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate(`/admin/cms/business-assignment/${id}/config`)} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Settings className="w-4 h-4" /> Configure</button>
              <button onClick={() => action(assignmentApi.validate, 'Validation complete')} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Activity className="w-4 h-4" /> Validate</button>
              <button onClick={() => action(assignmentApi.deploy, 'Deployment prepared')} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Play className="w-4 h-4" /> Prepare Deploy</button>
              <button onClick={() => action(assignmentApi.activate, 'Activated')} className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" /> Activate</button>
              <button onClick={() => action(assignmentApi.suspend, 'Suspended')} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><PauseCircle className="w-4 h-4" /> Suspend</button>
              <button onClick={() => action(assignmentApi.archive, 'Archived')} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><Archive className="w-4 h-4" /> Archive</button>
              <button onClick={() => action(assignmentApi.rollback, 'Rolled back')} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><RotateCcw className="w-4 h-4" /> Rollback</button>
              <button onClick={() => navigate(`/admin/cms/business-assignment/${id}/history`)} className="w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"><History className="w-4 h-4" /> History</button>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pipeline</h2>
            {['DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE'].map((s, i) => (
              <div key={s} className={`flex items-center gap-2 py-1.5 text-sm ${assignment.status === s ? 'font-semibold text-blue-600' : assignment.status === 'ARCHIVED' || assignment.status === 'SUSPENDED' || assignment.status === 'FAILED' ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${assignment.status === s ? 'bg-blue-600' : i < ['DRAFT','CONFIGURING','READY','DEPLOYING','ACTIVE'].indexOf(assignment.status) ? 'bg-green-500' : 'bg-gray-300'}`} />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
