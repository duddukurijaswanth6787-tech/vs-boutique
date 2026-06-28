import React, { useState, useEffect, useRef } from 'react';
import { CMSPage } from '../../components';
import api from '../../../../../services/api';
import { 
  Building, Settings, Eye, Code, CheckCircle, AlertTriangle, 
  Terminal, Shield, Play, HelpCircle, Layers, ShieldAlert,
  ArrowRight, ArrowLeft, RefreshCw, Layers2, FileText, Check, X,
  Activity, DollarSign, Database, Clock, Bookmark, HelpCircle as HelpIcon
} from 'lucide-react';
import { ToggleGroup, RequirementCard, ConfigurationSection, ScoreCard } from '../components';

const PIPELINE_AGENTS = [
  { id: 'business-analysis', name: 'Business Analysis Agent', desc: 'Synthesizing brand vertical targets' },
  { id: 'website-planning', name: 'Website Planning Agent', desc: 'Structuring sitemap parameters' },
  { id: 'website-blueprint', name: 'Website Blueprint Agent', desc: 'Formatting draft blueprints JSON' },
  { id: 'website-standards', name: 'Website Standards Agent', desc: 'Validating folder architectures and names' },
  { id: 'content-structure', name: 'Content Structure Agent', desc: 'Configuring schemas schemas models' },
  { id: 'api-planning', name: 'API Planning Agent', desc: 'Structuring REST routing specifications' },
  { id: 'cms-configuration', name: 'CMS Configuration Agent', desc: 'Binding schema fields mappings' },
  { id: 'seo', name: 'SEO Agent', desc: 'Optimizing titles and meta keywords' },
  { id: 'performance', name: 'Performance Agent', desc: 'Analyzing bundle and loading limits' },
  { id: 'accessibility', name: 'Accessibility Agent', desc: 'Verifying WCAG contrast checks' },
  { id: 'security', name: 'Security Agent', desc: 'Injecting CSP and secret audits' },
  { id: 'validation', name: 'Validation Agent', desc: 'Running AST compliance checks' }
];

