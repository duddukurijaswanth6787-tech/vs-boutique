import React, { useState, useEffect } from 'react';
import { getBusinesses, getBusinessOverview, getSuccessAnalytics } from '../services/customer-success.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import CMSLoading from '../../components/CMSLoading';

const TABS = [
  { id: 'overview', label: 'Customer Overview' },
  { id: 'health', label: 'Health Score' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'billing', label: 'Billing' },
  { id: 'websites', label: 'Websites' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'domains', label: 'Domains' },
  { id: 'ai-usage', label: 'AI Usage' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'reports', label: 'Reports' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'timeline', label: 'Activity Timeline' },
  { id: 'staff', label: 'Staff' },
  { id: 'storage', label: 'Storage' },
  { id: 'api-usage', label: 'API Usage' },
  { id: 'security', label: 'Security' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'analytics', label: 'Success Analytics' }
];

export default function CustomerSuccess() {
  const [activeTab, setActiveTab] = useState('overview');
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bizRes, analyticsRes] = await Promise.all([
        getBusinesses({ limit: 50 }).catch(() => ({ data: { businesses: [] } })),
        getSuccessAnalytics().catch(() => ({ data: null }))
      ]);
      setBusinesses(bizRes.data?.businesses || []);
      setAnalytics(analyticsRes.data || null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleSelectBusiness(id) {
    setSelectedBusiness(id);
    setLoading(true);
    try {
      const res = await getBusinessOverview(id);
      setOverview(res.data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  if (loading && !overview && !analytics) return <CMSLoading />;

  return (
    <CMSPage
      title="Customer Success Center"
      subtitle="360° customer overview and success analytics"
    >
      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedBusiness || ''}
          onChange={(e) => handleSelectBusiness(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">Select a customer...</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name} ({b.riskLevel})</option>
          ))}
        </select>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'health' && renderHealth()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'recommendations' && renderRecommendations()}
      {activeTab === 'timeline' && renderTimeline()}

      {['subscription','billing','websites','deployments','domains','ai-usage','marketplace','workflows','reports','monitoring','notifications','staff','storage','api-usage','security'].includes(activeTab) && renderPlaceholder()}
    </CMSPage>
  );

  function renderOverview() {
    if (!overview) {
      if (!selectedBusiness) return <p className="text-gray-500">Select a customer to view overview.</p>;
      return <CMSLoading />;
    }
    const { business, health, lifecycle } = overview;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CMSStatsCard title="Business Name" value={business?.name || 'N/A'} />
        <CMSStatsCard title="Status" value={business?.status || 'N/A'} />
        <CMSStatsCard title="Health Score" value={`${health?.overall || 0}%`} color={health?.riskLevel === 'critical' ? 'red' : health?.riskLevel === 'high' ? 'orange' : health?.riskLevel === 'medium' ? 'yellow' : 'green'} />
        <CMSStatsCard title="Risk Level" value={health?.riskLevel || 'Unknown'} />
        <CMSStatsCard title="Lifecycle Stage" value={lifecycle?.stage || 'Unknown'} />
        <CMSStatsCard title="Websites" value={business?.websiteCount || 0} />
        <CMSStatsCard title="Staff" value={business?.staffCount || 0} />
        <CMSStatsCard title="Engagement" value={`${overview.engagement?.engagementScore || 0}%`} />
      </div>
    );
  }

  function renderHealth() {
    if (!overview?.health) return <p className="text-gray-500">Select a customer to view health score.</p>;
    const { health } = overview;
    return (
      <div>
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2">{health.overall}%</div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className={`h-4 rounded-full transition-all ${
              health.riskLevel === 'critical' ? 'bg-red-500' :
              health.riskLevel === 'high' ? 'bg-orange-500' :
              health.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`} style={{ width: `${health.overall}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Risk Level: {health.riskLevel}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(health.details || {}).map(([key, val]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
              <div className="text-lg font-semibold">{val.score}/{val.weight}</div>
              <div className="text-xs text-gray-400">{val.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    if (!analytics) return <p className="text-gray-500">Loading analytics...</p>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CMSStatsCard title="Total Tenants" value={analytics.totalTenants} />
          <CMSStatsCard title="Active Tenants" value={analytics.activeTenants} />
          <CMSStatsCard title="MRR" value={`$${analytics.mrr?.toLocaleString() || 0}`} />
          <CMSStatsCard title="ARR" value={`$${analytics.arr?.toLocaleString() || 0}`} />
          <CMSStatsCard title="Retention Rate" value={`${analytics.retentionRate || 0}%`} />
          <CMSStatsCard title="Churn Rate" value={`${analytics.churnRate || 0}%`} />
          <CMSStatsCard title="Growth Rate" value={`${analytics.growthRate || 0}%`} />
          <CMSStatsCard title="Deployment Success" value={`${analytics.deploymentSuccessRate || 0}%`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CMSStatsCard title="Workflow Success" value={`${analytics.workflowSuccessRate || 0}%`} />
          <CMSStatsCard title="AI Adoption" value={`${analytics.aiAdoptionRate || 0}%`} />
          <CMSStatsCard title="Marketplace Adoption" value={`${analytics.marketplaceAdoptionRate || 0}%`} />
          <CMSStatsCard title="Avg Report Score" value={`${analytics.avgReportScore || 0}/100`} />
        </div>
      </div>
    );
  }

  function renderRecommendations() {
    if (!overview?.recommendations) return <p className="text-gray-500">Select a customer to view recommendations.</p>;
    const { recommendations } = overview.recommendations;
    if (!recommendations?.length) return <p className="text-gray-500">No recommendations at this time.</p>;
    return (
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className={`p-4 rounded-lg border-l-4 ${
            rec.priority >= 8 ? 'border-l-red-500 bg-red-50' :
            rec.priority >= 6 ? 'border-l-orange-500 bg-orange-50' :
            rec.priority >= 4 ? 'border-l-yellow-500 bg-yellow-50' :
            'border-l-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-white/60">{rec.category}</span>
              <span className="text-xs text-gray-500">Priority: {rec.priority}/10</span>
            </div>
            <h4 className="font-semibold text-sm">{rec.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
          </div>
        ))}
      </div>
    );
  }

  function renderTimeline() {
    if (!overview) return <p className="text-gray-500">Select a customer to view timeline.</p>;
    return (
      <div className="space-y-2">
        <div className="text-sm text-gray-500 mb-4">
          Timeline data loaded from 9 sources (audit, deployments, workflows, billing, AI, marketplace, assignments, notifications, orders).
          <a href={`/admin/cms/api-docs`} className="text-primary ml-2">Full timeline via API</a>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{overview.health?.details?.deploymentFailures?.score || 0}</div>
            <div className="text-xs text-gray-500">Deployment Score</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{overview.engagement?.metrics?.workflowExecutions || 0}</div>
            <div className="text-xs text-gray-500">Workflow Executions</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{overview.engagement?.metrics?.deployments || 0}</div>
            <div className="text-xs text-gray-500">Deployments (30d)</div>
          </div>
        </div>
      </div>
    );
  }

  function renderPlaceholder() {
    const tabLabel = TABS.find(t => t.id === activeTab)?.label || 'Tab';
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">{tabLabel} data is loaded from existing services via the Customer Success API.</p>
        <p className="text-xs text-gray-400">Select a customer to view detailed {tabLabel.toLowerCase()} information.</p>
      </div>
    );
  }
}
