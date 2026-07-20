'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useOrderReport } from '@/features/reports';
import { ShoppingCart, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const PipelineChart = dynamic(() => import('@/components/charts/PipelineChart'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-neutral-100 rounded-xl" />,
});

interface OrderReportItem {
  id: string;
  status: string;
  orderNumber: string;
  createdAt: string;
}

const formatAge = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

export default function OrderAnalyticsPage() {
  const [range, setRange] = useState<'7days' | '30days'>('30days');

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (range === '7days' ? 7 : 30));

  const { data, isLoading, error, refetch } = useOrderReport(
    startDate.toISOString().slice(0, 10),
    now.toISOString().slice(0, 10)
  );

  if (isLoading) return <SectionLoader message="Loading order metrics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch order report." retry={refetch} />;

  const reportData =
    (data?.data as {
      totalOrders: number;
      statusBreakdown: Record<string, number>;
      orders: OrderReportItem[];
    }) || { totalOrders: 0, statusBreakdown: {}, orders: [] };

  // Breakdowns
  const breakdown = reportData.statusBreakdown || {};
  const dataBar = Object.entries(breakdown).map(([name, val]) => ({
    name,
    Count: val,
  }));

  // Awaiting actions (e.g. pending or processing)
  const pendingOrders = (reportData.orders || []).filter((o: OrderReportItem) => o.status === 'PENDING');
  const processingOrders = (reportData.orders || []).filter((o: OrderReportItem) => o.status === 'PROCESSING');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Order Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Analyze order pipelines, status transitions, and lifecycle bottlenecks.
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as '7days' | '30days')}
          className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>

      {/* KPI Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Volume</span>
            <ShoppingCart className="h-4 w-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalOrders}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Delivered</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-3">{breakdown.DELIVERED || 0}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Pending Review</span>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600 mt-3">{breakdown.PENDING || 0}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Cancelled</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mt-3">{breakdown.CANCELLED || 0}</h3>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Pipeline Status Distribution</h3>
          <div className="h-64 w-full flex-1">
            <PipelineChart data={dataBar} />
          </div>
        </div>

        {/* Action Required Board */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Awaiting Action</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-64 pr-1">
            <div className="border-b pb-3">
              <span className="text-xs text-neutral-400 font-semibold uppercase">Pending Confirmation ({pendingOrders.length})</span>
              <div className="space-y-2 mt-2">
                {pendingOrders.slice(0, 3).map((o: OrderReportItem) => (
                  <div key={o.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-800">{o.orderNumber}</span>
                    <span className="text-neutral-400">{formatAge(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-400 font-semibold uppercase">In Processing ({processingOrders.length})</span>
              <div className="space-y-2 mt-2">
                {processingOrders.slice(0, 3).map((o: OrderReportItem) => (
                  <div key={o.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-800">{o.orderNumber}</span>
                    <span className="text-neutral-400">{formatAge(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
