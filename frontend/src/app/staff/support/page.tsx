'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StaffSupportPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => { const res = await apiClient.get('/support/tickets'); return res.data.data; },
  });

  if (isLoading) return <SectionLoader message="Loading support tickets..." />;
  if (isError) return <PageError title="Load Failure" message="Could not load support tickets." retry={refetch} />;

  const tickets = data?.data ?? data ?? [];

  const statusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'RESOLVED': case 'CLOSED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Support Desk</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Customer issues and support tickets</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
        {tickets.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {tickets.map((ticket: any) => (
              <div key={ticket.id} className="p-4 hover:bg-neutral-50/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(ticket.status)}
                  <div>
                    <span className="text-xs font-bold text-neutral-900">{ticket.subject ?? ticket.title ?? 'Ticket'}</span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{ticket.customerEmail ?? '—'} · {formatDateTime(ticket.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {ticket.status ?? 'OPEN'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="No Tickets" description="No support tickets at this time." />
          </div>
        )}
      </div>
    </div>
  );
}
