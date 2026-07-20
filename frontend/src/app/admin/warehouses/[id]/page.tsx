'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWarehouseDetail } from '@/features/warehouse/warehouse.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { ChevronLeft, MapPin } from 'lucide-react';

export default function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: warehouse, isLoading, isError, refetch } = useWarehouseDetail(id);

  if (isLoading) return <SectionLoader message="Loading warehouse details..." />;
  if (isError || !warehouse) return <PageError title="Warehouse not found" message="Could not load warehouse details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/warehouses" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{warehouse.name}</h1>
          <p className="text-xs text-neutral-500">Created {formatDateTime(warehouse.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-neutral-400" /><span>{warehouse.address ?? '—'}</span></div>
            <p className="text-xs text-neutral-500">Code: {warehouse.code ?? '—'}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${warehouse.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
          `}>{warehouse.status ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
