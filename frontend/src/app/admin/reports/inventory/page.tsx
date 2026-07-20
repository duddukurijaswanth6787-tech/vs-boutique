'use client';

import React from 'react';
import { useInventoryReport } from '@/features/reports';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface InventoryReportItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  stockStatus: string;
  variant?: { product?: { name?: string }; title?: string; sku?: string };
}

export default function InventoryReportPage() {
  const { data, isLoading, error, refetch } = useInventoryReport();

  if (isLoading) return <SectionLoader message="Generating inventory report..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch inventory report." retry={refetch} />;

  const reportData =
    (data?.data as {
      totalItems: number;
      lowStock: number;
      outOfStock: number;
      items: InventoryReportItem[];
    }) || { totalItems: 0, lowStock: 0, outOfStock: 0, items: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/reports" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Report Center
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory Report</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Displays current stock levels across all registered product variants.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="border-b pb-4 mb-4 flex justify-between items-center text-xs text-neutral-500 uppercase font-semibold">
          <span>Report Output ({reportData.totalItems} Items)</span>
        </div>

        {reportData.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Product Name</th>
                  <th className="py-2">SKU ID</th>
                  <th className="py-2">Warehouse Quantity</th>
                  <th className="py-2">Reserved Quantity</th>
                  <th className="py-2">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {reportData.items.map((item: InventoryReportItem) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">
                      {item.variant?.product?.name || 'Product'} {item.variant?.title && `(${item.variant.title})`}
                    </td>
                    <td className="py-2.5 font-mono text-neutral-500">{item.variant?.sku || 'SKU'}</td>
                    <td className="py-2.5">{item.quantity} units</td>
                    <td className="py-2.5">{item.reservedQuantity} units</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${item.stockStatus === 'IN_STOCK' && 'bg-green-50 text-green-700 border border-green-100'}
                        ${item.stockStatus === 'LOW_STOCK' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                        ${item.stockStatus === 'OUT_OF_STOCK' && 'bg-red-50 text-red-700 border border-red-100'}
                      `}>
                        {item.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-neutral-450">
            No items registered in inventory.
          </div>
        )}
      </div>
    </div>
  );
}
