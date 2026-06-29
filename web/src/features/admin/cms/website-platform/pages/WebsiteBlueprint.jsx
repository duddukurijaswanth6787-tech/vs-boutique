import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../../../services/api';
import { 
  Search, 
  Plus, 
  Copy, 
  Archive, 
  Settings, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  CheckCircle,
  Monitor,
  Eye,
  Globe,
  PlusCircle,
  FileText,
  Trash2,
  AlertCircle,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { CMSPage, CMSBadge, CMSStatusChip, CMSCard, CMSEmptyState } from '../../components';
import { 
  RequirementCard, 
  ConfigurationSection, 
  ScoreCard, 
  ProgressCard 
} from '../components';
import { INITIAL_BLUEPRINTS } from '../utils/mockData';

// Shared Helper to calculate statistics for any blueprint
const getBlueprintStats = (b) => {
  if (!b) return null;

  const countOptions = (obj, target) => {
    let count = 0;
    Object.values(obj).forEach(val => {
      if (typeof val === 'object' && val !== null) {
        count += countOptions(val, target);
      } else if (val === target) {
        count++;
      }
    });
    return count;
  };

  const totalPossible = (obj) => {
    let count = 0;
    Object.values(obj).forEach(val => {
      if (typeof val === 'object' && val !== null) {
        count += totalPossible(val);
      } else {
        count++;
      }
    });
    return count;
  };

  // Required, Optional, Disabled counts
  const reqPages = countOptions(b.pages, 'required');
  const optPages = countOptions(b.pages, 'optional');
  const disPages = countOptions(b.pages, 'disabled');
  const totalPages = totalPossible(b.pages);
  const activePages = totalPages - disPages;

  const reqApis = countOptions(b.apis, 'required');
  const optApis = countOptions(b.apis, 'optional');
  const disApis = countOptions(b.apis, 'disabled');
  const totalApis = totalPossible(b.apis);
  const activeApis = totalApis - disApis;

  const reqFeatures = countOptions(b.features, 'required');
  const optFeatures = countOptions(b.features, 'optional');
  const disFeatures = countOptions(b.features, 'disabled');
  const totalFeatures = totalPossible(b.features);
  const activeFeatures = totalFeatures - disFeatures;

  const reqCms = countOptions(b.cmsFields, 'required');
  const optCms = countOptions(b.cmsFields, 'optional');
  const hidCms = countOptions(b.cmsFields, 'hidden');
  const totalCms = totalPossible(b.cmsFields);
  const activeCms = totalCms - hidCms;

  const genScore = b.name && b.version ? 100 : 50;
  const pagesScore = Math.round((activePages / totalPages) * 100);
  const cmsScore = Math.round((activeCms / totalCms) * 100);
  const apisScore = Math.round((activeApis / totalApis) * 100);
  const featuresScore = Math.round((activeFeatures / totalFeatures) * 100);
  const overallScore = Math.round((genScore + pagesScore + cmsScore + apisScore + featuresScore) / 5);

  // Health Score (ratio of security + accessibility + seo enabled checks)
  const totalSecurity = Object.values(b.security).filter(Boolean).length;
  const totalAccess = Object.values(b.accessibility).filter(Boolean).length;
  const totalSeo = Object.values(b.seo).filter(Boolean).length;
  const maxHealthChecks = Object.keys(b.security).length + Object.keys(b.accessibility).length + Object.keys(b.seo).length;
  const healthScore = Math.round(((totalSecurity + totalAccess + totalSeo) / maxHealthChecks) * 100);

  // Est. Cert. Score (avg performance score targets)
  const performanceVals = Object.values(b.performance);
  const estCertScore = Math.round(performanceVals.reduce((acc, curr) => acc + curr, 0) / performanceVals.length);

  // Totals
  const totalRequired = reqPages + reqApis + reqFeatures + reqCms;
  const totalOptional = optPages + optApis + optFeatures + optCms;
  const totalDisabled = disPages + disApis + disFeatures + hidCms;

  let difficulty = 'Easy';
  let difficultyColor = 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
  if (totalRequired > 20) {
    difficulty = 'Complex';
    difficultyColor = 'bg-red-50 text-red-600 border-red-100/50';
  } else if (totalRequired > 10) {
    difficulty = 'Medium';
    difficultyColor = 'bg-amber-50 text-amber-600 border-amber-100/50';
  }

  return {
    reqPages,
    reqApis,
    reqFeatures,
    reqCms,
    totalRequired,
    totalOptional,
    totalDisabled,
    genScore,
    pagesScore,
    cmsScore,
    apisScore,
    featuresScore,
    overallScore,
    healthScore,
    estCertScore,
    difficulty,
    difficultyColor
  };
};

export default function WebsiteBlueprint() {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchBlueprints();
  }, [selectedId]);

  const fetchBlueprints = async () => {
    try {
      const res = await api.get('/api/v1/cms/blueprints');
      if (res.data?.success) {
        const dbBlueprints = res.data.blueprints.map(b => ({
          id: b.id,
          name: b.name,
          key: b.key,
          description: b.description || 'System compiled blueprint template.',
          businessType: b.standard?.category || 'General',
          version: `v${b.version}.0.0`,
          status: b.status === 'PUBLISHED' ? 'Active' : 'Draft',
          lastUpdated: new Date(b.updatedAt).toLocaleDateString(),
          pages: b.pages || { core: {}, business: {}, legal: {} },
          components: b.components || {},
          apis: b.apis || {},
          databaseModels: b.databaseModels || {},
          features: b.features || {},
          cmsFields: b.cmsFields || { required: {}, optional: {}, hidden: {} },
          security: b.security || { sslRequired: true, cspRules: true },
          accessibility: b.accessibility || { altTagsRequired: true },
          seo: b.seo || { metaTagsRequired: true },
          performance: b.performance || { maxBundleSizeKb: 2048 }
        }));
        setBlueprints(dbBlueprints);
        if (dbBlueprints.length > 0 && !selectedId) {
          setSelectedId(dbBlueprints[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch blueprints:', err);
    }
  };

  const handleCompileBlueprint = async () => {
    if (!selectedId) return;
    try {
      const res = await api.post(`/api/v1/cms/blueprints/${selectedId}/compile`);
      if (res.data?.success) {
        alert('Blueprint compiled and sitemap normalized successfully!');
        fetchBlueprints();
      }
    } catch (err) {
      alert(`Compilation failed: ${err.response?.data?.message || err.message}`);
    }
  };

  // Active blueprint record
  const activeBlueprint = blueprints.find(b => b.id === selectedId) || null;

  // Filtered list
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || b.businessType === filterType;
      return matchesSearch && matchesType;
    });
  }, [blueprints, searchQuery, filterType]);

  // Unique business verticals list
  const businessTypes = useMemo(() => {
    const types = new Set(blueprints.map(b => b.businessType));
    return ['all', ...Array.from(types)];
  }, [blueprints]);

  // Handle single parameter modification
  const handleConfigChange = (section, key, value, subkey = null) => {
    setBlueprints(prev => prev.map(b => {
      if (b.id !== selectedId) return b;
      
      const updated = { ...b };
      if (subkey) {
        updated[section] = {
          ...updated[section],
          [key]: {
            ...updated[section][key],
            [subkey]: value
          }
        };
      } else if (typeof updated[section] === 'object' && updated[section] !== null) {
        updated[section] = {
          ...updated[section],
          [key]: value
        };
      } else {
        updated[section] = value;
      }
      return updated;
    }));
  };

  // Duplicate selected blueprint
  const handleDuplicate = (idToDuplicate = selectedId) => {
    const target = blueprints.find(b => b.id === idToDuplicate);
    if (!target) return;
    const duplicate = {
      ...JSON.parse(JSON.stringify(target)),
      // eslint-disable-next-line react-hooks/purity
      id: `blueprint-${Date.now()}`,
      name: `${target.name} (Copy)`,
      status: 'Draft',
      version: 'v1.0.0',
      lastUpdated: 'Just now'
    };
    setBlueprints(prev => [duplicate, ...prev]);
    setSelectedId(duplicate.id);
  };

  // Toggle archive flag
  const handleArchive = (idToArchive = selectedId) => {
    setBlueprints(prev => prev.map(b => {
      if (b.id !== idToArchive) return b;
      return {
        ...b,
        status: b.status === 'Archived' ? 'Draft' : 'Archived',
        lastUpdated: 'Just now'
      };
    }));
  };

  // Delete blueprint
  const handleDelete = (idToDelete) => {
    if (confirm("Are you sure you want to delete this Website Blueprint? This action is irreversible.")) {
      const remaining = blueprints.filter(b => b.id !== idToDelete);
      setBlueprints(remaining);
      if (selectedId === idToDelete) {
        setSelectedId(remaining[0]?.id || null);
      }
    }
  };

  // Create new blueprint
  const handleCreateNew = () => {
    const newBlueprint = {
      id: `blueprint-${Date.now()}`,
      name: 'New Custom Blueprint',
      description: 'Define your compliance contract and requirements rules.',
      version: 'v1.0.0',
      businessType: 'Apparel & Retail',
      category: 'General',
      status: 'Draft',
      lastUpdated: 'Just now',
      pages: {
        core: { Home: 'required', Shop: 'optional', Product: 'optional', Cart: 'optional', Checkout: 'optional' },
        business: { About: 'optional', Contact: 'optional', Gallery: 'optional', Blog: 'disabled' },
        legal: { "Privacy Policy": 'required', "Refund Policy": 'optional', "Shipping Policy": 'optional', "Terms & Conditions": 'required' }
      },
      sections: {
        Hero: 'required',
        "Featured Categories": 'optional',
        "Featured Products": 'optional',
        Collections: 'optional',
        Testimonials: 'optional',
        Reviews: 'optional',
        Instagram: 'optional',
        Newsletter: 'optional',
        Footer: 'required'
      },
      cmsFields: {
        Brand: 'required',
        Business: 'required',
        Contact: 'required',
        SEO: 'optional',
        Policies: 'optional',
        "Social Media": 'optional',
        "Google Maps": 'optional',
        "Banner Images": 'optional',
        Logo: 'required',
        Footer: 'required'
      },
      apis: {
        Authentication: 'optional',
        Products: 'required',
        Categories: 'optional',
        Orders: 'optional',
        Customers: 'optional',
        Wishlist: 'disabled',
        Cart: 'optional',
        Checkout: 'optional',
        Reviews: 'optional',
        Blogs: 'disabled',
        Coupons: 'disabled'
      },
      features: {
        Search: 'optional',
        Wishlist: 'disabled',
        Cart: 'optional',
        Checkout: 'optional',
        Reviews: 'optional',
        Coupons: 'disabled',
        Blogs: 'disabled',
        "Live Chat": 'disabled',
        WhatsApp: 'optional',
        Analytics: 'optional'
      },
      responsive: { Desktop: true, Laptop: true, Tablet: true, Mobile: true, minResolution: '320px' },
      performance: { Performance: 90, SEO: 90, Accessibility: 90, "Best Practices": 90 },
      security: { HTTPS: true, "No Secrets": true, "Sanitized Inputs": true, "Dependency Scan": true, "Content Security Policy": false, "Rate Limiting": false, "Security Headers": false },
      accessibility: { "Keyboard Navigation": true, "Alt Text": true, "Color Contrast": true, "ARIA Labels": false },
      seo: { "Meta Tags": true, "Open Graph": false, "Structured Data": false, "Canonical URLs": false, Robots: true, Sitemap: false }
    };
    setBlueprints(prev => [newBlueprint, ...prev]);
    setSelectedId(newBlueprint.id);
  };

  // Memoized stats for active blueprint
  const summaryData = useMemo(() => {
    return getBlueprintStats(activeBlueprint);
  }, [activeBlueprint]);

  return (
    <CMSPage 
      title="Website Blueprint"
      description="Define specifications, visual layers, required APIs, and performance targets to enforce during verification builds."
      comingSoon={false}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* ========================================================
            LEFT PANEL: Blueprint Explorer
            ======================================================== */}
        <div className="w-full lg:w-1/4 bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shrink-0 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-bold text-gray-800 text-sm">Blueprint Explorer</h3>
            <button 
              onClick={handleCreateNew}
              className="p-1.5 bg-primary text-white rounded-xl hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/10 transition-all duration-250 flex items-center justify-center"
              title="Create Blueprint"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Vertical Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 text-left">Vertical Filter</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none cursor-pointer hover:bg-gray-100/50 transition-all"
            >
              {businessTypes.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Verticals' : t}</option>
              ))}
            </select>
          </div>

          {/* Explorer List */}
          <div className="space-y-2.5 max-h-[360px] lg:max-h-[550px] overflow-y-auto pr-1">
            {filteredBlueprints.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 font-bold">No blueprints found</div>
            ) : (
              filteredBlueprints.map(b => {
                const isActive = b.id === selectedId;
                const stats = getBlueprintStats(b);
                const getStatusColor = (status) => {
                  if (status === 'Active') return 'success';
                  if (status === 'Draft') return 'warning';
                  return 'default';
                };

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={`relative p-3.5 border rounded-2xl cursor-pointer transition-all duration-300 group text-left ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-md border-l-4 border-l-primary translate-x-0.5' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Title and version */}
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-gray-800 group-hover:text-primary transition-colors line-clamp-1">{b.name}</h4>
                      <span className="text-[9px] font-black text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-md">{b.version}</span>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">{b.description}</p>
                    
                    {/* Completion bar */}
                    {stats && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-gray-500">
                          <span>Progress</span>
                          <span>{stats.overallScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${stats.overallScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata status & category */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                      <CMSStatusChip status={b.status} variant={getStatusColor(b.status)} />
                      <span className="text-[9px] font-bold text-gray-400">{b.lastUpdated}</span>
                    </div>

                    {/* Hover Quick Actions */}
                    <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/95 shadow-sm border border-gray-100 rounded-lg p-1 transition-all duration-200 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(b.id); }}
                        className="p-1 text-gray-400 hover:text-primary rounded hover:bg-gray-50 transition-all"
                        title="Duplicate"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchive(b.id); }}
                        className="p-1 text-gray-400 hover:text-amber-500 rounded hover:bg-gray-50 transition-all"
                        title="Archive"
                      >
                        <Archive size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            CENTER PANEL: Blueprint Configuration Editor
            ======================================================== */}
        <div className="flex-1 w-full bg-white border border-gray-150 rounded-3xl p-6 lg:p-8 shadow-sm transition-all duration-300">
          {!activeBlueprint ? (
            <CMSEmptyState 
              title="No Blueprint Selected"
              description="Create your first Website Blueprint to define certification requirements."
              actionText="Create New Blueprint"
              onAction={handleCreateNew}
            />
          ) : (
            <div className="space-y-8">
              {/* Sticky Header Action Row */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 pt-1">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">{activeBlueprint.name}</h2>
                    <CMSBadge variant={activeBlueprint.status === 'Active' ? 'success' : 'warning'}>{activeBlueprint.status}</CMSBadge>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{activeBlueprint.description}</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button 
                    onClick={handleCompileBlueprint}
                    className="px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shadow-md shadow-primary/10"
                  >
                    <Zap size={13} /> Compile
                  </button>
                  <button 
                    onClick={() => handleDuplicate(activeBlueprint.id)}
                    className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                  <button 
                    onClick={() => handleArchive(activeBlueprint.id)}
                    className={`px-3 py-2 border rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-bold ${
                      activeBlueprint.status === 'Archived'
                        ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Archive size={13} /> {activeBlueprint.status === 'Archived' ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>

              {/* SECTION 1: General Info */}
              <ConfigurationSection 
                title="General Metadata" 
                description="Core taxonomy attributes defining the blueprint identity and classification tags."
                badge="Basics"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blueprint Name</label>
                    <input 
                      type="text" 
                      value={activeBlueprint.name}
                      onChange={(e) => handleConfigChange('name', null, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 hover:bg-gray-100/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Version Tag</label>
                    <input 
                      type="text" 
                      value={activeBlueprint.version}
                      onChange={(e) => handleConfigChange('version', null, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 hover:bg-gray-100/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Type</label>
                    <input 
                      type="text" 
                      value={activeBlueprint.businessType}
                      onChange={(e) => handleConfigChange('businessType', null, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 hover:bg-gray-100/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pricing Tier Category</label>
                    <input 
                      type="text" 
                      value={activeBlueprint.category}
                      onChange={(e) => handleConfigChange('category', null, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 hover:bg-gray-100/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      value={activeBlueprint.description}
                      onChange={(e) => handleConfigChange('description', null, e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 hover:bg-gray-100/50 transition-all h-20 resize-none"
                    />
                  </div>
                </div>
              </ConfigurationSection>

              {/* SECTION 2: Required Pages */}
              <ConfigurationSection 
                title="Required Pages Configuration" 
                description="Select whether pages are strictly required, optional, or completely blocked for this business type."
                badge="Sitemap"
              >
                <div className="space-y-4">
                  <div className="border-l-2 border-gray-100 pl-3 space-y-3">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Core Navigation</div>
                    {Object.keys(activeBlueprint.pages.core).map(page => (
                      <RequirementCard 
                        key={page}
                        label={page}
                        description={`Primary page validation rule for ${page} path.`}
                        value={activeBlueprint.pages.core[page]}
                        onChange={(val) => handleConfigChange('pages', 'core', val, page)}
                      />
                    ))}
                  </div>

                  <div className="border-l-2 border-gray-100 pl-3 space-y-3 pt-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Business Informational</div>
                    {Object.keys(activeBlueprint.pages.business).map(page => (
                      <RequirementCard 
                        key={page}
                        label={page}
                        description={`About or portfolio validation rule for ${page} path.`}
                        value={activeBlueprint.pages.business[page]}
                        onChange={(val) => handleConfigChange('pages', 'business', val, page)}
                      />
                    ))}
                  </div>

                  <div className="border-l-2 border-gray-100 pl-3 space-y-3 pt-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Legal & Compliance</div>
                    {Object.keys(activeBlueprint.pages.legal).map(page => (
                      <RequirementCard 
                        key={page}
                        label={page}
                        description={`Contractual legal template validation rule for ${page}.`}
                        value={activeBlueprint.pages.legal[page]}
                        onChange={(val) => handleConfigChange('pages', 'legal', val, page)}
                      />
                    ))}
                  </div>
                </div>
              </ConfigurationSection>

              {/* SECTION 3: Required Layout Sections */}
              <ConfigurationSection
                title="Required Layout Sections"
                description="Configure mandatory layout nodes that must appear within page content during AST check."
                badge="Visual"
              >
                <div className="space-y-3">
                  {Object.keys(activeBlueprint.sections).map(sec => (
                    <RequirementCard
                      key={sec}
                      label={sec}
                      description={`AST scanner rule targeting React section component '${sec}'.`}
                      value={activeBlueprint.sections[sec]}
                      onChange={(val) => handleConfigChange('sections', sec, val)}
                    />
                  ))}
                </div>
              </ConfigurationSection>

              {/* SECTION 4: CMS Editable Fields */}
              <ConfigurationSection
                title="CMS Editable Parameters"
                description="Specify settings fields that must be exposed to tenant owners for custom branding edits."
                badge="CMS"
              >
                <div className="space-y-3">
                  {Object.keys(activeBlueprint.cmsFields).map(field => (
                    <RequirementCard
                      key={field}
                      label={field}
                      description={`Boutique editor input node for ${field}.`}
                      value={activeBlueprint.cmsFields[field]}
                      options={['required', 'optional', 'hidden']}
                      onChange={(val) => handleConfigChange('cmsFields', field, val)}
                    />
                  ))}
                </div>
              </ConfigurationSection>

              {/* SECTION 5: API Requirements */}
              <ConfigurationSection
                title="API Router Contracts"
                description="Enforce verification rules to map and validate standard REST API connection scopes."
                badge="Integrations"
              >
                <div className="space-y-3">
                  {Object.keys(activeBlueprint.apis).map(api => (
                    <RequirementCard
                      key={api}
                      label={`${api} Endpoint`}
                      description={`Verify network client handles backend route '/api/v1/${api.toLowerCase()}'.`}
                      value={activeBlueprint.apis[api]}
                      onChange={(val) => handleConfigChange('apis', api, val)}
                    />
                  ))}
                </div>
              </ConfigurationSection>

              {/* SECTION 6: Website Features */}
              <ConfigurationSection
                title="Interactive Capabilities"
                description="Define requirements for functional logic libraries such as coupons, live chat, or analytics."
                badge="Features"
              >
                <div className="space-y-3">
                  {Object.keys(activeBlueprint.features).map(feat => (
                    <RequirementCard
                      key={feat}
                      label={feat}
                      description={`Code validation rule for interactive logic: ${feat}.`}
                      value={activeBlueprint.features[feat]}
                      onChange={(val) => handleConfigChange('features', feat, val)}
                    />
                  ))}
                </div>
              </ConfigurationSection>

              {/* SECTION 7: Display & Performance */}
              <ConfigurationSection
                title="Performance & Display Baselines"
                description="Configure Lighthouse scoring metrics and responsive design validation parameters."
                badge="Display"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Responsive Viewports</label>
                    <RequirementCard 
                      label="Desktop View" 
                      value={activeBlueprint.responsive.Desktop} 
                      type="checkbox"
                      onChange={(val) => handleConfigChange('responsive', 'Desktop', val)}
                    />
                    <RequirementCard 
                      label="Laptop View" 
                      value={activeBlueprint.responsive.Laptop} 
                      type="checkbox"
                      onChange={(val) => handleConfigChange('responsive', 'Laptop', val)}
                    />
                    <RequirementCard 
                      label="Tablet View" 
                      value={activeBlueprint.responsive.Tablet} 
                      type="checkbox"
                      onChange={(val) => handleConfigChange('responsive', 'Tablet', val)}
                    />
                    <RequirementCard 
                      label="Mobile View" 
                      value={activeBlueprint.responsive.Mobile} 
                      type="checkbox"
                      onChange={(val) => handleConfigChange('responsive', 'Mobile', val)}
                    />
                    <div className="pt-2">
                      <RequirementCard 
                        label="Min Resolution" 
                        value={activeBlueprint.responsive.minResolution} 
                        type="text"
                        placeholder="e.g. 320px"
                        onChange={(val) => handleConfigChange('responsive', 'minResolution', val)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lighthouse Targets</label>
                    {Object.keys(activeBlueprint.performance).map(metric => (
                      <RequirementCard 
                        key={metric}
                        label={`${metric} Score`} 
                        value={activeBlueprint.performance[metric]} 
                        type="number"
                        min={0}
                        max={100}
                        onChange={(val) => handleConfigChange('performance', metric, val)}
                      />
                    ))}
                  </div>
                </div>
              </ConfigurationSection>

              {/* SECTION 8: Security & Compliance */}
              <ConfigurationSection
                title="Security Requirements"
                description="Toggle static analysis rules to enforce security policies and sanitization checks."
                badge="Security"
              >
                <div className="space-y-3">
                  {Object.keys(activeBlueprint.security).map(sec => (
                    <RequirementCard
                      key={sec}
                      label={sec}
                      description={`Security scanning baseline rule verifying ${sec}.`}
                      value={activeBlueprint.security[sec]}
                      type="checkbox"
                      onChange={(val) => handleConfigChange('security', sec, val)}
                    />
                  ))}
                </div>
              </ConfigurationSection>

              {/* SECTION 9: Accessibility & SEO Checklists */}
              <ConfigurationSection
                title="SEO & Accessibility Audits"
                description="Enable verification checks validating accessibility compliance standards and SEO rules."
                badge="Audits"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accessibility Rules</label>
                    {Object.keys(activeBlueprint.accessibility).map(acc => (
                      <RequirementCard
                        key={acc}
                        label={acc}
                        value={activeBlueprint.accessibility[acc]}
                        type="checkbox"
                        onChange={(val) => handleConfigChange('accessibility', acc, val)}
                      />
                    ))}
                  </div>

                  <div className="space-y-3 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SEO Meta Checkers</label>
                    {Object.keys(activeBlueprint.seo).map(rule => (
                      <RequirementCard
                        key={rule}
                        label={rule}
                        value={activeBlueprint.seo[rule]}
                        type="checkbox"
                        onChange={(val) => handleConfigChange('seo', rule, val)}
                      />
                    ))}
                  </div>
                </div>
              </ConfigurationSection>

              {/* SECTION 10: Validation Rules & Certification (Placeholder) */}
              <ConfigurationSection
                title="Certification Configuration (Rules Engine)"
                description="Configuration parameters mapping directly to validation scripts, sandboxed compiler options, and secret checkers."
                badge="Static Pipeline"
              >
                <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl text-left text-xs font-bold text-gray-400 leading-relaxed flex items-start gap-2.5">
                  <Settings className="animate-spin text-primary shrink-0" size={16} />
                  <span>Validation pipeline rules configuration models are mapped. Static checkers and AST scanners will connect dynamically here during Phase 3 engine integration.</span>
                </div>
              </ConfigurationSection>
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT PANEL: Blueprint Summary & Score
            ======================================================== */}
        {activeBlueprint && summaryData && (
          <div className="w-full lg:w-1/4 space-y-5 shrink-0 lg:sticky lg:top-4 transition-all duration-300">
            
            {/* Compliance Circular Gauge */}
            <ScoreCard value={summaryData.overallScore} label="Overall Score" />

            {/* Score Bars per Segment */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Category Completion</h3>
              <div className="space-y-3">
                <ProgressCard label="General Details" value={summaryData.genScore} />
                <ProgressCard label="Sitemap Pages" value={summaryData.pagesScore} />
                <ProgressCard label="CMS Fields" value={summaryData.cmsScore} />
                <ProgressCard label="API Contracts" value={summaryData.apisScore} />
                <ProgressCard label="Logic Features" value={summaryData.featuresScore} />
              </div>
            </div>

            {/* Advanced Metrics Summaries */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Advanced Scoring</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                  <span className="flex items-center gap-1"><Activity size={14} className="text-emerald-500" /> Health Index</span>
                  <span className="text-emerald-600">{summaryData.healthScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${summaryData.healthScore}%` }} />
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-gray-600 pt-2">
                  <span className="flex items-center gap-1"><Award size={14} className="text-primary" /> Est. Cert. Avg</span>
                  <span className="text-primary">{summaryData.estCertScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${summaryData.estCertScore}%` }} />
                </div>
              </div>
            </div>

            {/* Parameters Counters */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Requirement Rules</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-blue-600">{summaryData.totalRequired}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Required</div>
                </div>
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-amber-500">{summaryData.totalOptional}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Optional</div>
                </div>
                <div className="p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <div className="text-sm font-bold text-red-500">{summaryData.totalDisabled}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Disabled</div>
                </div>
              </div>
            </div>

            {/* Certification Difficulty */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3 text-left shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Difficulty Index</h3>
              <div className={`p-3.5 border rounded-2xl text-center transition-all ${summaryData.difficultyColor}`}>
                <div className="text-xs font-bold tracking-tight">{summaryData.difficulty}</div>
                <div className="text-[8px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Audit Difficulty Estimation</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </CMSPage>
  );
}
