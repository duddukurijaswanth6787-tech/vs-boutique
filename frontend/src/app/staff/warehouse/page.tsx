'use client';

import React from 'react';
import Link from 'next/link';
import { useWarehouseList } from '@/features/warehouse/warehouse.hooks';
import { useInventoryList } from '@/features/inventory/inventory.hooks';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { Package, AlertTriangle } from 'lucide-react';

export default function StaffWarehousePage() {
  const { data: warehouses, isLoading: whLoading } = useWarehouseList({ page: 1, limit: 50 });
  const { data: inventory, isLoading: invLoading, isError, refetch } = useInventoryList({ page: 1, limit: 50 });

  if (whLoading || invLoading) return <SectionLoader message="Loading warehouse data..." />;
  if (isError) return <PageError title="Load Failure" message="Could not load warehouse data." retry={refetch} />;

  const warehouseList = warehouses?.data ?? [];
  const inventoryList = inventory?.data ?? [];
  const lowStockItems = inventoryList.filter((item: any) => item.trackInventory && item.availableQuantity < 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Warehouse Operations</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Inventory levels and stock movements</p>
      </div>

      {/* Warehouse Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouseList.map((wh: any) => (
          <div key={wh.id} className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-neutral-900">{wh.name}</span>
                <p className="text-[10px] text-neutral-400">{wh.code ?? '—'}</p>
              </div>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              wh.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
            }`}>
              {wh.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
        {warehouseList.length === 0 && (
          <div className="col-span-3">
            <EmptyState title="No Warehouses" description="No warehouses configured." />
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-900">Low Stock Alert ({lowStockItems.length} items)</h2>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-white rounded-lg p-3 border border-amber-100">
                <span className="font-medium text-neutral-900">{item.variant?.product?.name ?? item.variantId}</span>
                <span className="font-bold text-amber-700">{item.availableQuantity} remaining</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">Inventory Overview</h2>
        </div>
        {inventoryList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Product</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4 text-center">Available</th>
                  <th className="p-4 text-center">Reserved</th>
                  <th className="p-4 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {inventoryList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900">{item.variant?.product?.name ?? item.variantId}</td>
                    <td className="p-4 text-neutral-500">{item.warehouseId}</td>
                    <td className="p-4 text-center font-bold">{item.availableQuantity}</td>
                    <td className="p-4 text-center text-neutral-500">{item.reservedQuantity}</td>
                    <td className="p-4 text-center font-bold">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="No Inventory" description="No inventory records found." />
          </div>
        )}
      </div>
    </div>
  );
}
