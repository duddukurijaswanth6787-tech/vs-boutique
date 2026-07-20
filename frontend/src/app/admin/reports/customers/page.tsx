'use client';

import React from 'react';
import { useCustomerReport } from '@/features/reports';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface CustomerReportItem {
  id: string;
  phone?: string;
  orderCount?: number;
  totalSpent?: number;
  user?: { firstName?: string; lastName?: string; email?: string };
}

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CustomerReportPage() {
  const { data, isLoading, error, refetch } = useCustomerReport();

  if (isLoading) return <SectionLoader message="Generating customer report..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch customer report." retry={refetch} />;

  const reportData =
    (data?.data as { totalCustomers: number; customers: CustomerReportItem[] }) ||
    { totalCustomers: 0, customers: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/reports" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Report Center
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customer Directory Report</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review customer list, registered email profiles, order counts, and total spending.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="border-b pb-4 mb-4 flex justify-between items-center text-xs text-neutral-500 uppercase font-semibold">
          <span>Report Output ({reportData.totalCustomers} Customers)</span>
        </div>

        {reportData.customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Client Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Order Count</th>
                  <th className="py-2">Total Amount Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {reportData.customers.map((c: CustomerReportItem) => (
                  <tr key={c.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">
                      {c.user?.firstName || 'Guest'} {c.user?.lastName || ''}
                    </td>
                    <td className="py-2.5 text-neutral-500">{c.user?.email || 'N/A'}</td>
                    <td className="py-2.5">{c.phone || 'N/A'}</td>
                    <td className="py-2.5">{c.orderCount} orders</td>
                    <td className="py-2.5 font-semibold text-neutral-950">{formatCurrency(c.totalSpent ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-neutral-450">
            No customers registered.
          </div>
        )}
      </div>
    </div>
  );
}
