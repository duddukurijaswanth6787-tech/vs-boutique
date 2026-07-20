'use client';

import React from 'react';

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

// 1. Stock Status Badge
export function StockStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'IN_STOCK':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">In Stock</Badge>;
    case 'LOW_STOCK':
      return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">Low Stock</Badge>;
    case 'OUT_OF_STOCK':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Out of Stock</Badge>;
    case 'BACKORDER':
      return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Backorder</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 2. Order Status Badge
export function OrderStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge>;
    case 'CONFIRMED':
      return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Confirmed</Badge>;
    case 'PROCESSING':
      return <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">Processing</Badge>;
    case 'PACKING':
      return <Badge className="bg-purple-50 text-purple-700 border border-purple-200">Packing</Badge>;
    case 'READY_TO_SHIP':
      return <Badge className="bg-violet-50 text-violet-700 border border-violet-200">Ready to Ship</Badge>;
    case 'SHIPPED':
      return <Badge className="bg-cyan-50 text-cyan-700 border border-cyan-200">Shipped</Badge>;
    case 'OUT_FOR_DELIVERY':
      return <Badge className="bg-teal-50 text-teal-700 border border-teal-200">Out for Delivery</Badge>;
    case 'DELIVERED':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Delivered</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Cancelled</Badge>;
    case 'RETURN_REQUESTED':
      return <Badge className="bg-rose-50 text-rose-700 border border-rose-200">Return Requested</Badge>;
    case 'RETURN_APPROVED':
      return <Badge className="bg-orange-50 text-orange-700 border border-orange-200">Return Approved</Badge>;
    case 'RETURN_REJECTED':
      return <Badge className="bg-stone-50 text-stone-600 border border-stone-200">Return Rejected</Badge>;
    case 'RETURN_COMPLETED':
      return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Return Completed</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 3. Return Status Badge
export function ReturnStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'REQUESTED':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Requested</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Rejected</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Completed</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 4. Cancellation Status Badge
export function CancellationStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge>;
    case 'APPROVED':
    case 'SUCCESS':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Rejected</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 5. Payment Status Badge
export function PaymentStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'PENDING':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge>;
    case 'COMPLETED':
    case 'SUCCESS':
    case 'CAPTURED':
    case 'PAID':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Paid</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Failed</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Refunded</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 6. Refund Status Badge
export function RefundStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'REQUESTED':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Requested</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Rejected</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Completed</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}

// 7. Invoice Status Badge
export function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return <Badge className="bg-green-50 text-green-700 border border-green-200">Paid</Badge>;
    case 'UNPAID':
      return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Unpaid</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-red-50 text-red-700 border border-red-200">Cancelled</Badge>;
    default:
      return <Badge className="bg-neutral-50 text-neutral-600 border border-neutral-200">{status || 'Unknown'}</Badge>;
  }
}
