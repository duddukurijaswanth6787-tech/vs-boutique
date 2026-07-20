'use client';

import React from 'react';
import { useInventoryReport } from '@/features/reports';
import { Package, AlertTriangle, XOctagon, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

interface InventoryReportItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  stockStatus: string;
  variant?: { product?: { name?: string }; title?: string; sku?: string };
}

export default function InventoryAnalyticsPage() {
  const { data, isLoading, error, refetch } = useInventoryReport();

  if (isLoading) return <SectionLoader message="Loading inventory reports..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch inventory report." retry={refetch} />;

  const reportData =
    (data?.data as {
      totalItems: number;
      lowStock: number;
      outOfStock: number;
      items: InventoryReportItem[];
    }) || { totalItems: 0, lowStock: 0, outOfStock: 0, items: [] };

  const activeStock = reportData.totalItems - reportData.lowStock - reportData.outOfStock;

  const lowStockItems = (reportData.items || []).filter(
    (i: InventoryReportItem) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK'
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventory Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor warehouse quantities, safety stock levels, and items needing reorder.
        </p>
      </div>

      {/* KPI Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Items</span>
            <Package className="h-4 w-4 text-neutral-450" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalItems}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Healthy Stock</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-3">{activeStock}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-600 mt-3">{reportData.lowStock}</h3>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Out of Stock</span>
            <XOctagon className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mt-3">{reportData.outOfStock}</h3>
        </div>
      </div>

      {/* Low/Out of Stock Alerts Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Stock Alerts requiring Attention ({lowStockItems.length})</h3>
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Product Style</th>
                  <th className="py-2">SKU ID</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Reserved</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {lowStockItems.map((item: InventoryReportItem) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-semibold text-neutral-900">
                      {item.variant?.product?.name || 'Product'} {item.variant?.title && `(${item.variant.title})`}
                    </td>
                    <td className="py-2.5 font-mono text-neutral-500">{item.variant?.sku || 'SKU'}</td>
                    <td className="py-2.5 font-medium">{item.quantity}</td>
                    <td className="py-2.5">{item.reservedQuantity}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${item.stockStatus === 'LOW_STOCK' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                        ${item.stockStatus === 'OUT_OF_STOCK' && 'bg-red-50 text-red-700 border border-red-100'}
                      `}>
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/admin/inventory?search=${encodeURIComponent(item.variant?.sku || '')}`}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        Adjust Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">All styles have healthy inventory levels.</p>
          </div>
        )}
      </div>
    </div>
  );
}
