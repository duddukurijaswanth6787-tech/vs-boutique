import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Shield, CheckCircle, HelpCircle, Power, Trash2, DownloadCloud, AlertTriangle } from 'lucide-react';
import api from '../../../../../services/api';

export default function MarketplaceHome() {
  const [packages, setPackages] = useState([]);
  const [totalPackages, setTotalPackages] = useState(0);
  const [search, setSearch] = useState('');
  const [capability, setCapability] = useState('');
  const [activeTab, setActiveTab] = useState('browse'); // browse, installed
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [installingSlug, setInstallingSlug] = useState(null);
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    // Lookup business context
    api.get('/boutiques')
      .then(res => {
        const firstBoutique = res.data?.data?.[0];
        if (firstBoutique && firstBoutique.businessId) {
          setBusinessId(firstBoutique.businessId);
        }
      })
      .catch(err => console.error('Failed to load boutique business:', err));
  }, []);

  const fetchPackages = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (capability) params.append('capability', capability);
    if (activeTab === 'installed' && businessId) {
      params.append('installedInBusinessId', businessId);
    }

    api.get(`/api/v1/marketplace/packages/search?${params.toString()}`)
      .then(res => {
        setPackages(res.data.packages || []);
        setTotalPackages(res.data.pagination?.total || 0);
      })
      .catch(err => console.error('Failed to query marketplace:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, [search, capability, activeTab, businessId]);

  const handleInstall = async (slug) => {
    if (!businessId) return;
    setInstallingSlug(slug);
    try {
      await api.post('/api/v1/marketplace/installations', {
        businessId,
        packageSlug: slug
      });
      // Refresh
      fetchPackages();
      if (selectedPkg && selectedPkg.slug === slug) {
        // Refresh details modal
        const refreshed = await api.get(`/api/v1/marketplace/packages/${slug}`);
        setSelectedPkg(refreshed.data.data);
      }
    } catch (err) {
      alert(`Installation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleUninstall = async (packageId, slug) => {
    if (!businessId) return;
    if (!window.confirm('Are you sure you want to uninstall this package?')) return;
    try {
      await api.delete(`/api/v1/marketplace/installations/${packageId}`, {
        data: { businessId }
      });
      fetchPackages();
      if (selectedPkg && selectedPkg.slug === slug) {
        setSelectedPkg(null);
      }
    } catch (err) {
      alert(`Uninstall failed: ${err.message}`);
    }
  };

  const handleToggle = async (packageId, currentEnabled) => {
    if (!businessId) return;
    try {
      await api.put(`/api/v1/marketplace/installations/${packageId}/toggle`, {
        businessId,
        isEnabled: !currentEnabled
      });
      fetchPackages();
    } catch (err) {
      alert(`State update failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Title & Headers */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            App Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Extend your boutique website with custom themes, AI agents, and POS workflows.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900/80 backdrop-blur p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'browse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Browse Extensions
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'installed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/35' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Installed Modules
          </button>
        </div>
      </div>

      {/* Filters & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search extensions, components, and design packs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <select
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Capabilities</option>
            <option value="theme">Themes</option>
            <option value="ai-agent">AI Agents</option>
            <option value="workflow-stage">POS Workflows</option>
            <option value="web-component">UI Components</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-indigo-400">Loading catalog...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No marketplace packages found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const latestVer = pkg.versions?.[0];
            const isInstalled = pkg.installations && pkg.installations.length > 0;
            const currentInst = isInstalled ? pkg.installations[0] : null;

            return (
              <div
                key={pkg.id}
                className="bg-slate-900/60 backdrop-blur border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-purple-900/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-900/40">
                      {latestVer?.manifestJson?.type || 'MODULE'}
                    </span>
                    {isInstalled && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-full">
                        Installed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 hover:text-indigo-300 cursor-pointer transition-colors" onClick={() => setSelectedPkg(pkg)}>
                    {pkg.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Capabilities tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {latestVer?.manifestJson?.capabilities?.map((c, idx) => (
                      <span key={idx} className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {c.type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    By Antair Core Labs
                  </span>

                  <div className="flex gap-2">
                    {isInstalled ? (
                      <>
                        <button
                          onClick={() => handleToggle(currentInst.id, currentInst.isEnabled)}
                          className={`p-2 rounded-lg transition-colors ${
                            currentInst.isEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-slate-800 text-slate-400'
                          }`}
                          title={currentInst.isEnabled ? 'Disable Extension' : 'Enable Extension'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUninstall(currentInst.id, pkg.slug)}
                          className="p-2 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg border border-red-900/60 transition-colors"
                          title="Uninstall"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(pkg.slug)}
                        disabled={installingSlug === pkg.slug}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        {installingSlug === pkg.slug ? 'Installing...' : 'Install'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Detail Modal Drawer */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedPkg(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-200 text-lg font-bold"
            >
              ✕
            </button>

            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/40 border border-indigo-900/50 px-3 py-1 rounded-full">
              {selectedPkg.versions?.[0]?.manifestJson?.type || 'MODULE'}
            </span>

            <h2 className="text-2xl font-extrabold text-slate-100 mt-4">{selectedPkg.name}</h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">{selectedPkg.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Version</h4>
                <p className="text-sm text-slate-300 mt-1">{selectedPkg.versions?.[0]?.version || '1.0.0'}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrations / Capabilities</h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedPkg.versions?.[0]?.manifestJson?.capabilities?.map((c, idx) => (
                    <span key={idx} className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {c.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Permissions Requested</h4>
              <div className="space-y-2">
                {selectedPkg.versions?.[0]?.manifestJson?.permissions?.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/60">
                    <Shield className="h-4.5 w-4.5 text-purple-400" />
                    <span>{p}</span>
                  </div>
                )) || <div className="text-xs text-slate-500">No special permissions requested.</div>}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800/80">
              <button
                onClick={() => setSelectedPkg(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
