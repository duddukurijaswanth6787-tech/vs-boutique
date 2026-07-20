'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  useCancellationRefundTrends,
  useInventoryValuation,
  useWarehouseStock,
  usePaymentStatusDistribution,
  useCouponUsageSummary,
} from '@/features/dashboard';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TrendsChart = dynamic(() => import('@/components/charts/TrendsChart'), {
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

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const trends = useCancellationRefundTrends();
  const valuation = useInventoryValuation();
  const warehouse = useWarehouseStock();
  const payments = usePaymentStatusDistribution(startDate || undefined, endDate || undefined);
  const coupons = useCouponUsageSummary(startDate || undefined, endDate || undefined);

  const loading = trends.isLoading || valuation.isLoading || warehouse.isLoading || payments.isLoading || coupons.isLoading;
  const error = trends.error || valuation.error || warehouse.error || payments.error || coupons.error;

  if (loading) return <SectionLoader message="Loading analytics..." />;
  if (error) return <PageError title="Analytics Load Failure" message="Could not load analytics data." retry={() => {}} />;

  const trendData = (trends.data?.labels || []).map((label, i) => ({
    label,
    cancellations: trends.data?.cancellations[i] || 0,
    refunds: trends.data?.refunds[i] || 0,
    refundAmounts: trends.data?.refundAmounts[i] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/dashboard" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Advanced Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Cancellation trends, inventory valuation, payment health, and coupon performance.
        </p>
      </div>

      {/* Date Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-neutral-500 uppercase">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-neutral-500 uppercase">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
          />
        </div>
      </div>

      {/* Cancellation & Refund Trends */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Cancellation & Refund Trends (12 mo)</h2>
        {trendData.length > 0 ? (
          <div className="h-80 w-full">
            <TrendsChart data={trendData} />
          </div>
        ) : (
          <EmptyState title="No Trend Data" description="No cancellations or refunds recorded in the last 12 months." />
        )}
      </div>

      {/* Inventory Valuation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-4">Inventory Valuation</h2>
          <div className="mb-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Valuation</p>
            <h3 className="text-2xl font-bold text-neutral-950 mt-1">
              {formatCurrency(valuation.data?.totalValuation || 0)}
            </h3>
          </div>
          {valuation.data?.byProduct && valuation.data.byProduct.length > 0 ? (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {valuation.data.byProduct.map((p, i) => (
                    <tr key={`${p.name}-${i}`}>
                      <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[160px]">{p.name}</td>
                      <td className="py-2.5">{p.quantity}</td>
                      <td className="py-2.5">{formatCurrency(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No Inventory" description="No tracked inventory found." />
          )}
        </div>

        {/* Warehouse Stock Distribution */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 mb-4">Warehouse Stock Distribution</h2>
          {warehouse.data && warehouse.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="py-2">Warehouse</th>
                    <th className="py-2">Total Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {warehouse.data.map((w) => (
                    <tr key={w.warehouseId}>
                      <td className="py-2.5 font-medium text-neutral-900">{w.warehouseName}</td>
                      <td className="py-2.5">{w.totalStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No Warehouses" description="No warehouse stock data found." />
          )}
        </div>
      </div>

      {/* Payment Status Distribution */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Payment Status Distribution</h2>
        {payments.data && payments.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Status</th>
                  <th className="py-2">Count</th>
                  <th className="py-2">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {payments.data.map((p) => (
                  <tr key={p.status}>
                    <td className="py-2.5 font-medium text-neutral-900">{p.status}</td>
                    <td className="py-2.5">{p.count}</td>
                    <td className="py-2.5">{formatCurrency(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No Payments" description="No payment data for the selected range." />
        )}
      </div>

      {/* Coupon Usage Summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Coupon Usage Summary</h2>
        <div className="mb-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Discount</p>
          <h3 className="text-2xl font-bold text-neutral-950 mt-1">
            {formatCurrency(coupons.data?.totalDiscount || 0)}
          </h3>
          <p className="text-[11px] text-neutral-400">{coupons.data?.totalUsage || 0} uses</p>
        </div>
        {coupons.data?.topCoupons && coupons.data.topCoupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Code</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Uses</th>
                  <th className="py-2">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {coupons.data.topCoupons.map((c) => (
                  <tr key={c.couponId}>
                    <td className="py-2.5 font-medium text-neutral-900">{c.code}</td>
                    <td className="py-2.5">{c.name}</td>
                    <td className="py-2.5">{c.usageCount}</td>
                    <td className="py-2.5">{formatCurrency(c.totalDiscount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No Coupon Usage" description="No coupons used in the selected range." />
        )}
      </div>
    </div>
  );
}
