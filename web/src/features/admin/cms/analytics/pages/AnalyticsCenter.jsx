import React, { useState, useEffect, useCallback } from 'react';
import {
  getAnalyticsOverview, getExecutiveDashboard, getFinancialAnalytics,
  getOperationsAnalytics, getCustomerAnalytics, getAIAnalytics,
  getForecastAnalytics, getBenchmarkAnalytics, getKpiScorecard,
  getReportsAnalytics, getAnalyticsHealth, refreshAnalyticsCache,
  initializeAnalyticsDefaults, updateAnalyticsPreference
} from '../services/analytics.api';
import CMSPage from '../../components/CMSPage';
import CMSStatsCard from '../../components/CMSStatsCard';
import {
  BarChart3, TrendingUp, DollarSign, Users, Activity, Cpu,
  Globe, ShoppingCart, Target, LineChart, PieChart, Layers,
  Download, RefreshCw, Settings, Bell, Shield, Zap,
  Eye, BookOpen, Clock, Cloud, Server, Map, Smartphone,
  FileText, Award, AlertTriangle, Upload, HardDrive
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Analytics Overview', icon: BarChart3 },
  { id: 'executive', label: 'Executive Dashboard', icon: TrendingUp },
  { id: 'financial', label: 'Financial Analytics', icon: DollarSign },
  { id: 'revenue', label: 'Revenue Breakdown', icon: DollarSign },
  { id: 'subscriptions', label: 'Subscription Analytics', icon: ShoppingCart },
  { id: 'kpis', label: 'KPI Scorecard', icon: Target },
  { id: 'operations', label: 'Operations Analytics', icon: Cpu },
  { id: 'deployments', label: 'Deployment Analytics', icon: Upload },
  { id: 'storage', label: 'Storage Analytics', icon: HardDrive },
  { id: 'customers', label: 'Customer Analytics', icon: Users },
  { id: 'businesses', label: 'Business Analytics', icon: Globe },
  { id: 'marketplace', label: 'Marketplace Analytics', icon: ShoppingCart },
  { id: 'compliance', label: 'Compliance Analytics', icon: Shield },
  { id: 'ai', label: 'AI Analytics', icon: Cpu },
  { id: 'ai-costs', label: 'AI Cost Analytics', icon: DollarSign },
  { id: 'ai-metrics', label: 'AI Metrics', icon: Activity },
  { id: 'workflows', label: 'Workflow Analytics', icon: Layers },
  { id: 'forecast', label: 'Forecasting', icon: LineChart },
  { id: 'benchmark', label: 'Benchmarks', icon: Award },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'health', label: 'Health Status', icon: Activity },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'infrastructure', label: 'Infra Analytics', icon: Server }
];

