import React, { useState, useEffect, useCallback } from 'react';
import {
  getPartners, getPartnerOverview, getPartnerAnalytics, getPartnerHealth,
  getPartnerInfrastructure, getPartnerDeployments, getPartnerCompliance,
  getPartnerMonitoring, getPartnerMarketplace, getBrandKits, getBrandingConfig,
  getPartnerTheme, getAgencies, getResellers, getFranchises, getOEMs,
  getLicenses, getPackages, getPartnerRevenueAnalytics, getPartnerGrowthAnalytics,
  refreshPartnerCache, initializePartnerDefaults
} from '../services/partner.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  Users, Building2, Palette, Shield, BarChart3, Activity,
  Server, Upload, CheckSquare, Eye, ShoppingCart, Workflow,
  Award, Globe, Settings, RefreshCw, DollarSign, TrendingUp,
  Layers, FileText
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Partner Overview', icon: Users },
  { id: 'partners', label: 'All Partners', icon: Globe },
  { id: 'agencies', label: 'Agencies', icon: Building2 },
  { id: 'resellers', label: 'Resellers', icon: Users },
  { id: 'franchises', label: 'Franchises', icon: Layers },
  { id: 'oem', label: 'OEM Partners', icon: Award },
  { id: 'branding', label: 'Brand Kits', icon: Palette },
  { id: 'branding-config', label: 'Branding Config', icon: Settings },
  { id: 'themes', label: 'Themes', icon: Eye },
  { id: 'licenses', label: 'Licenses', icon: Shield },
  { id: 'packages', label: 'Packages', icon: ShoppingCart },
  { id: 'analytics', label: 'Partner Analytics', icon: BarChart3 },
  { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
  { id: 'growth', label: 'Growth Analytics', icon: TrendingUp },
  { id: 'health', label: 'Partner Health', icon: Activity },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server },
  { id: 'deployments', label: 'Deployments', icon: Upload },
  { id: 'compliance', label: 'Compliance', icon: CheckSquare },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart }
];

