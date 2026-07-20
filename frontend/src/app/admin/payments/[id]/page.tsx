'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePaymentDetail } from '@/features/payments/payment.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { ChevronLeft, CreditCard } from 'lucide-react';

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: payment, isLoading, isError, refetch } = usePaymentDetail(id);

  if (isLoading) return <SectionLoader message="Loading payment details..." />;
  if (isError || !payment) return <PageError title="Payment not found" message="Could not load payment details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/payments" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Payment</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(payment.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Amount</h3>
          <p className="text-lg font-bold text-neutral-900">{formatMoney(payment.amount)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Method</h3>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium">{payment.method ?? '—'}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${payment.status === 'CAPTURED' || payment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' : payment.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}
          `}>{payment.status}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Details</h3>
        <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(payment, null, 2)}</pre>
      </div>
    </div>
  );
}
