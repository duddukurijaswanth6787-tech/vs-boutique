import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, RotateCcw, Loader2, Terminal } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

export default function AssignmentDeploy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    try { const res = await assignmentApi.get(id); setAssignment(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleValidate = async () => {
    setDeploying(true);
    try { const res = await assignmentApi.validate(id); setResult(res.data); } catch (err) { alert(err.message); } finally { setDeploying(false); }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try { const res = await assignmentApi.deploy(id); setResult(res.data); load(); } catch (err) { alert(err.message); } finally { setDeploying(false); }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/cms/business-assignment/${id}`)} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Deployment</h1>
        {assignment && <span className="text-sm text-gray-500">{assignment.template?.name} - {assignment.status}</span>}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Deployment Pipeline</h2>
          {['DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE'].map((s, i) => {
            const statusIdx = ['DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE'].indexOf(assignment?.status);
            const isActive = assignment?.status === s;
            const isPast = statusIdx > i;
            return (
              <div key={s} className="flex items-center gap-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <div>
                  <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-500'}`}>{s}</div>
                  <div className="text-xs text-gray-400">
                    {s === 'DRAFT' && 'Assignment created'}
                    {s === 'CONFIGURING' && 'Branding, SEO, analytics configured'}
                    {s === 'READY' && 'All validations passed'}
                    {s === 'DEPLOYING' && 'Deployment prepared'}
                    {s === 'ACTIVE' && 'Website live'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={handleValidate} disabled={deploying} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />} Validate
          </button>
          <button onClick={handleDeploy} disabled={deploying || assignment?.status !== 'READY'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Prepare Deployment
          </button>
          <button onClick={() => assignmentApi.activate(id).then(() => { alert('Activated'); load(); }).catch(e => alert(e.message))} disabled={assignment?.status !== 'DEPLOYING' && assignment?.status !== 'READY'} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> Activate
          </button>
          <button onClick={() => assignmentApi.rollback(id).then(() => { alert('Rolled back'); load(); }).catch(e => alert(e.message))} disabled={assignment?.status !== 'ACTIVE' && assignment?.status !== 'DEPLOYING'} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <RotateCcw className="w-4 h-4" /> Rollback
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Result</h2>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
