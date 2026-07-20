'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { ChevronLeft, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function CancellationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cancellation, isLoading, isError, refetch } = useQuery({
    queryKey: ['cancellation', id],
    queryFn: async () => { const res = await apiClient.get(`/cancellations/${id}`); return res.data.data; },
    enabled: !!id,
  });

  if (isLoading) return <SectionLoader message="Loading cancellation details..." />;
  if (isError || !cancellation) return <PageError title="Cancellation not found" message="Could not load cancellation details." retry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/cancellations" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Cancellation</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(cancellation.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className="text-sm font-bold text-neutral-900">{cancellation.status ?? '—'}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Reason</h3>
          <p className="text-sm text-neutral-700">{cancellation.reason ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Details</h3>
        <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(cancellation, null, 2)}</pre>
      </div>
    </div>
  );
}
