'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInventoryMovements } from '@/features/inventory/inventory.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { Search, ChevronLeft, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/utils/format';

export default function StockMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query State
  const page = parseInt(searchParams.get('page') || '1');
  const movementType = searchParams.get('movementType') || '';
  const inventoryId = searchParams.get('inventoryId') || '';

  const { data: listData, isLoading, isError, refetch } = useInventoryMovements({
    page,
    limit: 15,
    movementType: movementType || undefined,
    inventoryId: inventoryId || undefined,
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/inventory/movements?${params.toString()}`);
  };

  const isPositiveMovement = (type: string) => {
    return ['INCREASE', 'ADJUST_UP', 'RETURN', 'RELEASE'].includes(type.toUpperCase()) || type.toUpperCase().includes('IN');
  };

  const isNegativeMovement = (type: string) => {
    return ['DECREASE', 'ADJUST_DOWN', 'DAMAGE', 'RESERVE'].includes(type.toUpperCase()) || type.toUpperCase().includes('OUT') || type.toUpperCase().includes('DEDUCT');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/inventory" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Stock Movements Audit Ledger</h1>
            <p className="text-xs text-neutral-400 mt-1">Audit trail tracking every stock allocation, release, deduction, or damage event.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500">Filters:</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={movementType}
            onChange={(e) => updateQuery('movementType', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Movement Types</option>
            <option value="INCREASE">INCREASE</option>
            <option value="DECREASE">DECREASE</option>
            <option value="ADJUST">ADJUST</option>
            <option value="RESERVE">RESERVE</option>
            <option value="RELEASE">RELEASE</option>
            <option value="RETURN">RETURN</option>
            <option value="DAMAGE">DAMAGE</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <SectionLoader message="Retrieving stock movement ledger..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not fetch stock movement log details." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Timestamp & ID</th>
                  <th className="p-4">Variant ID</th>
                  <th className="p-4">Movement Type</th>
                  <th className="p-4 text-center">Qty Change</th>
                  <th className="p-4 text-center">Previous Qty</th>
                  <th className="p-4 text-center">New Qty</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Reason / Remarks</th>
                  <th className="p-4">Operator ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((m) => {
                  const positive = isPositiveMovement(m.movementType);
                  const negative = isNegativeMovement(m.movementType);
                  
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-neutral-900">{formatDateTime(m.createdAt)}</div>
                        <div className="text-[9px] text-neutral-400 font-mono mt-0.5">{m.id}</div>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-neutral-600">{m.variantId}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase
                          ${positive && 'bg-green-50 text-green-700 border border-green-100'}
                          ${negative && 'bg-red-50 text-red-700 border border-red-100'}
                          ${!positive && !negative && 'bg-neutral-50 text-neutral-600 border border-neutral-100'}
                        `}>
                          {positive && <ArrowUpRight className="w-3 h-3" />}
                          {negative && <ArrowDownLeft className="w-3 h-3" />}
                          {m.movementType}
                        </span>
                      </td>
                      <td className={`p-4 text-center font-bold text-sm
                        ${positive && 'text-green-600'}
                        ${negative && 'text-red-600'}
                        ${!positive && !negative && 'text-neutral-900'}
                      `}>
                        {positive ? `+${m.quantity}` : negative ? `-${m.quantity}` : m.quantity}
                      </td>
                      <td className="p-4 text-center font-mono text-neutral-500">{m.previousQuantity}</td>
                      <td className="p-4 text-center font-mono text-neutral-900 font-bold">{m.newQuantity}</td>
                      <td className="p-4">
                        {m.referenceType ? (
                          <div>
                            <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-neutral-500">
                              {m.referenceType}
                            </span>
                            <div className="text-[9px] font-mono mt-1 text-neutral-400 truncate max-w-[120px]" title={m.referenceId}>
                              {m.referenceId}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-neutral-800">{m.reason || 'N/A'}</div>
                        {m.remarks && <div className="text-[10px] text-neutral-400 mt-0.5">{m.remarks}</div>}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-neutral-400 truncate max-w-[100px]" title={m.performedBy}>
                        {m.performedBy || 'System'}
                      </td>
                    </tr>
                  );
                })}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-400 font-medium">
                      No stock movement audit records found.
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
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
