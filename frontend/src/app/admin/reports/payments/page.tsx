'use client';

import React, { useState } from 'react';
import { usePaymentReport } from '@/features/reports';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface PaymentReportItem {
  id: string;
  method?: string;
  status?: string;
  amount?: number;
  createdAt?: string;
  order?: { orderNumber?: string };
}

const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function PaymentReportPage() {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [startDateStr, setStartDateStr] = useState(defaultStart);
  const [endDateStr, setEndDateStr] = useState(defaultEnd);

  const { data, isLoading, error, refetch } = usePaymentReport(startDateStr, endDateStr);

  const reportData =
    (data?.data as { totalPayments: number; totalAmount: number; payments: PaymentReportItem[] }) ||
    { totalPayments: 0, totalAmount: 0, payments: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/reports" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Report Center
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Payment Transactions Report</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Audit processed payments, methods, and settlement statuses.
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
        <SectionLoader message="Generating payment report..." />
      ) : error ? (
        <PageError title="Generation Failed" message="Could not create report." retry={refetch} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Payments
              </p>
              <h4 className="text-xl font-bold text-neutral-950 mt-1">{reportData.totalPayments}</h4>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Amount
              </p>
              <h4 className="text-xl font-bold text-neutral-950 mt-1">
                {formatCurrency(reportData.totalAmount)}
              </h4>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="border-b pb-4 mb-4 flex justify-between items-center text-xs text-neutral-500 uppercase font-semibold">
              <span>Payments ({reportData.payments.length})</span>
            </div>

            {reportData.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                      <th className="py-2">Order No</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 text-neutral-700">
                    {reportData.payments.map((p: PaymentReportItem) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-medium text-neutral-900">
                          {p.order?.orderNumber || 'N/A'}
                        </td>
                        <td className="py-2.5">{p.method}</td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                            ${p.status === 'SUCCEEDED' && 'bg-green-50 text-green-700 border border-green-100'}
                            ${p.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                            ${p.status === 'FAILED' && 'bg-red-50 text-red-700 border border-red-100'}
                            ${!['SUCCEEDED', 'PENDING', 'FAILED'].includes(p.status ?? '') && 'bg-neutral-50 text-neutral-700 border border-neutral-100'}
                          `}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5">{formatCurrency(p.amount ?? 0)}</td>
                        <td className="py-2.5 text-neutral-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400">No payments found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
