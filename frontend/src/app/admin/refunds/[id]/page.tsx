'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRefundDetail } from '@/features/refunds/refund.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { ChevronLeft } from 'lucide-react';

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: refund, isLoading, isError, refetch } = useRefundDetail(id);

  if (isLoading) return <SectionLoader message="Loading refund details..." />;
  if (isError || !refund) return <PageError title="Refund not found" message="Could not load refund details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/refunds" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Refund</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(refund.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Amount</h3>
          <p className="text-lg font-bold text-neutral-900">{formatMoney(refund.amount ?? 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Order</h3>
          <p className="text-sm font-medium">{refund.orderId ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${refund.status === 'COMPLETED' || refund.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}
          `}>{refund.status ?? 'PENDING'}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Details</h3>
        <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(refund, null, 2)}</pre>
      </div>
    </div>
  );
}
