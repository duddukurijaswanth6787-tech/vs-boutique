import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { reportsApi } from '../services/reports.api';

const SECTION_ORDER = ['FOLDER', 'COMPONENTS', 'APIS', 'CMS_COMPATIBILITY', 'PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'SECURITY', 'RESPONSIVE', 'AI_RECOMMENDATIONS', 'SUMMARY', 'OVERALL_SCORE'];
const SECTION_LABELS = {
  FOLDER: 'Folder Structure', COMPONENTS: 'Components', APIS: 'APIs',
  CMS_COMPATIBILITY: 'CMS Compatibility', PERFORMANCE: 'Performance', SEO: 'SEO',
  ACCESSIBILITY: 'Accessibility', SECURITY: 'Security', RESPONSIVE: 'Responsive',
  AI_RECOMMENDATIONS: 'AI Recommendations', SUMMARY: 'Summary', OVERALL_SCORE: 'Overall Score'
};

export default function ReportComparison() {
  const navigate = useNavigate();
  const [reportId1, setReportId1] = useState('');
  const [reportId2, setReportId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!reportId1 || !reportId2) { setError('Enter both report IDs'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await reportsApi.compare(reportId1, reportId2);
      setComparison(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/reports')} className="p-1.5 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Compare Reports</h1>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report ID 1</label>
            <input
              type="text"
              value={reportId1}
              onChange={e => setReportId1(e.target.value)}
              placeholder="Enter report ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report ID 2</label>
            <input
              type="text"
              value={reportId2}
              onChange={e => setReportId2(e.target.value)}
              placeholder="Enter report ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button
          onClick={handleCompare}
          disabled={loading}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          <GitCompare className="w-4 h-4" /> {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {comparison && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500">{comparison.summary?.report1Label || 'Report 1'}</div>
                <div className="text-2xl font-bold text-blue-600">{comparison.summary?.overallScore1}</div>
                <div className="text-xs text-gray-400">{comparison.summary?.passed1} sections passed</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-500">{comparison.summary?.report2Label || 'Report 2'}</div>
                <div className="text-2xl font-bold text-purple-600">{comparison.summary?.overallScore2}</div>
                <div className="text-xs text-gray-400">{comparison.summary?.passed2} sections passed</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Difference</div>
                <div className={`text-2xl font-bold ${comparison.summary?.overallDiff > 0 ? 'text-green-600' : comparison.summary?.overallDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {comparison.summary?.overallDiff > 0 ? '+' : ''}{comparison.summary?.overallDiff}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Section Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Report 1</th>
                    <th className="px-4 py-3">Report 2</th>
                    <th className="px-4 py-3">Diff</th>
                    <th className="px-4 py-3">Issues Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(comparison.sectionDiffs || []).map(diff => (
                    <tr key={diff.type} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{SECTION_LABELS[diff.type] || diff.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${diff.score1 >= 70 ? 'text-green-600' : diff.score1 >= 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {diff.score1 != null ? diff.score1 : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${diff.score2 >= 70 ? 'text-green-600' : diff.score2 >= 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {diff.score2 != null ? diff.score2 : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {diff.scoreDiff != null ? (
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                            diff.scoreDiff > 0 ? 'text-green-600' : diff.scoreDiff < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {diff.scoreDiff > 0 ? <ArrowUp className="w-3 h-3" /> : diff.scoreDiff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {diff.scoreDiff > 0 ? '+' : ''}{diff.scoreDiff}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${diff.issuesDiff < 0 ? 'text-green-600' : diff.issuesDiff > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {diff.issuesDiff > 0 ? '+' : ''}{diff.issuesDiff}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