export default function AnalyticsCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [executive, setExecutive] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [operations, setOperations] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [ai, setAi] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [reports, setReports] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ex, fi, op, cu, aiData, fc, bm, kp, rp, he] = await Promise.all([
        getAnalyticsOverview().catch(() => ({ data: null })),
        getExecutiveDashboard().catch(() => ({ data: null })),
        getFinancialAnalytics().catch(() => ({ data: null })),
        getOperationsAnalytics().catch(() => ({ data: null })),
        getCustomerAnalytics().catch(() => ({ data: null })),
        getAIAnalytics().catch(() => ({ data: null })),
        getForecastAnalytics().catch(() => ({ data: null })),
        getBenchmarkAnalytics().catch(() => ({ data: null })),
        getKpiScorecard().catch(() => ({ data: null })),
        getReportsAnalytics().catch(() => ({ data: null })),
        getAnalyticsHealth().catch(() => ({ data: null }))
      ]);
      setOverview(ov.data);
      setExecutive(ex.data);
      setFinancial(fi.data);
      setOperations(op.data);
      setCustomers(cu.data);
      setAi(aiData.data);
      setForecast(fc.data);
      setBenchmark(bm.data);
      setKpis(kp.data);
      setReports(rp.data);
      setHealth(he.data);
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleRefresh() {
    try {
      await refreshAnalyticsCache();
      await loadAll();
    } catch (e) { alert('Refresh failed: ' + e.message); }
  }

  async function handleInitialize() {
    try {
      const res = await initializeAnalyticsDefaults();
      alert('Defaults initialized: ' + JSON.stringify(res.data));
      await loadAll();
    } catch (e) { alert('Failed: ' + e.message); }
  }

  const renderScoreBadge = (score) => {
    if (score >= 80) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-bold">{score}</span>;
    if (score >= 60) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-bold">{score}</span>;
    if (score >= 40) return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-bold">{score}</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-bold">{score}</span>;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            {overview ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Businesses" value={overview.executive?.totalBusinesses || 0} icon={Globe} color="blue" />
                  <CMSStatsCard title="MRR" value={overview.executive?.mrr ? `₹${overview.executive.mrr.toLocaleString()}` : '₹0'} icon={DollarSign} color="green" />
                  <CMSStatsCard title="ARR" value={overview.executive?.arr ? `₹${overview.executive.arr.toLocaleString()}` : '₹0'} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Growth Rate" value={overview.executive?.growthRate != null ? `${overview.executive.growthRate}%` : '0%'} icon={Activity} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Active Businesses" value={overview.customers?.active || 0} icon={Users} color="blue" />
                  <CMSStatsCard title="Total Deployments" value={overview.operations?.deployments?.total || 0} icon={Upload} color="green" />
                  <CMSStatsCard title="Storage" value={overview.operations?.storage?.totalMB ? `${overview.operations.storage.totalMB} MB` : '0 MB'} icon={HardDrive} color="purple" />
                  <CMSStatsCard title="AI Cost (Monthly)" value={overview.ai?.monthlyCost ? `₹${overview.ai.monthlyCost}` : '₹0'} icon={Cpu} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Forecast (Next Month)" value={overview.forecast?.nextMonthRevenue ? `₹${overview.forecast.nextMonthRevenue.toLocaleString()}` : '₹0'} icon={LineChart} color="blue" />
                  <CMSStatsCard title="Revenue (Total)" value={overview.financial?.revenue?.total ? `₹${overview.financial.revenue.total.toLocaleString()}` : '₹0'} icon={DollarSign} color="green" />
                  <CMSStatsCard title="Profitability" value={overview.financial?.profitability != null ? `${overview.financial.profitability}%` : '0%'} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Platform Businesses" value={overview.benchmarks?.totalBusinesses || 0} icon={Globe} color="indigo" />
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-2">Quick Actions</h3>
                  <div className="flex gap-2">
                    <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"><RefreshCw className="w-3.5 h-3.5" /> Refresh Cache</button>
                    <button onClick={handleInitialize} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700"><Settings className="w-3.5 h-3.5" /> Initialize Defaults</button>
                  </div>
                </div>
              </>
            ) : <p className="text-gray-400">No overview data available</p>}
          </div>
        );

      case 'executive':
        return (
          <div className="space-y-4">
            {executive ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Businesses" value={executive.totalBusinesses} icon={Globe} color="blue" />
                  <CMSStatsCard title="Active Businesses" value={executive.activeBusinesses} icon={Users} color="green" />
                  <CMSStatsCard title="Inactive" value={executive.inactiveBusinesses || 0} icon={Users} color="red" />
                  <CMSStatsCard title="Trial" value={executive.trialBusinesses || 0} icon={Clock} color="yellow" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="MRR" value={`₹${(executive.mrr || 0).toLocaleString()}`} icon={DollarSign} color="green" />
                  <CMSStatsCard title="ARR" value={`₹${(executive.arr || 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Growth Rate" value={`${executive.growthRate || 0}%`} icon={Activity} color="blue" />
                  <CMSStatsCard title="Conversion Rate" value={`${executive.conversionRate || 0}%`} icon={Target} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Retention Rate" value={`${executive.retentionRate || 0}%`} icon={Users} color="green" />
                  <CMSStatsCard title="Churned" value={executive.churnedBusinesses || 0} icon={Users} color="red" />
                  <CMSStatsCard title="Total Tenants" value={executive.totalTenants || 0} icon={Layers} color="blue" />
                </div>
              </>
            ) : <p className="text-gray-400">No executive data available</p>}
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-4">
            {financial ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Revenue" value={`₹${(financial.revenue?.total || 0).toLocaleString()}`} icon={DollarSign} color="green" />
                  <CMSStatsCard title="Subscription" value={`₹${(financial.revenue?.subscription || 0).toLocaleString()}`} icon={ShoppingCart} color="blue" />
                  <CMSStatsCard title="Commerce" value={`₹${(financial.revenue?.commerce || 0).toLocaleString()}`} icon={ShoppingCart} color="purple" />
                  <CMSStatsCard title="Payments" value={`₹${(financial.revenue?.payments || 0).toLocaleString()}`} icon={DollarSign} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Net Revenue" value={`₹${(financial.revenue?.net || 0).toLocaleString()}`} icon={TrendingUp} color="green" />
                  <CMSStatsCard title="Total Costs" value={`₹${(financial.costs?.total || 0).toLocaleString()}`} icon={DollarSign} color="red" />
                  <CMSStatsCard title="Profitability" value={`${financial.profitability || 0}%`} icon={Target} color="blue" />
                </div>
              </>
            ) : <p className="text-gray-400">No financial data available</p>}
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-4">
            {financial?.subscriptionAnalytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Plans" value={financial.subscriptionAnalytics.totalPlans || 0} icon={ShoppingCart} color="blue" />
                <CMSStatsCard title="Active Plans" value={financial.subscriptionAnalytics.activePlans || 0} icon={ShoppingCart} color="green" />
                <CMSStatsCard title="Total Subscriptions" value={financial.subscriptionAnalytics.totalSubs || 0} icon={Users} color="purple" />
                <CMSStatsCard title="Active Subscriptions" value={financial.subscriptionAnalytics.activeSubs || 0} icon={Users} color="green" />
                <CMSStatsCard title="Trial" value={financial.subscriptionAnalytics.trialSubs || 0} icon={Clock} color="yellow" />
                <CMSStatsCard title="Expired" value={financial.subscriptionAnalytics.expiredSubs || 0} icon={Clock} color="red" />
                <CMSStatsCard title="Total Billed" value={`₹${(financial.subscriptionAnalytics.totalBilled || 0).toLocaleString()}`} icon={DollarSign} color="indigo" />
              </div>
            ) : <p className="text-gray-400">No subscription data available</p>}
          </div>
        );

      case 'kpis':
        return (
          <div className="space-y-4">
            {kpis ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Revenue" value={`₹${(kpis.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="green" />
                  <CMSStatsCard title="MRR" value={`₹${(kpis.mrr || 0).toLocaleString()}`} icon={DollarSign} color="blue" />
                  <CMSStatsCard title="ARR" value={`₹${(kpis.arr || 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Active Businesses" value={kpis.activeBusinesses || 0} icon={Users} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Deployments" value={kpis.totalDeployments || 0} icon={Upload} color="blue" />
                  <CMSStatsCard title="AI Cost" value={`₹${(kpis.aiCost || 0).toLocaleString()}`} icon={Cpu} color="red" />
                  <CMSStatsCard title="AI Tokens" value={(kpis.aiTokens || 0).toLocaleString()} icon={Activity} color="purple" />
                  <CMSStatsCard title="Avg Report Score" value={kpis.avgReportScore != null ? kpis.avgReportScore : 'N/A'} icon={FileText} color="green" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Growth Rate" value={`${kpis.growthRate || 0}%`} icon={Activity} color="blue" />
                  <CMSStatsCard title="Retention Rate" value={`${kpis.retentionRate || 0}%`} icon={Users} color="green" />
                  <CMSStatsCard title="Conversion Rate" value={`${kpis.conversionRate || 0}%`} icon={Target} color="purple" />
                </div>
              </>
            ) : <p className="text-gray-400">No KPI data available</p>}
          </div>
        );

      case 'operations':
        return (
          <div className="space-y-4">
            {operations ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Deployments" value={operations.deployments?.total || 0} icon={Upload} color="blue" />
                  <CMSStatsCard title="Total Domains" value={operations.domains?.total || 0} icon={Globe} color="green" />
                  <CMSStatsCard title="Active Domains" value={operations.domains?.active || 0} icon={Globe} color="purple" />
                  <CMSStatsCard title="Storage (MB)" value={operations.storage?.totalMB || 0} icon={HardDrive} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Queue Depth" value={operations.queue?.depth || 0} icon={Clock} color="blue" />
                  <CMSStatsCard title="Queue Waiting" value={operations.queue?.waiting || 0} icon={Clock} color="yellow" />
                  <CMSStatsCard title="Queue Active" value={operations.queue?.active || 0} icon={Activity} color="green" />
                  <CMSStatsCard title="Redis Connected" value={operations.queue?.redisConnected ? 'Yes' : 'No'} icon={Activity} color={operations.queue?.redisConnected ? 'green' : 'red'} />
                </div>
              </>
            ) : <p className="text-gray-400">No operations data available</p>}
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            {customers ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Total Businesses" value={customers.businesses?.total || 0} icon={Globe} color="blue" />
                  <CMSStatsCard title="Active" value={customers.businesses?.active || 0} icon={Users} color="green" />
                  <CMSStatsCard title="Inactive" value={customers.businesses?.inactive || 0} icon={Users} color="red" />
                  <CMSStatsCard title="Boutiques" value={customers.boutiques || 0} icon={ShoppingCart} color="purple" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Support Tickets" value={customers.tickets?.total || 0} icon={Bell} color="blue" />
                  <CMSStatsCard title="Open Tickets" value={customers.tickets?.open || 0} icon={Bell} color="yellow" />
                  <CMSStatsCard title="Resolved" value={customers.tickets?.resolved || 0} icon={Bell} color="green" />
                  <CMSStatsCard title="Notifications Sent" value={customers.notifications?.total || 0} icon={Bell} color="purple" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Validation Reports" value={customers.reports?.total || 0} icon={FileText} color="blue" />
                  <CMSStatsCard title="Avg Report Score" value={customers.reports?.avgScore != null ? customers.reports.avgScore : 'N/A'} icon={FileText} color="green" />
                  <CMSStatsCard title="Read Rate" value={customers.notifications?.readRate ? `${customers.notifications.readRate}%` : '0%'} icon={Eye} color="purple" />
                </div>
              </>
            ) : <p className="text-gray-400">No customer data available</p>}
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-4">
            {ai ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">AI Analytics Dashboard</h3>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-96 overflow-auto">{JSON.stringify(ai, null, 2)}</pre>
              </div>
            ) : <p className="text-gray-400">No AI data available</p>}
          </div>
        );

      case 'forecast':
        return (
          <div className="space-y-4">
            {forecast ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Next Month Revenue" value={`₹${(forecast.revenue?.nextMonth || 0).toLocaleString()}`} icon={LineChart} color="green" />
                  <CMSStatsCard title="Next Quarter" value={`₹${(forecast.revenue?.nextQuarter || 0).toLocaleString()}`} icon={LineChart} color="blue" />
                  <CMSStatsCard title="Next Year" value={`₹${(forecast.revenue?.nextYear || 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
                  <CMSStatsCard title="Confidence" value={forecast.revenue?.confidence || 'low'} icon={Target} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Monthly Growth" value={forecast.growth?.currentMonthlyGrowth || 0} icon={Activity} color="blue" />
                  <CMSStatsCard title="Growth Next Month" value={forecast.growth?.nextMonth || 0} icon={Activity} color="green" />
                  <CMSStatsCard title="Daily Deploy Rate" value={forecast.deployments?.currentDailyRate || 0} icon={Upload} color="purple" />
                  <CMSStatsCard title="Deploy Next Week" value={forecast.deployments?.nextWeek || 0} icon={Upload} color="indigo" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CMSStatsCard title="Daily Tokens" value={(forecast.usage?.currentDailyTokens || 0).toLocaleString()} icon={Cpu} color="blue" />
                  <CMSStatsCard title="Daily Cost" value={`₹${forecast.usage?.currentDailyCost || 0}`} icon={DollarSign} color="red" />
                </div>
              </>
            ) : <p className="text-gray-400">No forecast data available</p>}
          </div>
        );

      case 'benchmark':
        return (
          <div className="space-y-4">
            {benchmark ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Businesses" value={benchmark.platform?.totalBusinesses || 0} icon={Globe} color="blue" />
                <CMSStatsCard title="Total Deployments" value={benchmark.platform?.totalDeployments || 0} icon={Upload} color="green" />
                <CMSStatsCard title="Avg Report Score" value={benchmark.platform?.avgReportScore != null ? benchmark.platform.avgReportScore : 'N/A'} icon={FileText} color="purple" />
                <CMSStatsCard title="Total Commerce Revenue" value={`₹${(benchmark.platform?.totalCommerceRevenue || 0).toLocaleString()}`} icon={DollarSign} color="indigo" />
                <CMSStatsCard title="Total Orders" value={benchmark.platform?.totalCommerceOrders || 0} icon={ShoppingCart} color="blue" />
                <CMSStatsCard title="Avg Revenue/Business" value={`₹${(benchmark.platform?.avgRevenuePerBusiness || 0).toLocaleString()}`} icon={DollarSign} color="green" />
              </div>
            ) : <p className="text-gray-400">No benchmark data available</p>}
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            {benchmark?.deployments ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Deployments (30d)" value={benchmark.deployments?.total30d || 0} icon={Upload} color="blue" />
                <CMSStatsCard title="Avg Duration" value={benchmark.deployments?.avgDurationSec ? `${benchmark.deployments.avgDurationSec}s` : '0s'} icon={Clock} color="green" />
                <CMSStatsCard title="AI Requests (30d)" value={benchmark.ai?.totalRequests30d || 0} icon={Cpu} color="purple" />
                <CMSStatsCard title="Orders (30d)" value={benchmark.commerce?.totalOrders30d || 0} icon={ShoppingCart} color="indigo" />
                <CMSStatsCard title="Avg Order Value" value={`₹${benchmark.commerce?.avgOrderValue || 0}`} icon={DollarSign} color="green" />
              </div>
            ) : <p className="text-gray-400">No performance data available</p>}
          </div>
        );

      case 'deployments':
        return (
          <div className="space-y-4">
            {operations?.deployments ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Deployments" value={operations.deployments.total || 0} icon={Upload} color="blue" />
              </div>
            ) : <p className="text-gray-400">No deployment data available</p>}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Deployment Analytics</h3>
              <p className="text-xs text-gray-400">Detailed deployment analytics available via Operations Analytics tab.</p>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-4">
            {operations?.storage ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CMSStatsCard title="Total Storage" value={`${operations.storage.totalMB || 0} MB`} icon={HardDrive} color="blue" />
                <CMSStatsCard title="Total Bytes" value={(operations.storage.totalBytes || 0).toLocaleString()} icon={HardDrive} color="green" />
                <CMSStatsCard title="Artifacts" value={operations.storage.artifacts || 0} icon={FileText} color="purple" />
                <CMSStatsCard title="Assets" value={operations.storage.assets || 0} icon={FileText} color="indigo" />
                <CMSStatsCard title="Uploads" value={operations.storage.uploads || 0} icon={Upload} color="blue" />
                <CMSStatsCard title="Environments" value={operations.storage.environments || 0} icon={Layers} color="green" />
              </div>
            ) : <p className="text-gray-400">No storage data available</p>}
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            {reports ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Reports Analytics</h3>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-96 overflow-auto">{JSON.stringify(reports, null, 2)}</pre>
              </div>
            ) : <p className="text-gray-400">No report data available</p>}
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            {health ? (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Analytics Health Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <CMSStatsCard title="Status" value={health.status || 'unknown'} icon={Activity} color="blue" />
                </div>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-64 overflow-auto">{JSON.stringify(health, null, 2)}</pre>
              </div>
            ) : <p className="text-gray-400">No health data available</p>}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Analytics Preferences</h3>
              <p className="text-xs text-gray-400 mb-3">Configure analytics dashboard preferences, stored in CmsAiSettings.</p>
              <div className="flex gap-2">
                <button onClick={handleInitialize} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Initialize Defaults</button>
                <button onClick={handleRefresh} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Refresh Cache</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">{TABS.find(t => t.id === activeTab)?.label || 'Tab'} content coming soon</p>
          </div>
        );
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <CMSPage
      title="Analytics & BI Center"
      description="Enterprise Analytics & Business Intelligence — orchestration facade over 18+ existing analytics services"
    >
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 border-b pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary bg-white border border-b-white -mb-[3px] border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </CMSPage>
  );
}
