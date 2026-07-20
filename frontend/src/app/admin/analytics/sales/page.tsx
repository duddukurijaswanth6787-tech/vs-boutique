'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSalesReport } from '@/features/reports';
import {
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const RevenueTrendChart = dynamic(() => import('@/components/charts/RevenueTrendChart'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse bg-neutral-100 rounded-xl" />,
});

interface SalesReportItem {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');

  // Derive start/end date strings
  const now = new Date();
  const startDate = new Date();
  if (dateRange === '7days') {
    startDate.setDate(now.getDate() - 7);
  } else if (dateRange === '90days') {
    startDate.setDate(now.getDate() - 90);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = now.toISOString().slice(0, 10);

  const { data, isLoading, error, refetch } = useSalesReport(startDateStr, endDateStr);

  if (isLoading) return <SectionLoader message="Loading sales analytics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch sales report." retry={refetch} />;

  const reportData =
    (data?.data as { totalRevenue: number; totalOrders: number; orders: SalesReportItem[] }) ||
    { totalRevenue: 0, totalOrders: 0, orders: [] };

  // Calculate stats
  const avgOrderValue = reportData.totalOrders > 0 
    ? reportData.totalRevenue / reportData.totalOrders 
    : 0;

  // Map chart points
  const sortedOrders = [...(reportData.orders || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const dailyAggregation = new Map<string, number>();
  sortedOrders.forEach((o: SalesReportItem) => {
    const day = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dailyAggregation.set(day, (dailyAggregation.get(day) ?? 0) + Number(o.grandTotal));
  });

  const chartPoints = Array.from(dailyAggregation.entries()).map(([name, value]) => ({
    name,
    sales: value,
  }));

  const kpis = [
    { title: 'Gross Revenue', value: formatCurrency(reportData.totalRevenue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { title: 'Total Orders', value: `${reportData.totalOrders} Orders`, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'Average Order Value', value: formatCurrency(avgOrderValue), icon: ArrowUpRight, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sales Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track business growth, orders, and average ticket size.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7days' | '30days' | '90days')}
            className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{kpi.title}</span>
                <div className={`rounded-lg border p-1.5 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mt-4">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Sales Line Graph */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Revenue Trend Over Time</h3>
        <div className="h-80 w-full">
          <RevenueTrendChart data={chartPoints} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Orders Audited ({reportData.totalOrders})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-2">Order No</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-700">
              {reportData.orders.map((o: SalesReportItem) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-medium text-neutral-900">{o.orderNumber}</td>
                  <td className="py-2.5">{formatCurrency(o.grandTotal)}</td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${o.status === 'DELIVERED' && 'bg-green-50 text-green-700 border border-green-100'}
                      ${o.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                      ${o.status === 'CANCELLED' && 'bg-red-50 text-red-700 border border-red-100'}
                      ${!['DELIVERED', 'PENDING', 'CANCELLED'].includes(o.status) && 'bg-neutral-50 text-neutral-700 border border-neutral-100'}
                    `}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-450">
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
