'use client';

import React from 'react';
import { useDashboardSummary } from '@/features/dashboard';
import { Package, Award, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function ProductAnalyticsPage() {
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();

  if (isLoading) return <SectionLoader message="Loading product catalog performance..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch product catalog details." retry={refetch} />;

  const topProducts = summary?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Product Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor product demand, top categories, and sales performance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-purple-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Catalog Size</span>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{summary?.totalProducts || 0} Products</h3>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Best Seller Hits</span>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{topProducts.length} Highlighted</h3>
          </div>
        </div>
      </div>

      {/* Top Products Performance Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-bold text-neutral-900">Performance Leaderboard</h3>
        </div>
        
        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Product Name</th>
                  <th className="py-2">SKU ID</th>
                  <th className="py-2">Quantity Sold</th>
                  <th className="py-2">Total Value Generated</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {topProducts.map((item, index) => {
                  return (
                    <tr key={item.productId} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-normal w-4">#{index + 1}</span>
                          <span className="truncate max-w-[200px]">{item.product?.name || 'Unknown Product'}</span>
                        </div>
                      </td>
                      <td className="py-3 text-neutral-500 font-mono">
                        {item.productId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 font-medium text-neutral-900">
                        {item._sum.quantity || 0} units
                      </td>
                      <td className="py-3 text-neutral-950 font-semibold">
                        {formatCurrency(item._sum.totalPrice || 0)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/catalog/products?search=${encodeURIComponent(item.product?.name || '')}`}
                          className="text-[11px] font-bold text-neutral-950 hover:underline"
                        >
                          View Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-xs text-neutral-400">No product sales records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
