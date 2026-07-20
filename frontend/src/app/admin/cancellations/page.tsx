'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderList } from '@/features/orders/order.hooks';
import { useCancellationDetail, useUpdateCancellation } from '@/features/cancellations/cancellation.hooks';
import { CancellationResponse } from '@/features/cancellations/cancellation.types';
import { CancellationStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Eye, Edit3, X, RefreshCw, Ban } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

export default function CancellationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const page = parseInt(searchParams.get('page') || '1');

  // Load orders that are cancelled
  const { data: listData, isLoading, isError, refetch } = useOrderList({
    page,
    limit: 10,
    status: 'CANCELLED',
  });

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/cancellations?${params.toString()}`);
  };

  const isEditor = !!user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Cancellation Ledger</h1>
          <p className="text-xs text-neutral-400 mt-1">Review cancelled order claims, update payment gateways refund statuses, and document remarks.</p>
        </div>
      </div>

      {/* Main list */}
      {isLoading ? (
        <SectionLoader message="Retrieving cancelled orders queue..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not load cancelled orders list." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4 text-right">Items Count</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900">{ord.orderNumber}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500 truncate max-w-[150px]">{ord.customerId}</td>
                    <td className="p-4 text-neutral-600">{formatDate(ord.createdAt)}</td>
                    <td className="p-4 text-center font-semibold">{ord.items?.length || 0}</td>
                    <td className="p-4 text-right font-mono font-bold text-neutral-950">₹{ord.grandTotal}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveOrderId(ord.id);
                            setActiveOrderNumber(ord.orderNumber);
                            setIsEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-2xs bg-neutral-900 text-white font-bold px-2.5 py-1 rounded transition hover:bg-neutral-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Manage Request
                        </button>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                      No cancelled orders in the registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', page - 1)}
                  className="px-3 py-1.5 border border-neutral-200 bg-white text-xs font-semibold rounded-lg hover:border-neutral-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="px-3 py-1.5 border border-neutral-200 bg-white text-xs font-semibold rounded-lg hover:border-neutral-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Cancellation Dialog */}
      {isEditOpen && activeOrderId && (
        <ManageCancellationDialog
          orderId={activeOrderId}
          orderNumber={activeOrderNumber}
          isEditor={isEditor}
          onClose={() => {
            setIsEditOpen(false);
            setActiveOrderId(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Inner helper component to query and manage cancellation request
function ManageCancellationDialog({
  orderId,
  orderNumber,
  isEditor,
  onClose,
  onSuccess,
}: {
  orderId: string;
  orderNumber: string;
  isEditor: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: cancellation, isLoading, isError } = useCancellationDetail(orderId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
          <SectionLoader message="Fetching request metrics..." />
        </div>
      </div>
    );
  }

  if (isError || !cancellation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
          <div className="py-6 text-center text-xs text-red-500 font-semibold space-y-2">
            <Ban className="w-8 h-8 text-red-400 mx-auto" />
            <p>No cancellation request details found for this order on the server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CancellationForm
      key={cancellation.id}
      cancellation={cancellation}
      orderNumber={orderNumber}
      isEditor={isEditor}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function CancellationForm({
  cancellation,
  orderNumber,
  isEditor,
  onClose,
  onSuccess,
}: {
  cancellation: CancellationResponse;
  orderNumber: string;
  isEditor: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState(cancellation.adminNotes || '');
  const [refundStatus, setRefundStatus] = useState(cancellation.refundStatus || 'PENDING');

  const updateMut = useUpdateCancellation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateMut.mutateAsync({
        id: cancellation.id,
        orderId: cancellation.orderId,
        dto: {
          adminNotes: adminNotes || undefined,
          refundStatus: refundStatus || undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to update cancellation request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Manage Cancellation Request</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Order Ref: {orderNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-bold">{error}</div>}

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 text-xs">
            <div className="flex justify-between">
                <span className="text-neutral-500">Reason:</span>
                <span className="font-semibold text-neutral-900">{cancellation.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Submitted status:</span>
                <CancellationStatusBadge status={cancellation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Created At:</span>
                <span className="text-neutral-600">{formatDate(cancellation.createdAt)}</span>
              </div>
            </div>

            {/* Refund status select */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Refund status</label>
              <select
                disabled={!isEditor || updateMut.isPending}
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="REFUNDED">REFUNDED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            {/* Admin notes */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Admin Notes</label>
              <textarea
                disabled={!isEditor || updateMut.isPending}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Write logs about payment gateway operations..."
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
              >
                Cancel
              </button>
              {isEditor && (
                <button
                  type="submit"
                  disabled={updateMut.isPending}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
                >
                  {updateMut.isPending && <ButtonLoader />} Save Changes
                </button>
              )}
            </div>
          </form>
      </div>
    </div>
  );
}
