import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Landmark, Percent, Search, Download, 
  ChevronLeft, ChevronRight, Loader2, Calendar, ShoppingBag, 
  TrendingDown, RefreshCw
} from 'lucide-react';
import { getAdminRevenue } from '@core/services';

const AdminRevenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchRevenueData = async () => {
    try {
      const res = await getAdminRevenue();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRevenueData().finally(() => setLoading(false));
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchRevenueData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Compiling Revenue Metrics...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalRevenue: 0,
    todayRevenue: 0,
    commissionCollected: 0,
    totalPaidOut: 0,
    netProfit: 0,
    transactionsCount: 0
  };

  const boutiqueSales = data?.boutiqueSales || [];
  const transactions = data?.transactions || [];
  const chartData = data?.chartData || [];

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.order?.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.order?.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.boutique?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.method || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateStart) {
      matchesDate = matchesDate && new Date(t.createdAt) >= new Date(dateStart);
    }
    if (dateEnd) {
      const endLimit = new Date(dateEnd);
      endLimit.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.createdAt) <= endLimit;
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Export Transactions to CSV
  const exportTransactionsCSV = () => {
    if (filteredTransactions.length === 0) return alert('No transaction data to export');
    const headers = ['Timestamp', 'Order ID', 'Boutique', 'Customer', 'Payment Method', 'Amount', 'Commission Collected', 'Net Vendor Payout', 'Payout Status'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.order?.orderId || 'N/A',
      t.boutique?.name || 'Unknown',
      t.order?.customerName || 'Guest',
      t.method || 'N/A',
      t.amount,
      t.commissionAmount,
      t.netAmount,
      t.payoutStatus
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `platform_revenue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate SVG Path for Chart Data
  const generateSalesPath = () => {
    if (chartData.length < 2) return '';
    const maxVal = Math.max(...chartData.map(c => c.sales), 100);
    const width = 500;
    const height = 120;
    const points = chartData.map((d, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - (d.sales / maxVal) * (height - 20);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      line: `M ${points.join(' L ')}`,
      area: `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`,
      maxVal
    };
  };

  const salesPathInfo = generateSalesPath();

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Revenue Analytics Workspace</h2>
          <p className="text-gray-500 mt-1 font-medium">Platform commission fees, transaction monitoring, and settlement audits.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
          <button 
            onClick={exportTransactionsCSV}
            className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Download size={14} />
            <span>EXPORT LEDGER CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Gross Sales', value: `₹${kpis.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', desc: "Lifetime captured GMV" },
          { label: 'Commission Revenue', value: `₹${kpis.commissionCollected.toLocaleString()}`, icon: Percent, color: 'text-blue-600 bg-blue-50 border-blue-100', desc: "Gross fees collected" },
          { label: 'Disbursed to Vendors', value: `₹${kpis.totalPaidOut.toLocaleString()}`, icon: Landmark, color: 'text-purple-600 bg-purple-50 border-purple-100', desc: "Released payout margins" },
          { label: 'Net Platform Profit', value: `₹${kpis.netProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-pink-600 bg-pink-50 border-pink-100', desc: "Commissions net of refunds" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-start gap-5">
              <div className={`p-4 rounded-2xl border ${card.color} shrink-0`}>
                <Icon size={24} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{card.label}</span>
                <span className="text-2xl font-black text-gray-900 block truncate">{card.value}</span>
                <span className="text-xs font-medium text-gray-400 block leading-tight">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Trend Line Chart Card */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Sales Trend Chart</h3>
          <p className="text-xs text-gray-400 mt-1">Platform gross transaction value timeline (last 30 days).</p>
        </div>
        <div className="h-44 w-full bg-gray-50 rounded-2xl border border-gray-100/50 p-6 flex flex-col justify-between relative overflow-hidden">
          {salesPathInfo ? (
            <>
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(219, 39, 119)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(219, 39, 119)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={salesPathInfo.area} fill="url(#salesGrad)" />
                <path d={salesPathInfo.line} fill="none" stroke="rgb(219, 39, 119)" strokeWidth="2.5" />
              </svg>
              <div className="absolute top-2 right-4 text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded border">
                MAX PEAK: ₹{salesPathInfo.maxVal.toLocaleString()}
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-gray-400 py-12">Insufficent historical data to trace timeline charts</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Boutique Revenue Leaderboard */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-black text-gray-900">Boutique Sales Standings</h3>
            <p className="text-xs text-gray-400 mt-1">Highest gross sales leaders ranking table.</p>
          </div>

          <div className="space-y-4">
            {boutiqueSales.length > 0 ? (
              boutiqueSales.map((b, idx) => (
                <div key={b.id} className="p-4 border border-gray-50 hover:bg-gray-50 rounded-2xl flex items-center justify-between transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-800">{b.name}</h4>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{b.ordersCount} Custom Orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-900">₹{b.sales.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-primary uppercase mt-0.5">₹{b.commission.toLocaleString()} fees</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-gray-400 font-bold text-xs">No sales registered yet</p>
            )}
          </div>
        </div>

        {/* Captured Payments Audit Table */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">Transaction History Ledger</h3>
              <p className="text-xs text-gray-400 mt-1">Real-time payment audit trails from gateway logs.</p>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                placeholder="Search order ID, Boutique..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <input 
                type="date"
                value={dateStart}
                onChange={e => { setDateStart(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <input 
                type="date"
                value={dateEnd}
                onChange={e => { setDateEnd(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pr-2">Date/Time</th>
                  <th className="pb-3 px-2">Order ID</th>
                  <th className="pb-3 px-2">Boutique</th>
                  <th className="pb-3 px-2">Customer</th>
                  <th className="pb-3 px-2 text-right">Amount</th>
                  <th className="pb-3 pl-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pr-2 text-gray-400 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-2 text-gray-900">{t.order?.orderId || 'N/A'}</td>
                      <td className="py-4 px-2 truncate max-w-[120px]">{t.boutique?.name || 'Unknown'}</td>
                      <td className="py-4 px-2">{t.order?.customerName || 'Guest'}</td>
                      <td className="py-4 px-2 text-right text-gray-900">₹{Number(t.amount).toLocaleString()}</td>
                      <td className="py-4 pl-2 text-right text-primary">₹{Number(t.commissionAmount).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                      No matching transaction records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
              <span className="text-xs font-semibold text-gray-400">
                Page {currentPage} of {totalPages} ({filteredTransactions.length} items)
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
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminRevenue;
