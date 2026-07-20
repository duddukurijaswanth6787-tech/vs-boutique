'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRefundList, useUpdateRefundStatus } from '@/features/refunds/refund.hooks';
import { RefundStatus, RefundResponse } from '@/features/refunds/refund.types';
import { RefundStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Eye, Edit3, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

export default function RefundsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL Query States
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';

  // Query
  const { data: listData, isLoading, isError, refetch } = useRefundList({
    page,
    limit: 10,
    status: status || undefined,
  });

  const [activeRefund, setActiveRefund] = useState<RefundResponse | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/refunds?${params.toString()}`);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Refund Claims desk</h1>
          <p className="text-xs text-neutral-400 mt-1">Audit order refund payouts, track payment gateway references, and approve transactions.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500 font-sans">Filters:</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={status}
            onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving refunds ledger..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not fetch refunds from server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Refund Number</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((ref) => (
                  <tr key={ref.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900">{ref.refundNumber}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500 truncate max-w-[120px]" title={ref.orderId}>
                      {ref.orderId}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500 truncate max-w-[120px]" title={ref.paymentId}>
                      {ref.paymentId}
                    </td>
                    <td className="p-4 text-neutral-600 font-semibold text-2xs uppercase">{ref.method || 'Razorpay'}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-400">
                      {ref.transactionId || <span className="text-neutral-300">N/A</span>}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-neutral-900">₹{ref.amount}</td>
                    <td className="p-4 text-neutral-600">{formatDate(ref.createdAt)}</td>
                    <td className="p-4">
                      <RefundStatusBadge status={ref.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveRefund(ref);
                              setIsEditOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-2xs bg-neutral-900 text-white font-bold px-2.5 py-1 rounded transition hover:bg-neutral-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Override
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${ref.orderId}`}
                          className="inline-flex items-center gap-1 text-2xs bg-neutral-150 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-400 font-medium">
                      No refund records found.
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

      {/* Edit Refund Dialog */}
      {isEditOpen && activeRefund && (
        <ManageRefundDialog
          refund={activeRefund}
          onClose={() => {
            setIsEditOpen(false);
            setActiveRefund(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Inner helper component to manage refund details
function ManageRefundDialog({
  refund,
  onClose,
  onSuccess,
}: {
  refund: RefundResponse;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState(refund.adminNotes || '');
  const [transactionId, setTransactionId] = useState(refund.transactionId || '');
  const [refundStatus, setRefundStatus] = useState<RefundStatus>(refund.status);

  const updateMut = useUpdateRefundStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateMut.mutateAsync({
        id: refund.id,
        dto: {
          status: refundStatus,
          adminNotes: adminNotes || undefined,
          transactionId: transactionId || undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to update refund status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Manage Refund claim</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Refund Ref: {refund.refundNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-bold">{error}</div>}

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Refund Amount:</span>
              <span className="font-bold text-neutral-900">₹{refund.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Reason:</span>
              <span className="font-semibold text-neutral-850">{refund.reason}</span>
            </div>
          </div>

          {/* Refund Status */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Claim Status</label>
            <select
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value as RefundStatus)}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
            >
              <option value="REQUESTED">REQUESTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. rfnd_P1dG684H2j9z"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
            />
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Record gateway refund settlement details..."
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
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="bg-neutral-900 hover:bg-neutral-850 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm flex items-center"
            >
              {updateMut.isPending && <ButtonLoader />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
