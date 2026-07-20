'use client';

import React from 'react';
import { useCustomerReport } from '@/features/reports';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface CustomerReportItem {
  id: string;
  userId?: string;
  totalSpent?: number;
  orderCount?: number;
  user?: { firstName?: string; lastName?: string; email?: string };
}

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CustomerAnalyticsPage() {
  const { data, isLoading, error, refetch } = useCustomerReport();

  if (isLoading) return <SectionLoader message="Loading customer statistics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch customer report." retry={refetch} />;

  const reportData =
    (data?.data as { totalCustomers: number; customers: CustomerReportItem[] }) ||
    { totalCustomers: 0, customers: [] };

  // Calculate average customer spend
  const customersList = reportData.customers || [];
  const totalRevenue = customersList.reduce((acc: number, cur: CustomerReportItem) => acc + Number(cur.totalSpent || 0), 0);
  const avgCustomerSpend = reportData.totalCustomers > 0 ? totalRevenue / reportData.totalCustomers : 0;

  // Sort by spent descending for leaderboard
  const topCustomers = [...customersList].sort((a: CustomerReportItem, b: CustomerReportItem) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0)).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customer Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Evaluate customer metrics, spending habits, and top buyer accounts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Clients</span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalCustomers} Accounts</h3>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Cumulative Spend</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{formatCurrency(totalRevenue)}</h3>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Avg Spend / Client</span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{formatCurrency(avgCustomerSpend)}</h3>
        </div>
      </div>

      {/* Top Customer Accounts Leaderboard */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Spending Customers Leaderboard</h3>
        {topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Client Name</th>
                  <th className="py-2">Contact Info</th>
                  <th className="py-2">Orders Count</th>
                  <th className="py-2">Total Value Purchased</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {topCustomers.map((c: CustomerReportItem) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 font-semibold text-neutral-900">
                      {c.user?.firstName || 'Guest'} {c.user?.lastName || ''}
                    </td>
                    <td className="py-3 text-neutral-500">{c.user?.email || 'N/A'}</td>
                    <td className="py-3">{c.orderCount} orders</td>
                    <td className="py-3 text-neutral-950 font-bold">{formatCurrency(c.totalSpent ?? 0)}</td>
                    <td className="py-3 text-right">
                      {/* Check if user exists on the parent profile to link correctly */}
                      <Link
                        href={`/admin/customers/${c.userId || c.id}`}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        Inspect Account
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">No customer transactions recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
