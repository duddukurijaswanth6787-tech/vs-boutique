'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvoiceList } from '@/features/invoices/invoice.hooks';
import { InvoiceStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { Eye, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL States
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';

  // Query
  const { data: listData, isLoading, isError, refetch } = useInvoiceList({
    page,
    limit: 10,
    status: status || undefined,
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/invoices?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Invoices Archive</h1>
          <p className="text-xs text-neutral-400 mt-1">Review legal customer invoices, check billing tax information, and download invoice records.</p>
        </div>
      </div>

      {/* Filter options */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500 font-sans">Filters:</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={status}
            onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving invoices stack..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not fetch invoices from database." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Invoice Number</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Tax Total</th>
                  <th className="p-4 text-right">Discount</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900">{inv.invoiceNumber}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500 truncate max-w-[155px]" title={inv.orderId}>
                      {inv.orderId}
                    </td>
                    <td className="p-4 text-neutral-600">{formatDate(inv.createdAt)}</td>
                    <td className="p-4 text-right font-mono font-semibold">{formatMoney(inv.taxTotal, inv.currency)}</td>
                    <td className="p-4 text-right font-mono text-red-500">-{formatMoney(inv.discountTotal, inv.currency)}</td>
                    <td className="p-4 text-right font-mono font-bold text-neutral-950">{formatMoney(inv.grandTotal, inv.currency)}</td>
                    <td className="p-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Slip
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-400 font-medium">
                      No invoices found in registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', page - 1)}
                  className="px-3 py-1.5 border border-neutral-200 bg-white text-xs font-semibold rounded-lg hover:border-neutral-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="px-3 py-1.5 border border-neutral-200 bg-white text-xs font-semibold rounded-lg hover:border-neutral-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