export default function WhiteLabelCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [partners, setPartners] = useState([]);
  const [brandKits, setBrandKits] = useState([]);
  const [brandingConfig, setBrandingConfig] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [oems, setOems] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [health, setHealth] = useState(null);
  const [infrastructure, setInfrastructure] = useState(null);
  const [deployments, setDeployments] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, pt, bk, bc, ag, rs, fr, oe, lc, pk, an, rv, gr, he, inf, dep, cmp, mon, mp] = await Promise.all([
        getPartnerOverview().catch(() => ({ data: null })),
        getPartners().catch(() => ({ data: [] })),
        getBrandKits().catch(() => ({ data: [] })),
        getBrandingConfig().catch(() => ({ data: null })),
        getAgencies().catch(() => ({ data: [] })),
        getResellers().catch(() => ({ data: [] })),
        getFranchises().catch(() => ({ data: [] })),
        getOEMs().catch(() => ({ data: [] })),
        getLicenses().catch(() => ({ data: [] })),
        getPackages().catch(() => ({ data: [] })),
        getPartnerRevenueAnalytics().catch(() => ({ data: null })),
        getPartnerGrowthAnalytics().catch(() => ({ data: null })),
        getPartnerAnalytics('overview').catch(() => ({ data: null })),
        getPartnerHealth('overview').catch(() => ({ data: null })),
        getPartnerInfrastructure('overview').catch(() => ({ data: null })),
        getPartnerDeployments('overview').catch(() => ({ data: null })),
        getPartnerCompliance('overview').catch(() => ({ data: null })),
        getPartnerMonitoring('overview').catch(() => ({ data: null })),
        getPartnerMarketplace('overview').catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setPartners(Array.isArray(pt.data) ? pt.data : []);
      setBrandKits(Array.isArray(bk.data) ? bk.data : []);
      setBrandingConfig(bc.data);
      setAgencies(Array.isArray(ag.data) ? ag.data : []);
      setResellers(Array.isArray(rs.data) ? rs.data : []);
      setFranchises(Array.isArray(fr.data) ? fr.data : []);
      setOems(Array.isArray(oe.data) ? oe.data : []);
      setLicenses(Array.isArray(lc.data) ? lc.data : []);
      setPackages(Array.isArray(pk.data) ? pk.data : []);
      setAnalytics(an.data);
      setRevenue(rv.data);
      setGrowth(gr.data);
      setHealth(he.data);
      setInfrastructure(inf.data);
      setDeployments(dep.data);
      setCompliance(cmp.data);
      setMonitoring(mon.data);
      setMarketplace(mp.data);
    } catch (err) { console.error('Failed to load partner data', err); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <CMSPage
      title="White-Label & Partner Center"
      subtitle="Enterprise partner, agency, reseller, franchise, OEM, and branding management"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <div className="flex gap-2">
          <button onClick={() => refreshPartnerCache().then(loadAll)} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
          <button onClick={() => initializePartnerDefaults().then(loadAll)} className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"><Settings size={14} /> Init Defaults</button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CMSStatsCard title="Total Partners" value={overview?.totalPartners ?? partners.length} icon={Users} />
                <CMSStatsCard title="Active Agencies" value={agencies.length} icon={Building2} />
                <CMSStatsCard title="Resellers" value={resellers.length} icon={Users} />
                <CMSStatsCard title="Franchises" value={franchises.length} icon={Layers} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CMSStatsCard title="OEM Partners" value={oems.length} icon={Award} />
                <CMSStatsCard title="Brand Kits" value={brandKits.length} icon={Palette} />
                <CMSStatsCard title="Licenses" value={licenses.length} icon={Shield} />
                <CMSStatsCard title="Packages" value={packages.length} icon={ShoppingCart} />
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">All Partners</h3>
              {partners.length === 0 ? <p className="text-gray-400 text-sm">No partners found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Type</th><th className="pb-2">Status</th><th className="pb-2">Commission</th></tr></thead>
                    <tbody>{partners.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50"><td className="py-2 font-medium">{p.name}</td><td className="py-2">{p.partnerType}</td><td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span></td><td className="py-2">{p.commissionRate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'agencies' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Agencies</h3>
              {agencies.length === 0 ? <p className="text-gray-400 text-sm">No agencies found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Commission</th></tr></thead>
                    <tbody>{agencies.map(a => (
                      <tr key={a.id} className="border-b border-gray-50"><td className="py-2 font-medium">{a.name}</td><td className="py-2">{a.contactEmail || '-'}</td><td className="py-2">{a.commissionRate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resellers' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Resellers</h3>
              {resellers.length === 0 ? <p className="text-gray-400 text-sm">No resellers found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Commission</th></tr></thead>
                    <tbody>{resellers.map(r => (
                      <tr key={r.id} className="border-b border-gray-50"><td className="py-2 font-medium">{r.name}</td><td className="py-2">{r.contactEmail || '-'}</td><td className="py-2">{r.commissionRate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'franchises' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Franchises</h3>
              {franchises.length === 0 ? <p className="text-gray-400 text-sm">No franchises found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Commission</th></tr></thead>
                    <tbody>{franchises.map(f => (
                      <tr key={f.id} className="border-b border-gray-50"><td className="py-2 font-medium">{f.name}</td><td className="py-2">{f.contactEmail || '-'}</td><td className="py-2">{f.commissionRate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'oem' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">OEM Partners</h3>
              {oems.length === 0 ? <p className="text-gray-400 text-sm">No OEM partners found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Commission</th></tr></thead>
                    <tbody>{oems.map(o => (
                      <tr key={o.id} className="border-b border-gray-50"><td className="py-2 font-medium">{o.name}</td><td className="py-2">{o.contactEmail || '-'}</td><td className="py-2">{o.commissionRate}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Brand Kits</h3>
              {brandKits.length === 0 ? <p className="text-gray-400 text-sm">No brand kits found.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {brandKits.map(kit => (
                    <div key={kit.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2"><Palette size={16} className="text-purple-500" /><span className="font-medium">{kit.name}</span></div>
                      <div className="flex gap-2 text-xs">{kit.primaryColor && <span className="px-2 py-1 rounded" style={{ backgroundColor: kit.primaryColor, color: '#fff' }}>{kit.primaryColor}</span>}{kit.secondaryColor && <span className="px-2 py-1 rounded" style={{ backgroundColor: kit.secondaryColor, color: '#fff' }}>{kit.secondaryColor}</span>}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'branding-config' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Branding Configuration</h3>
              {brandingConfig ? (
                <div className="space-y-2 text-sm"><p><strong>Theme:</strong> {brandingConfig.theme || 'default'}</p><p><strong>Primary:</strong> {brandingConfig.primaryColor || '#3B82F6'}</p><p><strong>Secondary:</strong> {brandingConfig.secondaryColor || '#10B981'}</p></div>
              ) : <p className="text-gray-400 text-sm">No branding config found.</p>}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Partner Themes</h3>
              <p className="text-gray-400 text-sm">Theme management delegated to BoutiqueTheme models.</p>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Licenses</h3>
              {licenses.length === 0 ? <p className="text-gray-400 text-sm">No licenses found.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Key</th><th className="pb-2">Package</th><th className="pb-2">Status</th><th className="pb-2">Expires</th></tr></thead>
                    <tbody>{licenses.map(l => (
                      <tr key={l.id} className="border-b border-gray-50"><td className="py-2 font-mono text-xs">{l.licenseKey}</td><td className="py-2">{l.packageName}</td><td className="py-2">{l.status}</td><td className="py-2">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : 'Never'}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Marketplace Packages</h3>
              {packages.length === 0 ? <p className="text-gray-400 text-sm">No packages found.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-4"><h4 className="font-medium">{pkg.name}</h4><p className="text-xs text-gray-500 mt-1">{pkg.description}</p></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Partner Analytics</h3>
              {analytics ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(analytics, null, 2)}</pre> : <p className="text-gray-400 text-sm">No analytics data.</p>}
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Revenue Analytics</h3>
              {revenue ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(revenue, null, 2)}</pre> : <p className="text-gray-400 text-sm">No revenue data.</p>}
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Growth Analytics</h3>
              {growth ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(growth, null, 2)}</pre> : <p className="text-gray-400 text-sm">No growth data.</p>}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Partner Health</h3>
              {health ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(health, null, 2)}</pre> : <p className="text-gray-400 text-sm">No health data.</p>}
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Infrastructure</h3>
              {infrastructure ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(infrastructure, null, 2)}</pre> : <p className="text-gray-400 text-sm">No infrastructure data.</p>}
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Deployments</h3>
              {deployments ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(deployments, null, 2)}</pre> : <p className="text-gray-400 text-sm">No deployment data.</p>}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Compliance</h3>
              {compliance ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(compliance, null, 2)}</pre> : <p className="text-gray-400 text-sm">No compliance data.</p>}
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Monitoring</h3>
              {monitoring ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(monitoring, null, 2)}</pre> : <p className="text-gray-400 text-sm">No monitoring data.</p>}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Marketplace</h3>
              {marketplace ? <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(marketplace, null, 2)}</pre> : <p className="text-gray-400 text-sm">No marketplace data.</p>}
            </div>
          )}
        </div>
      )}
    </CMSPage>
  );
}
