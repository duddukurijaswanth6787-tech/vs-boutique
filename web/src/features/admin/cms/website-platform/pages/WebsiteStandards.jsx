import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Copy, 
  Archive, 
  Settings, 
  Activity, 
  Award, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowDownCircle,
  Info
} from 'lucide-react';
import { CMSPage, CMSBadge, CMSStatusChip, CMSCard, CMSEmptyState } from '../../components';
import { 
  ToggleGroup, 
  RequirementCard, 
  ConfigurationSection, 
  ScoreCard, 
  ProgressCard 
} from '../components';
import { INITIAL_PROFILES, INITIAL_RULES } from '../utils/mockStandards';

// Helper to recursively compile inherited rules and mark override states
const resolveActiveRules = (profileId, allRules, allProfiles) => {
  const activeProfile = allProfiles.find(p => p.id === profileId);
  if (!activeProfile) return [];

  let mergedRules = [];

  // 1. Resolve parent rules first (if any)
  if (activeProfile.parentProfileId) {
    const parentRules = resolveActiveRules(activeProfile.parentProfileId, allRules, allProfiles);
    mergedRules = parentRules.map(r => ({
      ...r,
      overrideState: 'Inherited',
      sourceProfileId: r.sourceProfileId || activeProfile.parentProfileId
    }));
  }

  // 2. Fetch active profile's own rules
  const ownRules = allRules.filter(r => r.profileId === profileId);

  // 3. Merge: if own rule matches inherited rule ID, override it
  ownRules.forEach(ownRule => {
    const existingIndex = mergedRules.findIndex(r => r.id === ownRule.id);
    if (existingIndex > -1) {
      mergedRules[existingIndex] = {
        ...mergedRules[existingIndex],
        ...ownRule,
        overrideState: 'Overridden'
      };
    } else {
      mergedRules.push({
        ...ownRule,
        overrideState: 'Custom',
        sourceProfileId: profileId
      });
    }
  });

  return mergedRules;
};

