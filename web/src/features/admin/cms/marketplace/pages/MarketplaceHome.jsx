import React, { useState, useEffect, useCallback } from 'react';
import { Store, Package, Grid3x3, Download, RotateCcw, RefreshCw, Save, Star, Clock, BarChart3, Users, KeyRound, MessageSquare, Settings, Search, DownloadCloud, Power, Trash2, Shield, ExternalLink } from 'lucide-react';
import Tabs from '../../../../../core/components/ui/Tabs';
import { marketplaceApi } from '../services/marketplace.api';

const TABS = [
  { id: 'home', label: 'Home', icon: Store },
  { id: 'categories', label: 'Categories', icon: Grid3x3 },
  { id: 'installed', label: 'Installed', icon: Download },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'top_rated', label: 'Top Rated', icon: Star },
  { id: 'developers', label: 'Developers', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'licenses', label: 'Licenses', icon: KeyRound },
  { id: 'config', label: 'Configuration', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const CATEGORY_ICONS = {
  'plugin': Package, 'extension': Package, 'widget': Grid3x3, 'integration': ExternalLink,
  'theme': Package, 'automation-pack': Package, 'ai-pack': Package, 'developer-package': Package,
  'connector': ExternalLink, 'business-pack': Package, 'industry-pack': Package,
  'payment-provider': Package, 'shipping-provider': Package, 'communication-provider': Package,
  'analytics-provider': BarChart3, 'marketing-provider': Package, 'seo-pack': Package,
  'security-pack': Shield, 'reports-pack': Package,
};

export default function MarketplaceHome() {
  const [activeTab, setActiveTab] = useState('home');
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.getAll();
      setAllData(res.data || {});
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshTab = async (tabId) => {
    try {
      const res = await marketplaceApi.getCategory(tabId);
      setAllData(prev => ({ ...prev, [tabId]: res.data }));
    } catch {}
  };

  const handleSave = async () => {
    const category = activeTab;
    const data = editing;
    if (Object.keys(data).length === 0) return;
    setSaving(true);
    try {
      const res = await marketplaceApi.updateCategory(category, data);
      setAllData(prev => ({ ...prev, [category]: res.data }));
      setEditing({});
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleInit = async () => {
    if (!confirm('Reset marketplace defaults?')) return;
    try {
      await marketplaceApi.initialize();
      await load();
    } catch (err) { alert(err.message); }
  };

  const changeValue = (key, rawValue) => {
    let value = rawValue;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = Number(value);
    setEditing(prev => ({ ...prev, [key]: value }));
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await marketplaceApi.searchPackages({ q: searchQuery, limit: 50 });
      setSearchResults(res.packages || []);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  };

  const hasEdits = Object.keys(editing).length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Store className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketplace & Extensions</h1>
            <p className="text-sm text-gray-500">Manage plugins, extensions, themes, integrations, and developer ecosystem</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search marketplace..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} className="pl-8 pr-3 py-1.5 text-sm border rounded-lg w-48" />
          </div>
          <button onClick={handleInit} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RotateCcw className="w-4 h-4" /> Initialize</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <Tabs tabs={TABS.map(t => ({ id: t.id, label: t.label }))} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : !allData ? <div className="text-center py-12 text-gray-500">No data. Click "Initialize" to get started.</div> : (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Store, { className: 'w-4 h-4 text-gray-500' })}
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{activeTab.replace(/_/g, ' ')}</h2>
          </div>
          <div className="p-4">
            {activeTab === 'home' && <HomeTab data={allData} searchResults={searchResults} searching={searching} onSearch={doSearch} searchQuery={searchQuery} onSelectPkg={setSelectedPkg} />}
            {activeTab === 'categories' && <CategoriesTab data={allData.categories} />}
            {activeTab === 'installed' && <InstalledTab data={allData.installed} />}
            {activeTab === 'recent' && <PackageList packages={allData.recent} title="Recently Added" onSelect={setSelectedPkg} />}
            {activeTab === 'top_rated' && <PackageList packages={allData.top_rated} title="Top Rated" onSelect={setSelectedPkg} />}
            {activeTab === 'developers' && <DevelopersTab />}
            {activeTab === 'reviews' && <ReviewsTab />}
            {activeTab === 'licenses' && <LicensesTab />}
            {activeTab === 'config' && <ConfigTab data={allData.config} editing={editing} onChange={changeValue} />}
            {activeTab === 'analytics' && <AnalyticsTab data={allData.stats} />}

            {hasEdits && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPkg && <PackageDetail pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />}
    </div>
  );
}

