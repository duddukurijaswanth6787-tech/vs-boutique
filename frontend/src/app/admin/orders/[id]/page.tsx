'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderDetail } from '@/features/orders/order.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { ChevronLeft, Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);

  if (isLoading) return <SectionLoader message="Loading order details..." />;
  if (isError || !order) return <PageError title="Order not found" message="Could not load order details." retry={refetch} />;

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4 text-amber-600" />,
    PROCESSING: <Package className="w-4 h-4 text-indigo-600" />,
    SHIPPED: <Truck className="w-4 h-4 text-blue-600" />,
    DELIVERED: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    CANCELLED: <XCircle className="w-4 h-4 text-red-600" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Order #{order.orderNumber}</h1>
          <p className="text-xs text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <div className="flex items-center gap-2">
            {statusIcons[order.status] ?? <Package className="w-4 h-4" />}
            <span className="text-sm font-bold text-neutral-900">{order.status}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Customer</h3>
          <p className="text-sm font-bold text-neutral-900">{order.customerName ?? '—'}</p>
          <p className="text-xs text-neutral-500">{order.customerEmail ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Total</h3>
          <p className="text-lg font-bold text-neutral-900">{formatMoney(order.grandTotal)}</p>
          <p className="text-xs text-neutral-500">{order.items?.length ?? 0} items</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-medium">{formatMoney(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span className="font-medium text-green-600">-{formatMoney(order.discountTotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span className="font-medium">{formatMoney(order.taxTotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-medium">{formatMoney(order.shippingCharge)}</span></div>
          <div className="flex justify-between border-t border-neutral-100 pt-2"><span className="font-bold text-neutral-900">Grand Total</span><span className="font-bold text-neutral-900">{formatMoney(order.grandTotal)}</span></div>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Items</h3>
          <div className="space-y-3">
            {order.items.map((item: { productName?: string; sku?: string; quantity: number; unitPrice: number; totalPrice: number }, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2 last:border-0">
                <div>
                  <span className="font-medium text-neutral-900">{item.productName ?? `Item ${i + 1}`}</span>
                  <span className="text-neutral-400 ml-2">× {item.quantity}</span>
                </div>
                <span className="font-medium">{formatMoney(item.totalPrice ?? item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.timeline && order.timeline.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Timeline</h3>
          <div className="space-y-3">
            {order.timeline.map((t: { id: string; status: string; note?: string; createdAt: string; staffName?: string }) => (
              <div key={t.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-neutral-900">{t.status}</span>
                  {t.note && <span className="text-neutral-500 ml-2">— {t.note}</span>}
                  <p className="text-[10px] text-neutral-400">{formatDateTime(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
