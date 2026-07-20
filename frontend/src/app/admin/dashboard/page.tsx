'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardSummary, useDashboardSalesChart } from '@/features/dashboard';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';

// ponytail: lazy-load recharts (~400KB) — only needed when chart section is visible
const SalesChart = dynamic(() => import('@/components/charts/SalesChart'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse bg-neutral-100 rounded-xl" />,
});

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Fetch summary and chart data using new features hooks
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useDashboardSalesChart(period);

  const handleRetry = () => {
    refetchSummary();
    refetchChart();
  };

  if (summaryLoading || chartLoading) {
    return <SectionLoader message="Loading dashboard statistics..." />;
  }

  if (summaryError || chartError) {
    const getStatus = (e: unknown): number =>
      (e as { response?: { status?: number } })?.response?.status ?? 0;
    const status = getStatus(summaryError) || getStatus(chartError) || 0;
    const messages: Record<number, string> = {
      0: 'Unable to connect to the analytics service.',
      400: 'The dashboard request was rejected. Please verify the analytics configuration.',
      401: 'Your admin session has expired. Please sign in again.',
      403: 'You do not have permission to view dashboard analytics.',
      500: 'The analytics service encountered an unexpected error.',
    };
    const message = messages[status] || messages[0];
    return (
      <PageError
        title="Dashboard Load Failure"
        message={message}
        retry={handleRetry}
      />
    );
  }

  const graphData = chartData
    ? chartData.labels.map((label, idx) => ({
        name: label,
        revenue: chartData.data[idx] || 0,
      }))
    : [];

  const growth = summary?.revenueGrowth ?? 0;
  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary?.totalRevenue || 0),
      icon: TrendingUp,
      desc: 'Cumulative sales volume (this month)',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: summary?.totalOrders || 0,
      icon: ShoppingBag,
      desc: 'Completed sales transactions',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Active Customers',
      value: summary?.totalCustomers || 0,
      icon: Users,
      desc: 'Registered account profiles',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Total Catalog Products',
      value: summary?.totalProducts || 0,
      icon: Package,
      desc: 'Count of registered products',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Revenue Today',
      value: formatCurrency(summary?.revenueToday || 0),
      icon: Calendar,
      desc: 'Sales generated today',
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Revenue This Week',
      value: formatCurrency(summary?.revenueThisWeek || 0),
      icon: TrendingUp,
      desc: 'Sales since start of week',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(summary?.averageOrderValue || 0),
      icon: ShoppingBag,
      desc: 'Average ticket size (this month)',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'MoM Revenue Growth',
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      icon: TrendingUp,
      desc: 'Versus previous month',
      color: growth >= 0
        ? 'text-green-600 bg-green-50 border-green-100'
        : 'text-red-600 bg-red-50 border-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Store performance metrics and sales statistics for Vasanthi Designers.
        </p>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`rounded-lg border p-1.5 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-neutral-900">{card.value}</h3>
                <p className="text-[11px] text-neutral-400 mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operational Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-yellow-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Pending Orders
            </p>
            <h4 className="text-xl font-bold text-neutral-950 mt-1">
              {summary?.pendingOrders || 0}
            </h4>
            <p className="text-[11px] text-neutral-400">Awaiting processing shipment</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Low Stock Alerts
            </p>
            <h4 className="text-xl font-bold text-neutral-950 mt-1">
              {summary?.lowStockCount || 0}
            </h4>
            <p className="text-[11px] text-neutral-400">Inventory items running out</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Out of Stock
            </p>
            <h4 className="text-xl font-bold text-neutral-950 mt-1">
              {summary?.outOfStockCount || 0}
            </h4>
            <p className="text-[11px] text-neutral-400">Zero inventory variants</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Refunds Issued
            </p>
            <h4 className="text-xl font-bold text-neutral-950 mt-1">
              {summary?.refundCount || 0}
            </h4>
            <p className="text-[11px] text-neutral-400">Total refund transactions</p>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Revenue Trend</h2>
            <p className="text-xs text-neutral-500">Gross sales representation</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
              className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
            >
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">This Quarter</option>
              <option value="yearly">This Year</option>
            </select>
          </div>
        </div>
        <div className="h-80 w-full">
          <SalesChart data={graphData} />
        </div>
      </div>

      {/* Lists of Recent Orders and Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders Widget */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Recent Orders</h3>
          {summary?.recentOrders && summary.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                    <th className="py-2">Order No</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.recentOrders.map((order) => {
                    return (
                      <tr key={order.id}>
                        <td className="py-2.5 font-medium text-neutral-900">{order.orderNumber}</td>
                        <td className="py-2.5">{formatCurrency(order.grandTotal)}</td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                            ${order.status === 'DELIVERED' && 'bg-green-50 text-green-700 border border-green-100'}
                            ${order.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                            ${order.status === 'CANCELLED' && 'bg-red-50 text-red-700 border border-red-100'}
                            ${!['DELIVERED', 'PENDING', 'CANCELLED'].includes(order.status) && 'bg-neutral-50 text-neutral-700 border border-neutral-100'}
                          `}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-neutral-400">No recent orders found</p>
            </div>
          )}
        </div>

        {/* Top Products Widget */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Selling Products</h3>
          {summary?.topProducts && summary.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                    <th className="py-2">Product Name</th>
                    <th className="py-2">Sales Count</th>
                    <th className="py-2">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.topProducts.map((item) => {
                    return (
                      <tr key={item.productId}>
                        <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[180px]">
                          {item.product?.name || 'Unknown Product'}
                        </td>
                        <td className="py-2.5">{item._sum.quantity || 0} units</td>
                        <td className="py-2.5">{formatCurrency(item._sum.totalPrice || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-neutral-400">No top products recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights: Categories, Brands, Customers */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Categories */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Categories</h3>
          {summary?.topCategories && summary.topCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                    <th className="py-2">Category</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.topCategories.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[160px]">
                        {c.name}
                      </td>
                      <td className="py-2.5">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-neutral-400">No category data recorded</p>
            </div>
          )}
        </div>

        {/* Top Brands */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Brands</h3>
          {summary?.topBrands && summary.topBrands.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                    <th className="py-2">Brand</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.topBrands.map((b) => (
                    <tr key={b.name}>
                      <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[160px]">
                        {b.name}
                      </td>
                      <td className="py-2.5">{formatCurrency(b.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-neutral-400">No brand data recorded</p>
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Customers</h3>
          {summary?.topCustomers && summary.topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                    <th className="py-2">Customer</th>
                    <th className="py-2">Spent</th>
                    <th className="py-2">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.topCustomers.map((c) => (
                    <tr key={c.customerId}>
                      <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[140px]">
                        {c.customer
                          ? `${c.customer.firstName} ${c.customer.lastName}`.trim()
                          : 'Unknown'}
                      </td>
                      <td className="py-2.5">{formatCurrency(c.totalSpent)}</td>
                      <td className="py-2.5">{c.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-neutral-400">No customer data recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
