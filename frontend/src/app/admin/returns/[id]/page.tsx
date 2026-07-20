'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReturnDetail } from '@/features/returns/return.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { ChevronLeft, RotateCcw } from 'lucide-react';

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ret, isLoading, isError, refetch } = useReturnDetail(id);

  if (isLoading) return <SectionLoader message="Loading return details..." />;
  if (isError || !ret) return <PageError title="Return not found" message="Could not load return details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/returns" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Return Request</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(ret.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className="text-sm font-bold text-neutral-900">{ret.status ?? '—'}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Order</h3>
          <p className="text-sm font-medium">{ret.orderId ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Reason</h3>
          <p className="text-sm text-neutral-700">{ret.reason ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Details</h3>
        <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(ret, null, 2)}</pre>
      </div>
    </div>
  );
}