export default function AIRequirementGenerator() {
  const [activeState, setActiveState] = useState('stepper'); // 'stepper' | 'monitoring' | 'result'
  const [currentStep, setCurrentStep] = useState(1);
  const [activeProvider, setActiveProvider] = useState('gemini');
  
  // Wizard Form values
  const [form, setForm] = useState({
    businessName: 'Tiny Tucks Boutique',
    vertical: 'Boutique',
    subscriptionTier: 'Pro',
    pages: ['Home', 'Shop', 'Product Detail', 'Contact Us'],
    customPages: '',
    paymentGateways: ['Stripe'],
    vitalsTarget: '90+',
    accessibilityLevel: 'WCAG AA',
    bundleLimit: 2
  });

  // Session, Polling & SSE stream states
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('business-analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Approval workflow
  const [approvalStatus, setApprovalStatus] = useState(null); 
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [activeResultTab, setActiveResultTab] = useState('summary'); 

  const terminalEndRef = useRef(null);
  const pollingRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Starts EventSource SSE stream + interval metadata poll
  const initOrchestratorConnection = (sid) => {
    const token = localStorage.getItem('token');
    const baseUrl = api.defaults.baseURL || 'http://localhost:3005';
    
    // 1. Establish SSE EventSource Stream
    const streamUrl = `${baseUrl}/api/v1/cms/orchestrator/session/${sid}/stream?token=${token}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('chunk', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: data.chunk,
            execution: { agentId: data.agentId }
          }
        ]);
      } catch (err) {
        console.error('Error parsing SSE chunk:', err);
      }
    });

    es.addEventListener('started', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.agentId) setSelectedAgentId(data.agentId);
      } catch (err) {}
    });

    es.addEventListener('sessionCompleted', () => {
      es.close();
    });

    es.onerror = () => {
      es.close();
    };

    // 2. Start general telemetry polling interval
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/cms/orchestrator/session/${sid}`);
        if (res.data.success) {
          setSessionData(res.data);
          
          if (res.data.status === 'COMPLETED') {
            clearInterval(pollingRef.current);
            if (eventSourceRef.current) eventSourceRef.current.close();
            setActiveState('result');
          } else if (res.data.status === 'FAILED') {
            clearInterval(pollingRef.current);
            if (eventSourceRef.current) eventSourceRef.current.close();
            setErrorMsg('Orchestrator pipeline execution failed.');
          }
        }
      } catch (err) {
        console.error('Session telemetry polling error:', err);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Auto-scroll terminal log console
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Trigger E2E launch
  const handleLaunchPipeline = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setLogs([]);
    try {
      const response = await api.post('/api/v1/cms/orchestrator/session', {
        businessName: form.businessName,
        vertical: form.vertical
      });
      if (response.data.success) {
        const sid = response.data.sessionId;
        setSessionId(sid);
        setActiveState('monitoring');
        initOrchestratorConnection(sid);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to trigger AI Orchestrator Session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit decision
  const handleSubmitApproval = async (decision) => {
    try {
      const res = await api.post(`/api/v1/cms/orchestrator/session/${sessionId}/approve`, {
        decision,
        feedback: approvalFeedback
      });
      if (res.data.success) {
        setApprovalStatus(res.data.status);
      }
    } catch (err) {
      setErrorMsg('Failed to submit approval choice.');
    }
  };

  const togglePage = (pageName) => {
    if (form.pages.includes(pageName)) {
      setForm({ ...form, pages: form.pages.filter(p => p !== pageName) });
    } else {
      setForm({ ...form, pages: [...form.pages, pageName] });
    }
  };

  const toggleGateway = (gateway) => {
    if (form.paymentGateways.includes(gateway)) {
      setForm({ ...form, paymentGateways: form.paymentGateways.filter(g => g !== gateway) });
    } else {
      setForm({ ...form, paymentGateways: [...form.paymentGateways, gateway] });
    }
  };

  const getAgentStatusBadge = (agentId) => {
    if (!sessionData?.executions) return <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>;
    const exec = sessionData.executions.find(e => e.agentId === agentId);
    if (!exec) return <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>;

    switch (exec.status) {
      case 'PENDING':
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse"></span>;
      case 'PROCESSING':
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>;
      case 'COMPLETED':
        return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
      case 'RETRYING':
        return <RefreshCw size={14} className="text-amber-500 animate-spin shrink-0" />;
      case 'FAILED':
        return <AlertTriangle size={14} className="text-red-500 shrink-0" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>;
    }
  };

  return (
    <CMSPage 
      title="AI Orchestrator Platform"
      description="Design, monitor, and approve multi-agent engineering rules and requirements Blueprints."
    >
      {/* ERROR CARD ALERT */}
      {errorMsg && (
        <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold items-start text-left">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* STATE 1: CONFIGURATION STEPPER WIZARD */}
      {activeState === 'stepper' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left Panel: Step Tracker list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="p-4 bg-white/70 border border-slate-100 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Stepper Progress</h3>
              <div className="space-y-3">
                {[
                  { step: 1, name: 'Brand Identity', desc: 'Identify name & niche' },
                  { step: 2, name: 'Sitemap Catalog', desc: 'Select target layout pages' },
                  { step: 3, name: 'SDK Integrations', desc: 'Payment systems' },
                  { step: 4, name: 'Compliance Targets', desc: 'Lighthouse & A11y' }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`w-full flex gap-3 p-3 rounded-2xl transition text-left ${
                      currentStep === s.step 
                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' 
                        : 'hover:bg-slate-50 border border-transparent text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      currentStep === s.step ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs">{s.name}</h4>
                      <p className="text-[10px] opacity-80 leading-normal">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel: Stepper Fields Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-6">
              
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-base">Step 1: Brand Identity</h3>
                    <p className="text-slate-500 text-xs mt-1">Configure target business classification metadata.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold text-xs">Business Brand Name</label>
                    <input 
                      type="text" 
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold text-xs">Retail Niche Vertical</label>
                    <select
                      value={form.vertical}
                      onChange={(e) => setForm({ ...form, vertical: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Boutique">Fashion Boutique</option>
                      <option value="Jewelry">Luxury Jewelry</option>
                      <option value="Sweets">Gourmet Confectionery</option>
                      <option value="Cosmetics">Organic Cosmetics</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-600 font-bold text-xs">Subscription Tier</label>
                    <ToggleGroup 
                      options={['Starter', 'Pro', 'Enterprise']}
                      value={form.subscriptionTier}
                      onChange={(val) => setForm({ ...form, subscriptionTier: val })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-base">Step 2: Sitemap & Pages Catalog</h3>
                    <p className="text-slate-500 text-xs mt-1">Check the base sitemap pages for the AI to include in the Blueprint.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {['Home', 'Shop', 'Product Detail', 'Contact Us', 'About Us', 'Privacy Policy'].map(p => (
                      <button
                        key={p}
                        onClick={() => togglePage(p)}
                        className={`flex items-center gap-3 p-3.5 border rounded-2xl transition text-left ${
                          form.pages.includes(p)
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 ${
                          form.pages.includes(p) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {form.pages.includes(p) && <Check size={10} />}
                        </span>
                        <span className="text-xs font-bold">{p}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-slate-600 font-bold text-xs">Add Custom Pages (Comma Separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Lookbook, Tailoring Request, Portfolio"
                      value={form.customPages}
                      onChange={(e) => setForm({ ...form, customPages: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-base">Step 3: SDK & Integrations</h3>
                    <p className="text-slate-500 text-xs mt-1">Select the target API systems for the validation catalog.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-slate-600 font-bold text-xs">Payment Gateways</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Stripe', 'PayPal', 'WhatsApp Payment'].map(g => (
                        <button
                          key={g}
                          onClick={() => toggleGateway(g)}
                          className={`p-3.5 border rounded-2xl transition text-center font-bold text-xs ${
                            form.paymentGateways.includes(g)
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700'
                              : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl text-left space-y-2">
                    <h4 className="font-bold text-indigo-800 text-xs flex items-center gap-1.5">
                      <Layers size={14} /> Core API SDKs Auto-Included
                    </h4>
                    <p className="text-indigo-700/80 leading-normal text-[10px] font-semibold">
                      Products API routes, Cart state manager, and checkout security validation layers are auto-injected by default to guarantee boutique compatibility.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-base">Step 4: Compliance & Quality Targets</h3>
                    <p className="text-slate-500 text-xs mt-1">Define strictness parameters for validation limits.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-600 font-bold text-xs">Lighthouse Vitals Score Target</label>
                    <ToggleGroup 
                      options={['80+', '90+', '95+']}
                      value={form.vitalsTarget}
                      onChange={(val) => setForm({ ...form, vitalsTarget: val })}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-slate-600 font-bold text-xs">Accessibility Standard</label>
                    <ToggleGroup 
                      options={['None', 'WCAG AA', 'WCAG AAA']}
                      value={form.accessibilityLevel}
                      onChange={(val) => setForm({ ...form, accessibilityLevel: val })}
                    />
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-slate-600 font-bold text-xs">Bundle Size Limit (MB)</label>
                    <input 
                      type="number"
                      value={form.bundleLimit}
                      onChange={(e) => setForm({ ...form, bundleLimit: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              {/* Navigation CTA Buttons */}
              <div className="flex justify-between border-t border-slate-100 pt-4 mt-6">
                <button
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition disabled:opacity-40"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-850 hover:bg-slate-800 text-white rounded-xl transition"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    disabled={isLoading}
                    onClick={handleLaunchPipeline}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition shadow-md shadow-indigo-100/50"
                  >
                    {isLoading ? 'Triggering...' : 'Launch AI Generator'} <Play size={14} />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Right Panel: Stepper Summary */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-800 text-xs">Configuration Summary</h3>
              <div className="space-y-2.5 text-[11px] font-semibold text-slate-500">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Brand Name</span>
                  <span className="text-slate-800 font-bold">{form.businessName || 'Untitled'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Vertical</span>
                  <span className="text-slate-800 font-bold">{form.vertical}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Subscription</span>
                  <span className="text-slate-800 font-bold">{form.subscriptionTier}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Pages Count</span>
                  <span className="text-slate-800 font-bold">{form.pages.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Payment Gateway</span>
                  <span className="text-slate-800 font-bold">{form.paymentGateways.join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Lighthouse vitals</span>
                  <span className="text-slate-800 font-bold">{form.vitalsTarget}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Accessibility</span>
                  <span className="text-slate-800 font-bold">{form.accessibilityLevel}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* STATE 2: LIVE ORCHESTRATION PIPELINE MONITOR */}
      {activeState === 'monitoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left Panel: Pipeline Agent states checklist */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-white border border-slate-100 rounded-3xl space-y-3.5">
              <div className="border-b border-slate-50 pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Execution Agents Chain</h3>
                <p className="text-[10px] text-slate-500">Pipeline processes sequentially through 12 validation steps.</p>
              </div>

              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {PIPELINE_AGENTS.map(agent => {
                  const exec = sessionData?.executions?.find(e => e.agentId === agent.id);
                  const isSelected = selectedAgentId === agent.id;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`w-full flex items-center justify-between p-2.5 border rounded-2xl transition ${
                        isSelected 
                          ? 'bg-indigo-50/50 border-indigo-150 text-indigo-700' 
                          : 'hover:bg-slate-50 border-transparent text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getAgentStatusBadge(agent.id)}
                        <div className="text-left">
                          <h4 className="font-bold text-[11px] leading-tight">{agent.name}</h4>
                          <p className="text-[9px] opacity-75">{agent.desc}</p>
                        </div>
                      </div>

                      {exec?.latencyMs > 0 && (
                        <span className="text-[9px] font-bold opacity-75">
                          {(exec.latencyMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel: Dark Terminal Logs Console */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-850 rounded-3xl flex flex-col h-[520px]">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2 text-slate-200">
                  <Terminal size={15} className="text-slate-450" />
                  <span className="font-bold text-xs">Terminal Log Console</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider">Live Agent</span>
                </div>
              </div>

              {/* Logs Stream list */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-350 space-y-2 pr-2 text-left">
                {logs
                  .filter(log => !selectedAgentId || log.execution?.agentId === selectedAgentId)
                  .map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-indigo-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                
                {logs.filter(log => !selectedAgentId || log.execution?.agentId === selectedAgentId).length === 0 && (
                  <div className="text-slate-500 italic mt-4">Waiting for execution logs to record...</div>
                )}
                <div ref={terminalEndRef}></div>
              </div>

            </div>
          </div>

          {/* Right Panel: Analytics & Telemetry summary */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Active Provider Selector */}
            <div className="p-4 bg-white border border-slate-100 rounded-3xl space-y-3">
              <label className="font-bold text-slate-800 text-xs block">AI Provider Engine</label>
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="gemini">Google Gemini 1.5 Pro</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                <option value="ollama">Ollama (Local LLM)</option>
              </select>
            </div>

            {/* Aggregated Analytics meters */}
            <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-800 text-xs">Session Telemetry</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Database size={15} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-none">Token Usage</p>
                    <h4 className="font-extrabold text-sm text-slate-800 mt-1">{sessionData?.totalTokens || 0}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <DollarSign size={15} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-none">Model Cost</p>
                    <h4 className="font-extrabold text-sm text-slate-800 mt-1">
                      ${sessionData?.totalCost ? sessionData.totalCost.toFixed(6) : '0.000000'}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-none">Progress Index</p>
                    <h4 className="font-extrabold text-sm text-slate-800 mt-1">
                      {sessionData?.progressPercent || 0}% ({sessionData?.completedSteps || 0}/12 steps)
                    </h4>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-650 h-full transition-all duration-300"
                    style={{ width: `${sessionData?.progressPercent || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* STATE 3: FINAL BLUEPRINT INSPECTOR & APPROVAL WORKFLOW */}
      {activeState === 'result' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left Panel: Dynamic Session Artifacts list */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 bg-white border border-slate-100 rounded-3xl space-y-3.5">
              <h3 className="font-bold text-slate-800 text-sm">Session Artifacts</h3>
              <div className="space-y-2">
                {sessionData?.artifacts?.map((art, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[10px] text-slate-700">{art.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">{art.createdByAgent}</span>
                    </div>
                    <p className="text-[8px] font-mono text-slate-400">Size: {(art.sizeBytes / 1024).toFixed(2)} KB</p>
                  </div>
                ))}
                
                {(!sessionData?.artifacts || sessionData.artifacts.length === 0) && (
                  <div className="text-[10px] text-slate-450 italic">No artifacts saved in session database records.</div>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel: Blueprint Draft code viewer */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
              
              <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Generated Blueprint Draft</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Audit requirements details prior to publishing.</p>
                </div>
                <div className="flex gap-1.5 bg-slate-55/50 p-1 border border-slate-100 rounded-xl">
                  <button
                    onClick={() => setActiveResultTab('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeResultTab === 'summary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveResultTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeResultTab === 'json' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Blueprint JSON
                  </button>
                </div>
              </div>

              {activeResultTab === 'summary' ? (
                <div className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <h4 className="font-bold text-slate-800 mb-2">Visual Sitemap Pages</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(sessionData?.compiledBlueprint?.sitemap || form.pages).map(p => (
                          <span key={p} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-600">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <h4 className="font-bold text-slate-800 mb-2">Gateway Integrations</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(sessionData?.compiledBlueprint?.apis?.integrations || form.paymentGateways).map(g => (
                          <span key={g} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] text-slate-600">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl space-y-2">
                    <h4 className="font-bold text-indigo-900">Engineering Rule Injections</h4>
                    <p className="leading-relaxed text-[11px] text-indigo-750">
                      Standard configurations enforced: Lighthouse Score target set to `{sessionData?.compiledBlueprint?.performance?.lighthouseVitalsTarget || form.vitalsTarget}`, Accessibility levels verified against `{sessionData?.compiledBlueprint?.accessibility?.wcagCompliance || form.accessibilityLevel}` standard constraints, with overall bundle budgets capped at `{sessionData?.compiledBlueprint?.performance?.bundleLimitMb || form.bundleLimit} MB`.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl h-[360px] overflow-auto text-left">
                  <pre className="font-mono text-[10px] text-indigo-300 leading-relaxed">
                    {sessionData?.compiledBlueprint 
                      ? JSON.stringify(sessionData.compiledBlueprint, null, 2)
                      : '// No Blueprint payload generated yet by website-blueprint agent.'
                    }
                  </pre>
                </div>
              )}

            </div>
          </div>

          {/* Right Panel: Human Approval triggers */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Compliance Score widget */}
            <div className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col items-center">
              <h3 className="font-bold text-slate-850 text-xs mb-3">AI Readiness Compliance</h3>
              <ScoreCard value={sessionData?.score || 0} size={110} strokeWidth={8} />
              <p className="text-[10px] text-slate-500 font-bold mt-2">Passed {sessionData?.auditsPassed || 0} audits</p>
            </div>

            {/* Approval Decision inputs */}
            <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4 text-left">
              <h3 className="font-bold text-slate-850 text-xs">Human Approval Workflow</h3>
              
              {approvalStatus ? (
                <div className={`p-4 rounded-2xl flex gap-3 text-xs font-semibold ${
                  approvalStatus === 'APPROVED' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {approvalStatus === 'APPROVED' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <div>
                    <h4 className="font-bold text-slate-850">Draft {approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'}</h4>
                    <p className="opacity-90 mt-1 leading-normal">
                      {approvalStatus === 'APPROVED' 
                        ? 'Blueprint published successfully to active catalog.' 
                        : 'Review feedback logged. System reset.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Review Comments</label>
                    <textarea 
                      placeholder="Add comments or notes for rejecting/approving"
                      value={approvalFeedback}
                      onChange={(e) => setApprovalFeedback(e.target.value)}
                      className="w-full h-16 p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleSubmitApproval('Rejected')}
                      className="flex-1 py-2 text-xs font-bold border border-red-200 hover:bg-red-50 text-red-700 rounded-xl transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleSubmitApproval('Approved')}
                      className="flex-1 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setActiveState('stepper');
                  setApprovalStatus(null);
                  setApprovalFeedback('');
                  setCurrentStep(1);
                  setSessionData(null);
                  setLogs([]);
                }}
                className="w-full text-center py-2 text-xs font-bold text-slate-550 border border-slate-100 hover:bg-slate-50 rounded-xl transition mt-2"
              >
                Reset Setup Stepper
              </button>
            </div>

          </div>

        </div>
      )}

    </CMSPage>
  );
}
