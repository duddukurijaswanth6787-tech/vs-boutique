import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, Award, Loader2 } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

export default function GenerateReport() {
  const navigate = useNavigate();
  const [sources, setSources] = useState({ uploads: [], certifications: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sourceType, setSourceType] = useState('certification');
  const [uploadId, setUploadId] = useState('');
  const [certificationId, setCertificationId] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const res = await reportsApi.getSources();
      setSources(res.data || { uploads: [], certifications: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (sourceType === 'upload' && !uploadId) { alert('Select an upload'); return; }
    if (sourceType === 'certification' && !certificationId) { alert('Select a certification'); return; }
    setGenerating(true);
    try {
      const payload = {
        uploadId: sourceType === 'upload' ? uploadId : null,
        certificationId: sourceType === 'certification' ? certificationId : null,
        sourceLabel: sourceLabel || undefined
      };
      const res = await reportsApi.generate(payload);
      navigate(`/admin/cms/reports/${res.data.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading sources...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/reports')} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Source Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSourceType('certification')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                sourceType === 'certification' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Award className="w-5 h-5" /> Certification
            </button>
            <button
              onClick={() => setSourceType('upload')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                sourceType === 'upload' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-5 h-5" /> Upload
            </button>
          </div>
        </div>

        {sourceType === 'certification' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Certification</label>
            {sources.certifications.length === 0 ? (
              <p className="text-sm text-gray-400">No certifications available</p>
            ) : (
              <select
                value={certificationId}
                onChange={e => setCertificationId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Select --</option>
                {sources.certifications.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.releaseTag || c.id} - Score: {c.overallScore ?? 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {sourceType === 'upload' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Upload</label>
            {sources.uploads.length === 0 ? (
              <p className="text-sm text-gray-400">No uploads available</p>
            ) : (
              <select
                value={uploadId}
                onChange={e => setUploadId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Select --</option>
                {sources.uploads.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.filename || u.id}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Label (optional)</label>
          <input
            type="text"
            value={sourceLabel}
            onChange={e => setSourceLabel(e.target.value)}
            placeholder="e.g., Weekly certification report"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><FileText className="w-4 h-4" /> Generate Report</>
            )}
          </button>
          <button
            onClick={() => navigate('/admin/cms/reports')}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
