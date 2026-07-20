'use client';

import React from 'react';
import Link from 'next/link';
import { useOrderList } from '@/features/orders/order.hooks';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { Eye } from 'lucide-react';

export default function StaffPackingPage() {
  const { data, isLoading, isError, refetch } = useOrderList({ page: 1, limit: 50, status: 'PROCESSING' });

  if (isLoading) return <SectionLoader message="Loading packing queue..." />;
  if (isError) return <PageError title="Load Failure" message="Could not load packing queue." retry={refetch} />;

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Packing Queue</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Orders ready for packing and dispatch</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900">#{order.orderNumber}</td>
                    <td className="p-4">
                      <span className="font-medium text-neutral-900">{order.customerName ?? '—'}</span>
                      <p className="text-[10px] text-neutral-400">{order.customerEmail ?? ''}</p>
                    </td>
                    <td className="p-4">{order.items?.length ?? 0} items</td>
                    <td className="p-4 font-bold">{formatMoney(order.grandTotal)}</td>
                    <td className="p-4 text-neutral-400">{formatDateTime(order.createdAt)}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm inline-flex" aria-label={`View order ${order.orderNumber}`}>
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="Queue Empty" description="No orders are currently awaiting packing." />
          </div>
        )}
      </div>
    </div>
  );
}
