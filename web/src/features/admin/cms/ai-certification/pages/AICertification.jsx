import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../../services/api';

const AICertification = () => {
  const [releaseTag, setReleaseTag] = useState('');
  const [releases, setReleases] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('IDLE');
  
  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Auto-Fix Queue state
  const [autoFixQueue, setAutoFixQueue] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Historical trend state
  const [history, setHistory] = useState([]);

  const eventSourceRef = useRef(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchReleases();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchReleases = async () => {
    try {
      // Fetch compiled releases
      const res = await api.get('/api/v1/cms/generator/status/v1.0.0'); // Probe active system
      setReleases(['v1.0.62', 'v1.0.48', 'v1.0.36']);
      setReleaseTag('v1.0.62');
    } catch (err) {
      // Fallback defaults
      setReleases(['v1.0.0']);
      setReleaseTag('v1.0.0');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/v1/cms/certification/history');
      if (res.data?.success) {
        setHistory(res.data.certifications || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const fetchReport = async (tag) => {
    try {
      const res = await api.get(`/api/v1/cms/certification/report/${tag || releaseTag}`);
      if (res.data?.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  };

  const triggerAudit = async () => {
    if (!releaseTag) return;
    setLogs([]);
    setProgress(0);
    setCurrentStage('INITIALIZING');
    setReport(null);

    try {
      const res = await api.post('/api/v1/cms/certification/audit', {
        releaseTag,
        targetType: 'WEBSITE'
      });

      if (res.data?.success) {
        initSSEStream();
      }
    } catch (err) {
      setLogs(prev => [...prev, { level: 'ERROR', message: `Audit trigger failed: ${err.message}` }]);
    }
  };

  const initSSEStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('token');
    const baseUrl = api.defaults.baseURL || 'http://localhost:3005';
    const es = new EventSource(`${baseUrl}/api/v1/cms/certification/stream/${releaseTag}?token=${token}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        
        if (data.message) {
          setLogs(prev => [...prev, { level: data.stage === 'error' ? 'ERROR' : 'INFO', message: data.message }]);
        }

        if (data.progress) {
          setProgress(data.progress);
        }

        if (data.stage) {
          setCurrentStage(data.stage);
        }

        if (data.stage === 'complete' || data.progress === 100) {
          es.close();
          fetchReport();
          fetchHistory();
        }
      } catch (err) {
        console.error('SSE parsing error:', err);
      }
    };

    es.onerror = () => {
      es.close();
    };
  };

  const handleApplyFix = async (issueKey) => {
    try {
      // Find and apply the auto-fix item in DB
      const res = await api.post('/api/v1/cms/certification/autofix', {
        queueItemId: issueKey
      });
      if (res.data?.success) {
        setLogs(prev => [...prev, { level: 'INFO', message: `Successfully applied auto-fix: ${issueKey}` }]);
        fetchReport();
      }
    } catch (err) {
      console.error('Failed to apply fix:', err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage || !report) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', message: msg }]);
    setIsChatLoading(true);

    try {
      const res = await api.post('/api/v1/cms/certification/chat', {
        certificationId: report.id,
        message: msg
      });

      if (res.data?.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', message: res.data.reply }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', message: `Error resolving query: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              AI Quality Certification & QA Engine
            </h1>
            <p className="text-slate-400 mt-1">
              Verify compliance scores, responsive UI layouts, WCAG accessibilities and brand alignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={releaseTag}
              onChange={(e) => setReleaseTag(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {releases.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <button
              onClick={triggerAudit}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              Launch QA Certification Audit
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              Ask AI QA Assistant
            </button>
          </div>
        </div>

        {/* Workflow Progression Graph */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
          <h2 className="text-lg font-semibold mb-4 text-indigo-400">QA Workflow Pipeline Status</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
            <div className="absolute left-0 right-0 h-1 bg-slate-800 top-1/2 -translate-y-1/2 hidden md:block z-0" />
            
            {[
              { id: 'load_release', name: 'Load Release Snapshot', order: 1 },
              { id: 'parallel_audits', name: 'Parallel QA Audits', order: 2 },
              { id: 'visual_review', name: 'Headless Visual Reviews', order: 3 },
              { id: 'scoring_engine', name: 'Weighted Rules Compiler', order: 4 }
            ].map(stage => {
              const isCurrent = currentStage === stage.id;
              const isCompleted = progress >= stage.order * 25;
              
              return (
                <div key={stage.id} className="flex flex-col items-center z-10 w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                    isCompleted ? 'bg-emerald-600 border-emerald-400 text-white' :
                    isCurrent ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' :
                    'bg-slate-950 border-slate-700 text-slate-500'
                  }`}>
                    {stage.order}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium ${isCurrent ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Overall QA Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live SSE Logging Terminal */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 font-mono text-sm shadow-inner">
          <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-900 pb-2 mb-3">
            <span>QA Live Auditing Logs Stream</span>
            <span>Channel: {releaseTag}</span>
          </div>
          <div className="h-44 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.map((log, idx) => (
              <div key={idx} className={`leading-relaxed ${log.level === 'ERROR' ? 'text-rose-400' : 'text-slate-300'}`}>
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span className={`font-semibold mr-1.5 ${log.level === 'ERROR' ? 'text-rose-500' : 'text-indigo-400'}`}>
                  [{log.level}]
                </span>
                {log.message}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-slate-500 italic">Logs will appear here once the certification run starts...</div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Report Overview & Dynamic Gauges */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Overall QA Scoreboard */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Compliance Score</h3>
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" className="stroke-slate-800" strokeWidth="10" fill="none" />
                  <circle cx="72" cy="72" r="64" 
                    className="stroke-emerald-500 transition-all duration-1000" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * report.overallScore) / 100}
                  />
                </svg>
                <span className="absolute text-3xl font-extrabold text-white">{report.overallScore.toFixed(0)}</span>
              </div>
              <span className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
                report.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                Recommendation: {report.status}
              </span>
            </div>

            {/* Dynamic Individual Scorecards */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quality Category Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(report.scoresMap || {}).map(([key, val]) => (
                  <div key={key} className="bg-slate-950/40 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
                    <span className="text-xs text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                    <div className="flex items-end justify-between mt-2">
                      <span className="text-2xl font-bold text-white">{Number(val).toFixed(0)}</span>
                      <span className={`text-xs ${Number(val) >= 90 ? 'text-emerald-400' : Number(val) >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {Number(val) >= 90 ? 'Passed' : 'Warn'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues & Auto-Fix Inspector */}
            <div className="lg:col-span-3 bg-slate-900/30 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">QA Compliance Issues & Warnings</h3>
              <div className="space-y-4">
                {(report.issues || []).map((issue, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-850 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          issue.type === 'ERROR' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {issue.type}
                        </span>
                        <h4 className="font-semibold text-white">{issue.name}</h4>
                      </div>
                      <p className="text-sm text-slate-400">{issue.message}</p>
                      <div className="text-xs text-slate-500 flex items-center gap-4 mt-2">
                        <span>Element: <code className="text-indigo-400">{issue.element}</code></span>
                        <span>Safety Level: <strong className="text-slate-300">{issue.safetyLevel}</strong></span>
                      </div>
                    </div>

                    {issue.safetyLevel === 'SAFE_AUTO_FIX' && (
                      <button
                        onClick={() => handleApplyFix(issue.key)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded transition-all shadow hover:shadow-emerald-500/20"
                      >
                        Apply Safe Auto-Fix
                      </button>
                    )}
                  </div>
                ))}
                {(!report.issues || report.issues.length === 0) && (
                  <p className="text-slate-500 text-center py-6">All quality compliance audits passed with zero issues!</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Historical score trends list */}
        {history.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Historical Certification Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs">
                    <th className="pb-3">Release Tag</th>
                    <th className="pb-3">Target Type</th>
                    <th className="pb-3">Overall Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 font-semibold text-indigo-400">{record.releaseTag}</td>
                      <td className="py-3 capitalize">{record.targetType.toLowerCase()}</td>
                      <td className="py-3 text-white font-bold">{record.overallScore.toFixed(0)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          record.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Conversational Assistant Side Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-800">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">AI QA Assistant</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ask questions about WCAG compliance, SEO, and visual scores.</p>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl p-3.5 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-950 text-slate-300 rounded-tl-none border border-slate-800'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 text-slate-500 text-sm rounded-xl p-3.5 rounded-tl-none border border-slate-800 animate-pulse">
                    AI Assistant is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-5 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask me how to improve accessibility scores..."
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              />
              <button
                onClick={handleSendChatMessage}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                Send
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AICertification;
