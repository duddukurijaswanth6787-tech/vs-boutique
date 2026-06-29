import React, { useState, useEffect } from 'react';
import api from '../../../../../services/api';
import { ShieldCheck, AlertCircle, Play, Info, Settings, Search, CheckCircle, RefreshCw, Layers, Sparkles, BookOpen } from 'lucide-react';

const RequirementsSelector = () => {
  // Data lists
  const [requirements, setRequirements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Selection states
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [inspectedRequirement, setInspectedRequirement] = useState(null);

  // Compilation/Validation Results state
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['ALL', 'SECURITY', 'SEO', 'ACCESSIBILITY', 'BUSINESS', 'FUNCTIONAL', 'API', 'AI'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [reqsRes, tempRes] = await Promise.all([
        api.get('/api/v1/cms/requirements'),
        api.get('/api/v1/cms/requirements/templates')
      ]);

      if (reqsRes.data?.success) {
        setRequirements(reqsRes.data.requirements);
      }
      if (tempRes.data?.success) {
        setTemplates(tempRes.data.templates);
      }
    } catch (err) {
      console.error('Failed to load initial requirements data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Preset Template auto-selection compiler
  const handleTemplateChange = async (templateKey) => {
    setSelectedTemplate(templateKey);
    if (!templateKey) {
      setSelectedKeys([]);
      setValidationResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/cms/requirements/templates/${templateKey}`);
      if (res.data?.success) {
        const resolvedKeys = res.data.resolved.map(r => r.key);
        setSelectedKeys(resolvedKeys);
        
        // Populate compiled outputs directly from the template endpoint response!
        setValidationResult({
          isValid: res.data.isValid,
          conflicts: res.data.conflicts,
          resolved: res.data.resolved,
          compiledPrompt: res.data.compiledPrompt,
          blueprint: res.data.blueprint
        });
      }
    } catch (err) {
      console.error('Failed to compile template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle requirement key
  const handleToggleKey = (key) => {
    const next = selectedKeys.includes(key)
      ? selectedKeys.filter(k => k !== key)
      : [...selectedKeys, key];
    
    setSelectedKeys(next);
    setValidationResult(null); // Reset validation to force user to re-validate
  };

  // Trigger Live Validation & Blueprint Compilations
  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError('');
    try {
      const res = await api.post('/api/v1/cms/requirements/validate', {
        activeKeys: selectedKeys
      });
      if (res.data?.success) {
        setValidationResult({
          isValid: res.data.isValid,
          conflicts: res.data.conflicts,
          resolved: res.data.resolved,
          compiledPrompt: res.data.compiledPrompt,
          blueprint: res.data.blueprint
        });
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Filters logic
  const filteredRequirements = requirements.filter(req => {
    const matchesCategory = selectedCategory === 'ALL' || req.category === selectedCategory;
    const matchesSearch = req.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPriorityBadgeColor = (priority) => {
    if (priority >= 5) return 'bg-red-50 text-red-700 border-red-200';
    if (priority >= 4) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-gray-200/80">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Layers className="text-primary w-7 h-7" />
            Requirement Compiler Engine
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Resolve logical feature trees, check compatibility conflicts, and compile specifications.
          </p>
        </div>

        {/* Template Select Preset Dropdown */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Presets Profile:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Custom Selection</option>
            {templates.map(t => (
              <option key={t.id} value={t.key}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Category lists + main checklist grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search and Category tabs */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requirement key or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">Feature Requirements</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-bold">
                  Selected: {selectedKeys.length}
                </span>
              </div>

              {filteredRequirements.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <BookOpen className="mx-auto w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm">No requirements found matching criteria.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredRequirements.map(req => {
                    const isSelected = selectedKeys.includes(req.key);
                    return (
                      <div
                        key={req.id}
                        className={`p-4 transition-colors flex items-start justify-between cursor-pointer hover:bg-gray-50/50 ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleToggleKey(req.key)}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by outer div onClick
                            className="mt-1 rounded text-primary focus:ring-primary/20 border-gray-300 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{req.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({req.key})</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 max-w-xl line-clamp-1">
                              {req.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadgeColor(req.priority)}`}>
                            P{req.priority}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedRequirement(req);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Actions + Inspectors + Graph Compilations */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Run Validation Box */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Compiler Control</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Validate selected features compatibility and generate prompt structures for sitemaps.
              </p>

              <button
                disabled={isValidating || selectedKeys.length === 0}
                onClick={handleValidate}
                className="w-full bg-primary hover:bg-primary-light text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isValidating ? (
                  <RefreshCw className="animate-spin w-4 h-4" />
                ) : (
                  <Play size={14} />
                )}
                Compile & Validate
              </button>

              {validationError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Validation & Compilation Inspector results */}
            {validationResult && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden space-y-5 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm">Compilation Status</h3>
                  {validationResult.isValid ? (
                    <span className="text-xs bg-green-50 text-green-700 font-bold px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                      <CheckCircle size={12} /> Passed
                    </span>
                  ) : (
                    <span className="text-xs bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <AlertCircle size={12} /> Failed
                    </span>
                  )}
                </div>

                {/* Conflicts warning lists */}
                {validationResult.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detected Conflicts:</span>
                    {validationResult.conflicts.map((c, i) => (
                      <div key={i} className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-xs flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{c.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resolved features list */}
                {validationResult.resolved.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved Dependency Graph:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {validationResult.resolved.map(r => (
                        <span key={r.id} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono font-bold">
                          {r.key}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blueprint compiler outputs */}
                {validationResult.isValid && (
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Settings size={12} /> Compiled Pages
                      </span>
                      <div className="p-3 bg-gray-50 rounded-xl font-mono text-[11px] text-gray-600 max-h-24 overflow-y-auto">
                        {validationResult.blueprint.pages.length === 0 
                          ? 'No pages defined.' 
                          : validationResult.blueprint.pages.map((p, i) => <div key={i}>• {p}</div>)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Compiled Prompt Snippets
                      </span>
                      <div className="p-3 bg-gray-50 rounded-xl font-mono text-[10px] text-gray-600 max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {validationResult.compiledPrompt || 'No copywriting prompt inputs.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* inspected requirement details */}
            {inspectedRequirement && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm">Requirement Inspector</h3>
                  <button
                    onClick={() => setInspectedRequirement(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-900">{inspectedRequirement.name}</div>
                  <div className="text-[10px] font-mono text-gray-400">Key: {inspectedRequirement.key}</div>
                  <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {inspectedRequirement.description || 'No description provided.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Priority</div>
                    <div className="text-sm font-bold text-blue-700">P{inspectedRequirement.priority}</div>
                  </div>
                  <div className="p-2 bg-orange-50/50 rounded-lg border border-orange-100">
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Criticality</div>
                    <div className="text-sm font-bold text-orange-700">C{inspectedRequirement.criticality}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsSelector;
