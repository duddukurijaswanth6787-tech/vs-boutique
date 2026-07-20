'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInvoiceDetail } from '@/features/invoices/invoice.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { ChevronLeft, FileText } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(id);

  if (isLoading) return <SectionLoader message="Loading invoice details..." />;
  if (isError || !invoice) return <PageError title="Invoice not found" message="Could not load invoice details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/invoices" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Invoice {invoice.invoiceNumber ?? ''}</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(invoice.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Amount</h3>
          <p className="text-lg font-bold text-neutral-900">{formatMoney(invoice.grandTotal)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Order</h3>
          <p className="text-sm font-medium">{invoice.orderId ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${invoice.status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}
          `}>{invoice.status ?? 'PENDING'}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Details</h3>
        <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(invoice, null, 2)}</pre>
      </div>
    </div>
  );
}