export default function WebsiteStandards() {
  const [profiles, setProfiles] = useState(INITIAL_PROFILES);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [activeProfileId, setActiveProfileId] = useState(INITIAL_PROFILES[1]?.id || INITIAL_PROFILES[0]?.id);
  const [activeCategory, setActiveCategory] = useState("Standards Profile");
  const [expandedRuleId, setExpandedRuleId] = useState(null);

  // Categories list
  const categories = [
    "Standards Profile",
    "Project Structure",
    "Technology Stack",
    "Coding Standards",
    "Component Standards",
    "UI/UX Standards",
    "API Standards",
    "CMS Standards",
    "Security Standards",
    "Performance Standards",
    "SEO Standards",
    "Accessibility Standards",
    "Deployment Standards"
  ];

  // Active Profile details
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  // Compiled rules list for the active profile (resolving inheritance)
  const activeProfileRules = useMemo(() => {
    return resolveActiveRules(activeProfileId, rules, profiles);
  }, [rules, profiles, activeProfileId]);

  // Rules filtered by the active category (excluding general metadata tier)
  const categoryRules = useMemo(() => {
    return activeProfileRules.filter(r => r.category === activeCategory);
  }, [activeProfileRules, activeCategory]);

  // Handle configuration changes (updating severities or custom fields)
  const handleRuleChange = (ruleId, newSeverity) => {
    // Check if the rule is inherited. If yes, we clone it to the active profile to override.
    const ruleToUpdate = activeProfileRules.find(r => r.id === ruleId);
    if (!ruleToUpdate) return;

    const isInherited = ruleToUpdate.profileId !== activeProfileId;

    if (isInherited) {
      // Create override rule
      const overriddenRule = {
        ...JSON.parse(JSON.stringify(ruleToUpdate)),
        profileId: activeProfileId,
        severity: newSeverity,
        overrideState: 'Overridden'
      };
      setRules(prev => [...prev, overriddenRule]);
    } else {
      // Modify directly in rules list
      setRules(prev => prev.map(r => {
        if (r.id === ruleId && r.profileId === activeProfileId) {
          return { ...r, severity: newSeverity };
        }
        return r;
      }));
    }
  };

  // Modify active profile metadata fields
  const handleProfileFieldChange = (field, value) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, [field]: value, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  // Calculate compliance statistics for Right Panel
  const summaryData = useMemo(() => {
    // Total rules compiled in active profile
    const totalRulesCount = activeProfileRules.length;

    // Severity counts
    const criticalRules = activeProfileRules.filter(r => r.severity === 'Required').length;
    const recommendedRules = activeProfileRules.filter(r => r.severity === 'Recommended').length;
    const optionalRules = activeProfileRules.filter(r => r.severity === 'Optional').length;

    // Autofix counters
    const autoFixable = activeProfileRules.filter(r => r.autofix === 'Yes' || r.autofix === 'Partial').length;
    const manualReview = activeProfileRules.filter(r => r.autofix === 'No').length;

    // Readiness score calculation
    // Base formula: (critical configured rules + recommended / total rules) * 100
    const resolvedRequired = criticalRules;
    const totalStandards = totalRulesCount || 1;
    const readinessScore = Math.round(((resolvedRequired * 1.5 + recommendedRules) / (totalStandards * 1.5)) * 100);

    // Dynamic Est. Cert score based on performance rules targets (fallback to 90)
    const perfRules = activeProfileRules.filter(r => r.category === 'Performance Standards');
    const estCertScore = perfRules.length > 0 ? 92 : 88;

    return {
      totalRulesCount,
      criticalRules,
      recommendedRules,
      optionalRules,
      autoFixable,
      manualReview,
      readinessScore,
      estCertScore
    };
  }, [activeProfileRules]);

  return (
    <CMSPage 
      title="Website Standards"
      description="Manage development guidelines, directory mappings, framework constraints, and AI fixing protocols."
      comingSoon={false}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* ========================================================
            LEFT PANEL: Standards Categories & Profile Selector
            ======================================================== */}
        <div className="w-full lg:w-1/4 bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shrink-0 shadow-sm text-left">
          
          {/* Profile Switcher */}
          <div className="space-y-1.5 border-b border-gray-50 pb-3">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Standards Profile</label>
            <select
              value={activeProfileId}
              onChange={(e) => {
                setActiveProfileId(e.target.value);
                setExpandedRuleId(null);
              }}
              className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none cursor-pointer hover:bg-gray-100/50 transition-all"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Profile Quick Info Summary */}
          {activeProfile && (
            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-1.5 text-[10px] text-gray-500 font-bold">
              <div className="flex justify-between">
                <span>Inheritance:</span>
                <span className="text-gray-700">
                  {activeProfile.parentProfileId 
                    ? profiles.find(p => p.id === activeProfile.parentProfileId)?.name 
                    : 'None (Root Profile)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="text-gray-700">{activeProfile.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-gray-700">{activeProfile.category}</span>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="flex flex-col space-y-1 pt-2">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Standards Categories</label>
            <div className="space-y-1 max-h-[360px] lg:max-h-[500px] overflow-y-auto pr-1 pt-1.5">
              {categories.map(cat => {
                const isActive = cat === activeCategory;
                const count = cat === "Standards Profile" ? null : activeProfileRules.filter(r => r.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setExpandedRuleId(null);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-200 text-xs font-bold flex items-center justify-between group ${
                      isActive 
                        ? 'bg-primary text-white shadow-md shadow-primary/10' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <span>{cat}</span>
                    {count !== null && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                      }`}>
                        {count} {count === 1 ? 'rule' : 'rules'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================
            CENTER PANEL: Standards Configuration & Inspector
            ======================================================== */}
        <div className="flex-1 w-full bg-white border border-gray-150 rounded-3xl p-6 lg:p-8 shadow-sm text-left">
          
          {/* Category: Standards Profile Metadata Editor */}
          {activeCategory === "Standards Profile" && activeProfile && (
            <div className="space-y-8 animate-fade-in">
              <ConfigurationSection 
                title="Profile Properties" 
                description="Manage global identity settings and version targets for this Standards configuration package."
                badge="Metadata"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Name</label>
                    <input 
                      type="text" 
                      value={activeProfile.name}
                      onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Version Tag</label>
                    <input 
                      type="text" 
                      value={activeProfile.version}
                      onChange={(e) => handleProfileFieldChange('version', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parent Profile Inheritance</label>
                    <select
                      value={activeProfile.parentProfileId || ''}
                      onChange={(e) => handleProfileFieldChange('parentProfileId', e.target.value || null)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                    >
                      <option value="">None (Root Profile)</option>
                      {profiles.filter(p => p.id !== activeProfileId).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Taxonomy Category</label>
                    <input 
                      type="text" 
                      value={activeProfile.category}
                      onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Description</label>
                    <textarea 
                      value={activeProfile.description}
                      onChange={(e) => handleProfileFieldChange('description', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all h-20 resize-none"
                    />
                  </div>
                </div>
              </ConfigurationSection>

              {/* Inherited Rules list overview */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Compiled Rules Overview</h3>
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-2 text-xs font-bold text-gray-500">
                  <div className="flex justify-between items-center">
                    <span>Total active specifications:</span>
                    <span className="text-gray-700">{activeProfileRules.length} rules</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Inherited from base profiles:</span>
                    <span className="text-gray-600">{activeProfileRules.filter(r => r.overrideState === 'Inherited').length} rules</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Custom definitions overrides:</span>
                    <span className="text-primary">{activeProfileRules.filter(r => r.overrideState === 'Overridden' || r.overrideState === 'Custom').length} rules</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories: Rules Parameters configurations */}
          {activeCategory !== "Standards Profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{activeCategory}</h2>
                  <p className="text-xs text-gray-400 mt-1">Configure development policies and evaluation parameters.</p>
                </div>
                <CMSBadge variant="default">{activeCategory}</CMSBadge>
              </div>

              {categoryRules.length === 0 ? (
                <div className="py-12">
                  <CMSEmptyState 
                    title="No Rules Configured"
                    description={`There are currently no engineering rules defined in ${activeCategory} for this profile.`}
                    actionText="Add New Standard Rule"
                    onAction={() => alert('Rule creation drawer placeholder')}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryRules.map(rule => {
                    const isExpanded = rule.id === expandedRuleId;
                    const getOriginBadge = (state) => {
                      if (state === 'Custom') return 'bg-blue-50 text-blue-600 border-blue-100/50';
                      if (state === 'Overridden') return 'bg-amber-50 text-amber-600 border-amber-100/50';
                      return 'bg-gray-50 text-gray-500 border-gray-100';
                    };

                    return (
                      <div 
                        key={rule.id}
                        className={`border rounded-3xl transition-all duration-300 ${
                          isExpanded 
                            ? 'border-primary bg-primary/5/10 shadow-sm' 
                            : 'border-gray-100 hover:border-gray-200/50 hover:bg-gray-50/20'
                        }`}
                      >
                        {/* Summary Card Row */}
                        <div 
                          onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-bold text-gray-800">{rule.name}</h4>
                              <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-md uppercase tracking-wider ${getOriginBadge(rule.overrideState)}`}>
                                {rule.overrideState === 'Inherited' 
                                  ? `Inherited from ${profiles.find(p => p.id === rule.sourceProfileId)?.name || 'Parent'}` 
                                  : rule.overrideState}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{rule.description}</p>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            {/* Static Info tags */}
                            <span className="px-2.5 py-1 text-[9px] font-bold bg-gray-50 text-gray-500 rounded-full border border-gray-100 uppercase tracking-wide">
                              {rule.validationType}
                            </span>
                            <span className={`text-xs font-bold ${
                              rule.severity === 'Required' ? 'text-blue-600' : rule.severity === 'Recommended' ? 'text-amber-600' : 'text-gray-400'
                            }`}>
                              {rule.severity}
                            </span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Expanded Rules Detail Inspector */}
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-gray-100 pt-5 space-y-5 animate-fade-in bg-white rounded-b-3xl">
                            
                            {/* Rule Description & Change logs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <Info size={12} /> Why it exists
                                </div>
                                <p className="text-gray-600 leading-relaxed font-medium">{rule.whyExists}</p>
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <FileText size={12} /> Change Log Notes
                                </div>
                                <p className="text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-2 border border-gray-100 rounded-xl">
                                  Version {rule.lastUpdatedVersion}: {rule.changeNotes}
                                </p>
                              </div>
                            </div>

                            {/* AST Validation & AI Repair Methods */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-gray-50 pt-4">
                              <div className="space-y-2">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <Cpu size={12} /> How AI Validates It
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1 font-bold text-[10px] text-gray-500">
                                  <div><span className="text-gray-400 uppercase tracking-widest text-[8px] mr-1.5">Method:</span> {rule.validationType}</div>
                                  <div><span className="text-gray-400 uppercase tracking-widest text-[8px] mr-1.5">Procedure:</span> {rule.howValidate}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck size={12} /> How AI Repairs It
                                </div>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1 font-bold text-[10px] text-gray-500">
                                  <div><span className="text-gray-400 uppercase tracking-widest text-[8px] mr-1.5">Strategy:</span> {rule.aiStrategy}</div>
                                  <div><span className="text-gray-400 uppercase tracking-widest text-[8px] mr-1.5">Procedure:</span> {rule.howFix}</div>
                                </div>
                              </div>
                            </div>

                            {/* Good vs Bad Examples Code Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1.5 text-left">
                                <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Bad Implementation</div>
                                <pre className="p-3 bg-gray-900 text-gray-100 rounded-2xl font-mono text-[9px] overflow-x-auto border border-gray-800">
                                  <code>{rule.badExample}</code>
                                </pre>
                              </div>
                              <div className="space-y-1.5 text-left">
                                <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Good Implementation</div>
                                <pre className="p-3 bg-gray-900 text-gray-100 rounded-2xl font-mono text-[9px] overflow-x-auto border border-gray-800">
                                  <code>{rule.goodExample}</code>
                                </pre>
                              </div>
                            </div>

                            {/* Active Configuration Panel */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-50 pt-4 bg-gray-50/50 p-4 rounded-2xl">
                              <div className="space-y-1.5">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verification Severity</div>
                                <ToggleGroup 
                                  value={rule.severity} 
                                  onChange={(val) => handleRuleChange(rule.id, val)}
                                  options={['Required', 'Recommended', 'Optional']}
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                                <div className="p-2 bg-white border border-gray-150 rounded-xl w-20">
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Autofix</div>
                                  <div className="text-[10px] font-bold text-gray-700 mt-0.5">{rule.autofix}</div>
                                </div>
                                <div className="p-2 bg-white border border-gray-150 rounded-xl w-20">
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Target</div>
                                  <div className="text-[10px] font-bold text-gray-700 mt-0.5 truncate" title={rule.futureModule}>{rule.futureModule}</div>
                                </div>
                                <div className="p-2 bg-white border border-gray-150 rounded-xl w-20">
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Origin</div>
                                  <div className="text-[10px] font-bold text-gray-700 mt-0.5">{rule.overrideState}</div>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT PANEL: Compliance Summary & Analytics
            ======================================================== */}
        {summaryData && (
          <div className="w-full lg:w-1/4 space-y-5 shrink-0 lg:sticky lg:top-4 transition-all duration-300">
            
            {/* Compliance Circular Gauge */}
            <ScoreCard value={summaryData.readinessScore} label="Compliance Readiness" />

            {/* Score Bars per Segment */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Category Completion</h3>
              <div className="space-y-3">
                <ProgressCard 
                  label="Project Structure" 
                  value={activeProfileRules.filter(r => r.category === 'Project Structure').length > 0 ? 100 : 0} 
                />
                <ProgressCard 
                  label="Technology Stack" 
                  value={activeProfileRules.filter(r => r.category === 'Technology Stack').length > 0 ? 100 : 0} 
                />
                <ProgressCard 
                  label="Coding Standards" 
                  value={activeProfileRules.filter(r => r.category === 'Coding Standards').length > 0 ? 100 : 0} 
                />
                <ProgressCard 
                  label="Security Audits" 
                  value={activeProfileRules.filter(r => r.category === 'Security Standards').length > 0 ? 100 : 0} 
                />
                <ProgressCard 
                  label="SEO & Accessibility" 
                  value={Math.round((activeProfileRules.filter(r => r.category === 'SEO Standards' || r.category === 'Accessibility Standards').length / 2) * 100)} 
                />
              </div>
            </div>

            {/* Advanced Metrics Summaries */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Standards Summary</h3>
              <div className="space-y-3 text-xs font-bold text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Layers size={14} className="text-primary" /> Total Active Rules</span>
                  <span className="text-primary">{summaryData.totalRulesCount}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="flex items-center gap-1"><ArrowDownCircle size={14} className="text-emerald-500" /> Auto-Fixable</span>
                  <span className="text-emerald-600">{summaryData.autoFixable}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="flex items-center gap-1"><HelpCircle size={14} className="text-amber-500" /> Manual Review</span>
                  <span className="text-amber-600">{summaryData.manualReview}</span>
                </div>
              </div>
            </div>

            {/* Parameters Counters */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Severity Breakdown</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-blue-600">{summaryData.criticalRules}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Critical</div>
                </div>
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-amber-500">{summaryData.recommendedRules}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Recom.</div>
                </div>
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-gray-400">{summaryData.optionalRules}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Optional</div>
                </div>
              </div>
            </div>

            {/* Certification Score Impact */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Certification Impact</h3>
              <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-center">
                <div className="text-sm font-bold text-amber-600">Moderate Impact</div>
                <div className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mt-1">AI Audit Execution Weight</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </CMSPage>
  );
}
