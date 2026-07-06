import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, History, FileText, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

const SECTION_TYPE_LABELS = {
  FOLDER: 'Folder Structure',
  COMPONENTS: 'Components',
  APIS: 'APIs',
  CMS_COMPATIBILITY: 'CMS Compatibility',
  PERFORMANCE: 'Performance',
  SEO: 'SEO',
  ACCESSIBILITY: 'Accessibility',
  SECURITY: 'Security',
  RESPONSIVE: 'Responsive',
  AI_RECOMMENDATIONS: 'AI Recommendations',
  SUMMARY: 'Summary',
  OVERALL_SCORE: 'Overall Score'
};

const STATUS_ICONS = {
  PASSED: { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
  FAILED: { icon: XCircle, color: 'text-red-600 bg-red-50' },
  SKIPPED: { icon: Info, color: 'text-gray-400 bg-gray-50' },
  INFO: { icon: Info, color: 'text-blue-600 bg-blue-50' }
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.get(id);
      setReport(res.data);
      if (res.data?.sections?.length > 0) {
        setActiveSection(res.data.sections[0].sectionType);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await reportsApi.exportReport(id, format);
      alert(`Export ${format.toUpperCase()} generated`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading report...</div>;
  }

  if (!report) {
    return <div className="p-6 text-center text-gray-500">Report not found</div>;
  }

  const activeSectionData = report.sections?.find(s => s.sectionType === activeSection);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/reports')} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{report.sourceLabel}</h1>
          <p className="text-sm text-gray-500">Report ID: {report.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/admin/cms/reports/${id}/history`)} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> JSON
          </button>
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={async () => { try { await reportsApi.regenerate(id); loadReport(); } catch (e) { alert(e.message); } }} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${report.overallScore >= 70 ? 'text-green-600' : report.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {report.overallScore}
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
            <div className="space-y-1">
              {report.sections?.map(section => {
                const statusInfo = STATUS_ICONS[section.status] || STATUS_ICONS.INFO;
                const Icon = statusInfo.icon;
                return (
                  <button
                    key={section.sectionType}
                    onClick={() => setActiveSection(section.sectionType)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeSection === section.sectionType ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${statusInfo.color.split(' ')[0]}`} />
                    <span className="flex-1">{SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}</span>
                    {section.score != null && (
                      <span className={`text-xs font-medium ${section.score >= 70 ? 'text-green-600' : section.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {section.score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeSectionData ? (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{SECTION_TYPE_LABELS[activeSectionData.sectionType] || activeSectionData.sectionType}</h2>
                <div className="flex items-center gap-3 mt-2">
                  {activeSectionData.score != null && (
                    <span className={`text-sm font-medium ${activeSectionData.score >= 70 ? 'text-green-600' : activeSectionData.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      Score: {activeSectionData.score}/{activeSectionData.maxScore || 100}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeSectionData.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                    activeSectionData.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                    activeSectionData.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activeSectionData.status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {activeSectionData.issues?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Issues ({activeSectionData.issues.length})</h3>
                    <div className="space-y-2">
                      {activeSectionData.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <div className="text-sm text-red-700">{typeof issue === 'string' ? issue : issue.description || issue.message || JSON.stringify(issue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSectionData.suggestions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions ({activeSectionData.suggestions.length})</h3>
                    <div className="space-y-2">
                      {activeSectionData.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div className="text-sm text-blue-700">{typeof s === 'string' ? s : s.description || s.message || JSON.stringify(s)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSectionData.data && Object.keys(activeSectionData.data).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Section Data</h3>
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-60">
                      {JSON.stringify(activeSectionData.data, null, 2)}
                    </pre>
                  </div>
                )}

                {(!activeSectionData.issues?.length && !activeSectionData.suggestions?.length && (!activeSectionData.data || !Object.keys(activeSectionData.data).length)) && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No detailed data for this section</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
              Select a section from the sidebar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
