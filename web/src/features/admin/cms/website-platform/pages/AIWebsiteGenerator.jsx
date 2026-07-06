import React, { useState, useEffect, useRef } from 'react';
import { CMSPage, CMSBadge, CMSCard } from '../../components';
import api from '../../../../../services/api';
import { 
  Building, Settings, Eye, Code, CheckCircle, AlertTriangle, 
  Terminal, Shield, Play, HelpCircle, Layers, ShieldAlert,
  ArrowRight, ArrowLeft, RefreshCw, Layers2, FileText, Check, X,
  Activity, DollarSign, Database, Clock, Bookmark, HelpCircle as HelpIcon,
  Palette, Grid, Link, Search, ArrowDownCircle, Info
} from 'lucide-react';

const COMPILER_STAGES = [
  { id: 'theme', name: 'Theme Generator', desc: 'Compiling vertical color palette styling variables' },
  { id: 'design_system', name: 'Design System', desc: 'Expanding styling scales, border radius, animations' },
  { id: 'sitemap', name: 'Sitemap Architect', desc: 'Generating storefront pages and folders mappings' },
  { id: 'navigation', name: 'Navigation Engine', desc: 'Linking sitemenu configurations and header layouts' },
  { id: 'layout', name: 'Layout Designer', desc: 'Architecting dynamic page grid matrices' },
  { id: 'section', name: 'Section Planner', desc: 'Placing component segment blocks onto pages sitemaps' },
  { id: 'component', name: 'Component Compiler', desc: 'Generating component properties and configurations' },
  { id: 'copy', name: 'Copywriting Engine', desc: 'Writing dynamic content headlines and textual items' },
  { id: 'media', name: 'Media Library', desc: 'Injecting cover image URLs, logos, and vector assets' },
  { id: 'catalog', name: 'Catalog Seeder', desc: 'Populating dynamic boutique product listings' },
  { id: 'seo', name: 'SEO Generator', desc: 'Creating meta description titles and Open Graph details' },
  { id: 'performance', name: 'Performance Optimizer', desc: 'Configuring lazy loading and compression flags' },
  { id: 'accessibility', name: 'A11y Validator', desc: 'Running contrast and alt-text checking scripts' },
  { id: 'security', name: 'Security Validator', desc: 'Hardening Content Security Policies' },
  { id: 'compiler', name: 'Final Website Compiler', desc: 'Bundling release payload and generating checksum' }
];