function HomeTab({ data, searchResults, searching, onSearch, searchQuery, onSelectPkg }) {
  const featured = data?.featured || [];
  const topRated = data?.top_rated || [];
  const recent = data?.recent || [];
  const stats = data?.stats || {};
  const categories = data?.categories || [];

  return (
    <div>
      {searchQuery && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Search Results: "{searchQuery}"</h3>
            <span className="text-xs text-gray-400">{searchResults.length} found</span>
          </div>
          {searching ? <div className="text-sm text-gray-400">Searching...</div> : searchResults.length === 0 ? <div className="text-sm text-gray-400">No results</div> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {searchResults.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onClick={onSelectPkg} />)}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Packages" value={stats.totalPackages || 0} />
        <StatCard label="Approved" value={stats.approvedPackages || 0} />
        <StatCard label="Installations" value={stats.totalInstallations || 0} />
        <StatCard label="Downloads" value={(stats.totalDownloads || 0).toLocaleString()} />
        <StatCard label="Publishers" value={stats.totalPublishers || 0} />
        <StatCard label="Reviews" value={stats.totalReviews || 0} />
        <StatCard label="Avg Rating" value={(stats.averageRating || 0).toFixed(1)} />
        <StatCard label="Pending Review" value={stats.pendingPackages || 0} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Featured Extensions</h3>
          {featured.length === 0 ? <div className="text-sm text-gray-400">No featured packages yet</div> : (
            <div className="space-y-2">{featured.slice(0, 5).map(p => <PackageCard key={p.id} pkg={p} onClick={onSelectPkg} compact />)}</div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Rated</h3>
          {topRated.length === 0 ? <div className="text-sm text-gray-400">No rated packages yet</div> : (
            <div className="space-y-2">{topRated.slice(0, 5).map(p => <PackageCard key={p.id} pkg={p} onClick={onSelectPkg} compact />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ data }) {
  if (!data || data.length === 0) return <div className="text-sm text-gray-400">No categories defined</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map(cat => (
        <div key={cat.id} className="p-4 bg-gray-50 rounded-lg border hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            {React.createElement(CATEGORY_ICONS[cat.id] || Package, { className: 'w-4 h-4 text-purple-500' })}
            <span className="text-sm font-medium text-gray-700">{cat.label}</span>
          </div>
          <div className="text-xs text-gray-400">{cat.count} packages</div>
        </div>
      ))}
    </div>
  );
}

function InstalledTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No installation data</div>;
  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Installations" value={data.total || 0} />
        <StatCard label="Enabled" value={data.enabled || 0} />
        <StatCard label="Disabled" value={data.disabled || 0} />
        <StatCard label="Businesses Using" value={data.businessesUsing || 0} />
      </div>
      {data.recent && data.recent.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Installations</h3>
          <div className="space-y-2">
            {data.recent.map(inst => (
              <div key={inst.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span>{inst.package?.name || 'Unknown'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${inst.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {inst.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PackageList({ packages, title, onSelect }) {
  if (!packages || packages.length === 0) return <div className="text-sm text-gray-400">No packages found</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onClick={onSelect} />)}
    </div>
  );
}

function PackageCard({ pkg, onClick, compact }) {
  const ver = pkg.versions?.[0];
  const manifestType = ver?.manifestJson?.type || ver?.manifestJson?.category || 'extension';
  return (
    <div className={`bg-gray-50 rounded-lg border hover:border-purple-300 transition-colors cursor-pointer ${compact ? 'p-2' : 'p-3'}`} onClick={() => onClick?.(pkg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{pkg.name}</div>
          {!compact && <div className="text-xs text-gray-400 mt-0.5 truncate">{pkg.description}</div>}
        </div>
        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex-shrink-0">{manifestType}</span>
      </div>
      {!compact && (
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{pkg.ratingsAvg?.toFixed(1) || '-'}</span>
          <span className="flex items-center gap-1"><DownloadCloud className="w-3 h-3" />{pkg.downloads || 0}</span>
          {pkg.reviewsCount > 0 && <span>{pkg.reviewsCount} reviews</span>}
        </div>
      )}
    </div>
  );
}

function DevelopersTab() {
  const [devs, setDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    marketplaceApi.getCategory('developers').then(r => setDevs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;
  if (devs.length === 0) return <div className="text-sm text-gray-400">No developers registered</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs text-gray-500"><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Email</th><th className="pb-2 font-medium">Role</th><th className="pb-2 font-medium">Verified</th><th className="pb-2 font-medium">Packages</th><th className="pb-2 font-medium">Created</th></tr></thead>
        <tbody>{devs.map(d => (
          <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2">{d.name}</td><td className="py-2 text-gray-500">{d.email}</td><td className="py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{d.role}</span></td><td className="py-2">{d.isVerified ? <span className="text-green-600 text-xs">Verified</span> : <span className="text-gray-400 text-xs">Unverified</span>}</td><td className="py-2">{d.approvedCount}/{d.packageCount}</td><td className="py-2 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    marketplaceApi.getCategory('reviews').then(r => setReviews(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;
  if (reviews.length === 0) return <div className="text-sm text-gray-400">No reviews yet</div>;
  return (
    <div className="space-y-3">
      {reviews.map(r => (
        <div key={r.id} className="p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{r.package?.name || 'Unknown'}</span>
            <span className="text-xs text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          </div>
          <div className="text-xs text-gray-400">{r.comment || 'No comment'}</div>
        </div>
      ))}
    </div>
  );
}

function LicensesTab() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    marketplaceApi.getCategory('licenses').then(r => setLicenses(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;
  if (licenses.length === 0) return <div className="text-sm text-gray-400">No licenses issued</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs text-gray-500"><th className="pb-2 font-medium">Package</th><th className="pb-2 font-medium">Business</th><th className="pb-2 font-medium">License Key</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Expires</th></tr></thead>
        <tbody>{licenses.map(l => (
          <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2">{l.package?.name}</td><td className="py-2 text-gray-500">{l.business?.name || 'N/A'}</td><td className="py-2 text-xs font-mono text-gray-400">{l.licenseKey?.slice(0, 16)}...</td><td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : l.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.status}</span></td><td className="py-2 text-xs text-gray-400">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : 'Never'}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function ConfigTab({ data, editing, onChange }) {
  if (!data || !data.settings) return <div className="text-sm text-gray-400">No configuration. Click Initialize.</div>;
  const entries = Object.entries(data.settings);
  if (entries.length === 0) return <div className="text-sm text-gray-400">No settings. Click Initialize.</div>;
  return (
    <div>
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-50">
          <label className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
          <input
            type={typeof value === 'boolean' ? 'text' : typeof value === 'number' ? 'number' : 'text'}
            value={editing[key] !== undefined ? editing[key] : value}
            onChange={e => {
              let v = e.target.value;
              if (v === 'true') v = true; else if (v === 'false') v = false; else if (!isNaN(v) && v !== '') v = Number(v);
              onChange(key, v);
            }}
            className="border rounded px-2 py-1.5 text-sm w-full"
          />
          <span className="text-xs text-gray-400">{typeof value}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ data }) {
  if (!data) return <div className="text-sm text-gray-400">No analytics data</div>;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Packages" value={data.totalPackages || 0} />
        <StatCard label="Approved" value={data.approvedPackages || 0} />
        <StatCard label="Pending" value={data.pendingPackages || 0} />
        <StatCard label="Total Installations" value={data.totalInstallations || 0} />
        <StatCard label="Total Downloads" value={(data.totalDownloads || 0).toLocaleString()} />
        <StatCard label="Publishers" value={data.totalPublishers || 0} />
        <StatCard label="Avg Rating" value={(data.averageRating || 0).toFixed(1)} />
        <StatCard label="Total Reviews" value={data.totalReviews || 0} />
      </div>
      {data.topPackages && data.topPackages.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Top Downloads</h3>
          <div className="space-y-2">
            {data.topPackages.map((p, i) => (
              <div key={p.slug} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{(p.downloads || 0).toLocaleString()} downloads</span>
                  <span>{'★'.repeat(Math.round(p.ratingsAvg || 0))}</span>
                  <span>{p.reviewsCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PackageDetail({ pkg, onClose }) {
  const ver = pkg.versions?.[0];
  const capabilities = ver?.capabilities || ver?.manifestJson?.capabilities || [];
  const deps = ver?.dependencies || [];
  const manifestType = ver?.manifestJson?.type || ver?.manifestJson?.category || 'extension';
  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-lg">&times;</button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{manifestType}</span>
          <span className="text-xs text-gray-400">v{ver?.version || '1.0.0'}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{pkg.name}</h2>
        <p className="text-sm text-gray-500 mt-2">{pkg.description}</p>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{pkg.ratingsAvg?.toFixed(1) || 'N/A'}</span>
          <span className="flex items-center gap-1"><DownloadCloud className="w-3.5 h-3.5" />{pkg.downloads || 0} downloads</span>
          <span>{pkg.reviewsCount || 0} reviews</span>
        </div>
        {capabilities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-1.5">{capabilities.map((c, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.type || c}</span>)}</div>
          </div>
        )}
        {deps.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Dependencies</h4>
            {deps.map((d, i) => <div key={i} className="text-xs text-gray-500">{d.dependencySlug}@{d.versionConstraint}</div>)}
          </div>
        )}
        {ver?.manifestJson?.permissions && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Permissions</h4>
            <div className="flex flex-wrap gap-1">{ver.manifestJson.permissions.map((p, i) => <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">{p}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
