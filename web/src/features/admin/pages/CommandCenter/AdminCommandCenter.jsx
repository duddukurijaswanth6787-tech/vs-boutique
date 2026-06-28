import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, HardDrive, Database, Clock, ShieldAlert,
  Search, Filter, Download, ChevronLeft, ChevronRight, RefreshCw,
  TrendingUp, Users, DollarSign, Calendar, Star, AlertTriangle, 
  LifeBuoy, CheckCircle2, FileText, ArrowRight, ShieldCheck, HelpCircle,
  TrendingDown, ShoppingBag, PlusCircle, Megaphone, CheckSquare, Layers,
  Loader2, Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getAdminCommandCenter, getAdminTickets } from '@core/services';

/* ─────────────────────────────────────────────────────────────
   Scalable Trend Chart Component - Plots 3 Daily Metrics lines
   ───────────────────────────────────────────────────────────── */
const ScalableTrendChart = ({ data, keys, colors, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-center h-48">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No trend logs found</p>
      </div>
    );
  }

  const width = 500;
  const height = 150;
  const padding = 20;

  let maxVal = 1;
  data.forEach(item => {
    keys.forEach(k => {
      const val = Number(item[k] || 0);
      if (val > maxVal) maxVal = val;
    });
  });

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
      <div className="flex items-center justify-between border-b border-gray-50 pb-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</h4>
        <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-wider">
          {keys.map((k, idx) => (
            <div key={k} className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
              <span className="text-gray-500">{k}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-32 my-4 relative">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Horizontal Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line 
              key={i} 
              x1="0" 
              y1={height - ratio * (height - padding * 2) - padding}
              x2={width}
              y2={height - ratio * (height - padding * 2) - padding}
              stroke="#f9fafb"
              strokeWidth="1.5"
            />
          ))}

          {/* Paths */}
          {keys.map((k, keyIdx) => {
            const points = data.map((item, index) => {
              const x = (index / (data.length - 1)) * width;
              const y = height - (Number(item[k] || 0) / maxVal) * (height - padding * 2) - padding;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            return (
              <path 
                key={k}
                d={`M ${points.join(' L ')}`}
                fill="none"
                stroke={colors[keyIdx]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
        <div className="absolute top-0 right-0 text-[8px] font-black text-gray-400 bg-white/90 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">
          Peak: {maxVal.toLocaleString()}
        </div>
      </div>

      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-3">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Upgraded Command Center Component
   ───────────────────────────────────────────────────────────── */
const AdminCommandCenter = () => {
  const navigate = useNavigate();

  const getPerformedByStr = (log) => {
    if (!log) return 'System';
    if (log.owner?.ownerName) return log.owner.ownerName;
    if (typeof log.performedBy === 'object' && log.performedBy) {
      return log.performedBy.ownerName || log.performedBy.username || log.performedBy.email || log.performedBy.id || 'System';
    }
    return log.performedBy || 'System';
  };

  const getMetadataStr = (metadata) => {
    if (!metadata) return '';
    try {
      const keys = Object.keys(metadata);
      if (keys.length === 0) return '';
      const firstKey = keys[0];
      const val = metadata[firstKey];
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `${firstKey}: ${valStr}`;
    } catch (e) {
      return '';
    }
  };

  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination for Database Audit logs
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 8;

  const fetchCommandCenterData = async () => {
    try {
      const [ccRes, logsRes] = await Promise.all([
        getAdminCommandCenter(),
        api.get('/dashboard/audit-logs')
      ]);
      if (ccRes.success) {
        setData(ccRes);
      }
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error fetching admin Command Center data:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCommandCenterData().finally(() => setLoading(false));

    // Refreshes backend metrics automatically every 30 seconds
    const interval = setInterval(() => {
      fetchCommandCenterData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchCommandCenterData();
    setRefreshing(false);
  };

  // CSV Exporter for Audit logs
  const exportAuditLogsCSV = () => {
    if (filteredLogs.length === 0) return alert('No audit logs to export');
    const headers = ['Timestamp', 'Action Type', 'Entity Type', 'Entity ID', 'Performed By'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.actionType,
      log.entityType,
      log.entityId,
      getPerformedByStr(log)
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters Audit Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPerformedByStr(log).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'All' || log.actionType.includes(actionFilter);
    
    let matchesDate = true;
    if (dateStart) {
      matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateStart);
    }
    if (dateEnd) {
      const endLimit = new Date(dateEnd);
      endLimit.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(log.timestamp) <= endLimit;
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Constructing Enterprise Command Console...</p>
        </div>
      </div>
    );
  }

  // Fallback defaults mapping exactly to the Prisma schema returns
  const kpis = {
    revenueToday: data?.revenueToday || 0,
    revenueTodayGrowth: data?.revenueTodayGrowth || 0,
    revenueMonth: data?.revenueMonth || 0,
    revenueMonthGrowth: data?.revenueMonthGrowth || 0,
    ordersToday: data?.ordersToday || 0,
    completedOrdersToday: data?.completedOrdersToday || 0,
    pendingOrdersToday: data?.pendingOrdersToday || 0,
    bookingsToday: data?.bookingsToday || 0,
    acceptedBookings: data?.acceptedBookings || 0,
    pendingBookings: data?.pendingBookings || 0,
    completedBookings: data?.completedBookings || 0,
    activeCustomers: data?.activeCustomers || 0,
    newCustomers: data?.newCustomers || 0,
    activeBoutiques: data?.activeBoutiques || 0,
    totalBoutiques: data?.totalBoutiques || 0,
    pendingTickets: data?.pendingTickets || 0,
    highPriorityTickets: data?.highPriorityTickets || 0,
    slaBreached: data?.slaBreached || 0,
    pendingReviews: data?.pendingReviews || 0,
    flaggedReviews: data?.flaggedReviews || 0,
    pendingPayoutAmount: data?.pendingPayoutAmount || 0,
    pendingPayoutCount: data?.pendingPayoutCount || 0
  };

  const health = data?.health || {
    status: 'HEALTHY',
    cpu: 0,
    memory: 0,
    database: 'CONNECTED',
    dbLatencyMs: 0,
    uptimeSeconds: 0
  };

  const trends = data?.trends || { revenue: [], orders: [], bookings: [] };
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Command Center</h2>
          <p className="text-gray-500 mt-1 font-medium">Real-time platform status, operational health, and transactional alerts.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white border px-4 py-3 rounded-2xl shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${health.database === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>DB Latency: {health.dbLatencyMs}ms</span>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Live Console</span>
          </button>
        </div>
      </div>

      {/* SECTION 1 — 9 PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Revenue Today */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Revenue Today</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">₹{kpis.revenueToday.toLocaleString()}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>% change vs yesterday</span>
            <span className={`flex items-center gap-0.5 font-black uppercase ${kpis.revenueTodayGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {kpis.revenueTodayGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(kpis.revenueTodayGrowth)}%
            </span>
          </div>
        </div>

        {/* Card 2: Revenue This Month */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Revenue This Month</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <Layers size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">₹{kpis.revenueMonth.toLocaleString()}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>Growth vs prev month</span>
            <span className={`flex items-center gap-0.5 font-black uppercase ${kpis.revenueMonthGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {kpis.revenueMonthGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(kpis.revenueMonthGrowth)}%
            </span>
          </div>
        </div>

        {/* Card 3: Orders Today */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Orders Today</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.ordersToday}</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span className="text-green-600">Delivered: {kpis.completedOrdersToday}</span>
            <span className="text-amber-500 text-right">Pending: {kpis.pendingOrdersToday}</span>
          </div>
        </div>

        {/* Card 4: Bookings Today */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Bookings Today</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Calendar size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.bookingsToday}</h4>
          </div>
          <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span className="text-green-600">Acc: {kpis.acceptedBookings}</span>
            <span className="text-amber-500">Pend: {kpis.pendingBookings}</span>
            <span className="text-blue-500">Comp: {kpis.completedBookings}</span>
          </div>
        </div>

        {/* Card 5: Active Customers */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Active Customers (30d)</span>
            <div className="p-2 bg-pink-50 rounded-xl text-pink-600 border border-pink-100">
              <Users size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.activeCustomers}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>New Cohort (This Month)</span>
            <span className="text-gray-900 font-black">{kpis.newCustomers}</span>
          </div>
        </div>

        {/* Card 6: Active Boutiques */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Active Boutiques (30d)</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
              <Store size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.activeBoutiques}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>Total Registered Boutiques</span>
            <span className="text-gray-900 font-black">{kpis.totalBoutiques}</span>
          </div>
        </div>

        {/* Card 7: Pending Tickets */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Support Tickets</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
              <LifeBuoy size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.pendingTickets}</h4>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-rose-600 border-t border-gray-50 pt-3 mt-1">
            <span>High Risk: {kpis.highPriorityTickets}</span>
            <span className="text-red-600 font-extrabold animate-pulse">SLA Breach: {kpis.slaBreached}</span>
          </div>
        </div>

        {/* Card 8: Pending Reviews */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Reviews Moderation</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-500 border border-amber-100">
              <Star size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">{kpis.pendingReviews}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>Flagged Spam Suspicious</span>
            <span className="text-amber-600 font-black">{kpis.flaggedReviews}</span>
          </div>
        </div>

        {/* Card 9: Pending Payouts */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-card flex flex-col justify-between hover:shadow-premium transition-all duration-300">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Payouts Ledger</span>
            <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="my-3">
            <h4 className="text-3xl font-black text-gray-900">₹{kpis.pendingPayoutAmount.toLocaleString()}</h4>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-t border-gray-50 pt-3 mt-1">
            <span>Outstanding Settlements Requests</span>
            <span className="text-cyan-600 font-black">{kpis.pendingPayoutCount}</span>
          </div>
        </div>

      </div>

      {/* SECTION 2 — COMMAND CENTER PANELS (30 DAYS CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScalableTrendChart 
          data={trends.revenue} 
          keys={['revenue', 'commission', 'payout']} 
          colors={['#db2777', '#3b82f6', '#10b981']} 
          title="Revenue Trend (30d)" 
        />
        <ScalableTrendChart 
          data={trends.orders} 
          keys={['orders', 'completed', 'cancelled']} 
          colors={['#8b5cf6', '#10b981', '#ef4444']} 
          title="Order Trend (30d)" 
        />
        <ScalableTrendChart 
          data={trends.bookings} 
          keys={['bookings', 'accepted', 'completed']} 
          colors={['#6366f1', '#f59e0b', '#10b981']} 
          title="Booking Trend (30d)" 
        />
      </div>

      {/* SECTION 3 & SECTION 4 — ALERTS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Alerts Center Panel */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-50 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Active Alert Center</h3>
              <p className="text-xs text-gray-400 mt-1">Flagged anomalies requiring operational review.</p>
            </div>
            <span className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100">
              {alerts.length} Issues Detected
            </span>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 border rounded-2xl flex items-start gap-4 transition-all ${
                    alert.priority === 'CRITICAL' 
                      ? 'bg-red-50/50 border-red-100 hover:bg-red-50' 
                      : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    alert.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        alert.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.priority}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">{new Date(alert.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">All Operations Healthy</p>
                <p className="text-[10px] mt-1 text-gray-400">Zero fraud reviews, SLA breaches, or delayed payouts in cue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-card space-y-6">
          <div className="border-b border-gray-50 pb-4">
            <h3 className="text-xl font-black text-gray-900">Console Actions</h3>
            <p className="text-xs text-gray-400 mt-1">Primary administrative shortcuts.</p>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {[
              { label: 'Register Boutique', icon: PlusCircle, path: '/boutiques', color: 'hover:bg-primary/5 hover:text-primary hover:border-primary/20' },
              { label: 'Create Campaign Broadcast', icon: Megaphone, path: '/admin/notifications', color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100' },
              { label: 'Approve Flagged Reviews', icon: CheckSquare, path: '/reviews', color: 'hover:bg-green-50 hover:text-green-600 hover:border-green-100' },
              { label: 'Process Vendor Payouts', icon: DollarSign, path: '/admin/payouts', color: 'hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-100' },
              { label: 'Open Ticket Workspace', icon: LifeBuoy, path: '/admin/tickets', color: 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100' },
              { label: 'Scrutinize Fraud Control', icon: ShieldAlert, path: '/admin/fraud', color: 'hover:bg-red-50 hover:text-red-600 hover:border-red-100' }
            ].map((act, idx) => {
              const Icon = act.icon;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(act.path)}
                  className={`w-full flex items-center justify-between p-4 border border-gray-100 rounded-2xl transition-all duration-300 text-xs font-black uppercase tracking-wider text-gray-600 bg-gray-50/50 ${act.color}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={16} />
                    <span>{act.label}</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Database Audit trail ledger at the bottom */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900">Database Audit Trail</h3>
            <p className="text-xs text-gray-400 mt-1">Paginated, filterable activity history matching PostgreSQL logs.</p>
          </div>
          <button 
            onClick={exportAuditLogsCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-black text-gray-600 rounded-xl transition-all"
          >
            <Download size={14} />
            <span>EXPORT CSV</span>
          </button>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              placeholder="Search action or performed by..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
            >
              <option value="All">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="STATUS">Status changes</option>
              <option value="INVITE">Invites</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input 
              type="date"
              value={dateStart}
              onChange={e => { setDateStart(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none"
            />
            <input 
              type="date"
              value={dateEnd}
              onChange={e => { setDateEnd(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-4">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => (
              <div key={log.id} className="p-4 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/30 rounded-2xl flex items-center justify-between gap-4 transition-all">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      log.actionType.includes('DELETE') ? 'bg-red-50 text-red-600' :
                      log.actionType.includes('CREATE') ? 'bg-green-50 text-green-600' :
                      log.actionType.includes('UPDATE') ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {log.actionType}
                    </span>
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {log.entityType} ID: {log.entityId}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-gray-400">
                    Performed by <span className="font-bold text-gray-600">{getPerformedByStr(log)}</span> · {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-black text-gray-400 bg-gray-50 border px-2 py-0.5 rounded uppercase tracking-wider">
                      {getMetadataStr(log.metadata)}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
              <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">No activities match filters</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalLogPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <span className="text-xs font-semibold text-gray-400">
              Page {currentPage} of {totalLogPages} ({filteredLogs.length} logs)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalLogPages}
                onClick={() => setCurrentPage(prev => Math.min(totalLogPages, prev + 1))}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminCommandCenter;