export default function AIWebsiteGenerator() {
  const [activeBoutique, setActiveBoutique] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE | COMPILING | ACTIVE | FAILED
  const [activeStage, setActiveStage] = useState('theme');
  const [progress, setProgress] = useState(0);
  const [telemetry, setTelemetry] = useState({ tokens: 0, cost: 0.00 });
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [rollbackTag, setRollbackTag] = useState('');
  const [activeTab, setActiveTab] = useState('structure'); // structure | styles | raw
  
  const terminalEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Load initial boutique metadata
  useEffect(() => {
    async function loadBoutique() {
      try {
        const res = await api.get('/boutiques/');
        if (res.data && res.data.length > 0) {
          const boutique = res.data[0];
          setActiveBoutique(boutique);
          fetchStatus(boutique.id);
        }
      } catch (err) {
        console.error('Failed to load initial boutique profile:', err);
      }
    }
    loadBoutique();
  }, []);

  // Poll compilation telemetry status
  const fetchStatus = async (boutiqueId) => {
    try {
      const res = await api.get(`/api/v1/cms/generator/status/${boutiqueId}`);
      if (res.data && res.data.success) {
        setProgress(res.data.progressPercent || res.data.progress || 0);
        setTelemetry({ tokens: res.data.totalTokens || 0, cost: res.data.totalCost || 0.00 });
        if (res.data.status === 'ACTIVE') {
          setStatus('ACTIVE');
          fetchPreview(boutiqueId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch generator status:', err);
    }
  };

  // Fetch compiled layout details
  const fetchPreview = async (boutiqueId) => {
    try {
      const res = await api.get(`/api/v1/cms/generator/preview/${boutiqueId}`);
      if (res.data && res.data.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      console.error('Failed to load preview configs:', err);
    }
  };

  // Launch E2E Compilation Pipeline
  const handleStartCompilation = async () => {
    if (!activeBoutique) return;
    setStatus('COMPILING');
    setProgress(0);
    setTerminalLogs(['[Antair OS] Booting AI Website Operating System...', '[Antair OS] Establishing secure connection with queue engine...']);
    
    try {
      // Find latest approved requirement session to pass
      const sessionRes = await api.get('/api/v1/cms/orchestrator/session?limit=1');
      const sessionId = sessionRes.data && sessionRes.data.sessions?.length > 0
        ? sessionRes.data.sessions[0].id
        : 'default-active-session';

      await api.post('/api/v1/cms/generator/compile', {
        sessionId,
        boutiqueId: activeBoutique.id
      });

      // Hook Server-Sent Events progress logs channel
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const streamUrl = `${api.defaults.baseURL || ''}/api/v1/cms/generator/stream/${activeBoutique.id}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setActiveStage(data.stage);
          setProgress(data.progress || 0);
          setTerminalLogs(prev => [...prev, `[${data.stage.toUpperCase()}] ${data.message}`]);
          
          // Poll telemetry increments concurrently
          fetchStatus(activeBoutique.id);

          if (data.stage === 'complete') {
            setStatus('ACTIVE');
            es.close();
            fetchPreview(activeBoutique.id);
          } else if (data.stage === 'failed') {
            setStatus('FAILED');
            es.close();
          }
        } catch (e) {
          // Silent parsing error
        }
      };

    } catch (err) {
      setStatus('FAILED');
      setTerminalLogs(prev => [...prev, `[SYSTEM-ERROR] Generation trigger crashed: ${err.message}`]);
    }
  };

  // Trigger segment regeneration
  const handleRegenerate = async (scope) => {
    if (!activeBoutique) return;
    try {
      setTerminalLogs(prev => [...prev, `[Antair OS] Re-triggering AI compilation for scope: ${scope}...`]);
      await api.post(`/api/v1/cms/generator/${activeBoutique.id}/regenerate`, { scope });
      setTerminalLogs(prev => [...prev, `[COMPLETED] Segment ${scope} successfully regenerated!`]);
      fetchPreview(activeBoutique.id);
    } catch (err) {
      setTerminalLogs(prev => [...prev, `[ERROR] Regeneration of ${scope} failed: ${err.message}`]);
    }
  };

  // Rollback version
  const handleRollback = async () => {
    if (!activeBoutique || !rollbackTag) return;
    try {
      setTerminalLogs(prev => [...prev, `[Antair OS] Launching rollback to version: ${rollbackTag}...`]);
      await api.post(`/api/v1/cms/generator/${activeBoutique.id}/rollback`, { releaseTag: rollbackTag });
      setTerminalLogs(prev => [...prev, `[SUCCESS] System rolled back to: ${rollbackTag}`]);
      fetchPreview(activeBoutique.id);
    } catch (err) {
      setTerminalLogs(prev => [...prev, `[ERROR] Rollback failed: ${err.message}`]);
    }
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Cleanup EventSource connection
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <CMSPage title="AI Website Generator" subtitle="Compile, design, and live deploy dynamic multi-tenant storefront platforms">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Panel: Blueprint specs & sitemaps */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <CMSCard title="Source Blueprint Nodes" headerIcon={Layers2}>
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Target Business</div>
                <div className="font-semibold text-indigo-400 mt-0.5">{activeBoutique?.name || 'Loading boutique...'}</div>
              </div>
              <div className="text-sm font-medium text-slate-300">Expected Sitemap Nodes:</div>
              <div className="flex flex-col gap-2">
                {['Home', 'Shop', 'Tailoring Services', 'Contact Us'].map((node, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900/30 rounded border border-slate-850">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-300 font-mono">{node}</span>
                  </div>
                ))}
              </div>
            </div>
          </CMSCard>

          <CMSCard title="Enterprise Theme Specs" headerIcon={Palette}>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Typography Scale</span>
                <span className="font-mono text-indigo-300">Playfair / Inter</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Light Palette</span>
                <div className="flex gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#4f46e5] border border-slate-700" title="Primary" />
                  <span className="w-3.5 h-3.5 rounded bg-[#10b981] border border-slate-700" title="Secondary" />
                  <span className="w-3.5 h-3.5 rounded bg-[#f9fafb] border border-slate-700" title="BG" />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-slate-400">Component borders</span>
                <span className="font-mono text-indigo-300">8px (radius-md)</span>
              </div>
            </div>
          </CMSCard>
        </div>

        {/* Center Panel: Dark Terminal Log Console */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex-1 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden min-h-[480px]">
            <div className="flex justify-between items-center px-4 py-2.5 bg-slate-900 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-300">antair-os@compiler-terminal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            
            <div className="flex-1 p-4 font-mono text-xs text-emerald-400/90 overflow-y-auto space-y-1.5 h-[380px]">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-500 italic">Terminal idle. Click "Compile & Live-Deploy" to execute...</div>
              ) : (
                terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-5 break-all whitespace-pre-wrap">{log}</div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Compiled Output Preview panel */}
          {previewData && (
            <CMSCard title="Storefront Compilation Preview" headerIcon={Eye}>
              <div className="flex gap-2 border-b border-slate-850 pb-2 mb-4">
                {['structure', 'styles', 'raw'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-3 py-1.5 rounded transition ${activeTab === tab ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {activeTab === 'structure' && (
                <div className="space-y-4">
                  {previewData.pages?.map((page, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/30 rounded border border-slate-850">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-200 font-mono">/{page.slug}</span>
                        <CMSBadge label={page.status} type="success" />
                      </div>
                      <div className="space-y-1.5 pl-3 border-l-2 border-slate-800">
                        {page.components?.map((comp, cIdx) => (
                          <div key={cIdx} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Grid className="w-3.5 h-3.5 text-slate-500" />
                            <span>{comp.name} ({comp.type})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'styles' && (
                <pre className="text-[11px] font-mono text-amber-400 bg-slate-950 p-3 rounded border border-slate-850 overflow-x-auto">
                  {JSON.stringify(previewData.theme, null, 2)}
                </pre>
              )}

              {activeTab === 'raw' && (
                <pre className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-3 rounded border border-slate-850 overflow-x-auto">
                  {JSON.stringify(previewData.pages, null, 2)}
                </pre>
              )}
            </CMSCard>
          )}
        </div>

        {/* Right Panel: Operations & controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <CMSCard title="Compilation Status" headerIcon={Activity}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="56" cy="56" r="48" stroke="#6366f1" strokeWidth="8" fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * progress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute text-xl font-bold font-mono text-indigo-300">{progress}%</div>
              </div>

              <div className="flex gap-6 w-full border-t border-slate-850 pt-4 mt-2 justify-center">
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-500" /> Tokens
                  </div>
                  <div className="text-sm font-semibold font-mono text-slate-200 mt-1">{telemetry.tokens}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Est Cost
                  </div>
                  <div className="text-sm font-semibold font-mono text-emerald-400 mt-1">${telemetry.cost.toFixed(5)}</div>
                </div>
              </div>

              {status === 'ACTIVE' && (
                <a 
                  href={`${window.location.origin}/boutique/${activeBoutique?.id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                >
                  <Link className="w-3.5 h-3.5" /> View Live Boutique Storefront
                </a>
              )}

              {status !== 'COMPILING' && (
                <button
                  onClick={handleStartCompilation}
                  className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-950/40"
                >
                  <Play className="w-3.5 h-3.5" /> Compile & Live-Deploy Website
                </button>
              )}
            </div>
          </CMSCard>

          {/* Granular Regenerator Panel */}
          {status === 'ACTIVE' && (
            <CMSCard title="Granular Segment Compiler" headerIcon={RefreshCw}>
              <div className="flex flex-col gap-2.5">
                {[
                  { key: 'theme', label: 'Regenerate Theme Styling' },
                  { key: 'content', label: 'Regenerate Home Copy' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleRegenerate(item.key)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded text-left px-3 text-xs flex items-center justify-between transition"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </CMSCard>
          )}

          {/* Rollbacks Controls */}
          <CMSCard title="Version Rollbacks" headerIcon={ArrowDownCircle}>
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Deployment Releases Tags:</div>
              <select
                value={rollbackTag}
                onChange={(e) => setRollbackTag(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Select Release Tag...</option>
                <option value="v1.0.62">v1.0.62 (Active Build)</option>
                <option value="v1.0.0">v1.0.0 (Base Schema Config)</option>
              </select>
              <button
                onClick={handleRollback}
                disabled={!rollbackTag}
                className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/50 rounded font-medium text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restore Selected Release
              </button>
            </div>
          </CMSCard>
        </div>

      </div>
    </CMSPage>
  );
}
