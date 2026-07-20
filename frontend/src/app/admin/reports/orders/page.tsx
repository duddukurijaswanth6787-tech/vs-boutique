'use client';

import React, { useState } from 'react';
import { useOrderReport } from '@/features/reports';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface OrderReportItem {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items?: { productName?: string; quantity?: number }[];
}

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function OrderReportPage() {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [startDateStr, setStartDateStr] = useState(defaultStart);
  const [endDateStr, setEndDateStr] = useState(defaultEnd);

  const { data, isLoading, error, refetch } = useOrderReport(startDateStr, endDateStr);

  const reportData =
    (data?.data as {
      totalOrders: number;
      statusBreakdown: Record<string, number>;
      orders: OrderReportItem[];
    }) || { totalOrders: 0, statusBreakdown: {}, orders: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/reports" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Report Center
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Order Status Report</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review status distributions, tracking codes, and item breakdowns.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-neutral-500 uppercase">Start Date</label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-neutral-500 uppercase">End Date</label>
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            className="text-xs border border-neutral-250 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs font-bold text-white bg-neutral-950 rounded px-4 py-2 hover:bg-neutral-850 transition shadow-sm"
        >
          Generate
        </button>
      </div>

      {isLoading ? (
        <SectionLoader message="Generating order report..." />
      ) : error ? (
        <PageError title="Generation Failed" message="Could not create report." retry={refetch} />
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="border-b pb-4 mb-4 flex justify-between items-center text-xs text-neutral-500 uppercase font-semibold">
            <span>Report Output ({reportData.totalOrders} Orders)</span>
          </div>

          {reportData.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="py-2">Order No</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Items Breakdown</th>
                    <th className="py-2">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {reportData.orders.map((o: OrderReportItem) => (
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
                      <td className="py-2.5 text-neutral-500 truncate max-w-[200px]">
                        {(o.items || []).map((i: { productName?: string; quantity?: number }) => `${i.productName} (x${i.quantity})`).join(', ') || 'No items'}
                      </td>
                      <td className="py-2.5 text-neutral-450">
                        {new Date(o.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-neutral-450">
              No orders found inside this date range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
