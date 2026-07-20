'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInventoryList, useInventorySummary } from '@/features/inventory/inventory.hooks';
import { StockStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { Sliders, Search, ArrowLeftRight, Activity, TrendingDown, AlertTriangle, Package2 } from 'lucide-react';
import Link from 'next/link';
import StockActionDialog from '@/features/inventory/components/StockActionDialog';
import UpdateInventoryDialog from '@/features/inventory/components/UpdateInventoryDialog';
import { useAuth } from '@/hooks/useAuth';

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL State
  const page = parseInt(searchParams.get('page') || '1');
  const stockStatus = searchParams.get('stockStatus') || '';
  const search = searchParams.get('search') || '';
  
  const [prevSearch, setPrevSearch] = useState(search);
  const [localSearch, setLocalSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounced search query param update
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch !== (searchParams.get('search') || '')) {
        if (localSearch) {
          params.set('search', localSearch);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        router.push(`/admin/inventory?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, router, searchParams]);
  
  // Dialog state
  const [actionItem, setActionItem] = useState<React.ComponentProps<typeof StockActionDialog>['inventory'] | null>(null);
  const [settingsItem, setSettingsItem] = useState<React.ComponentProps<typeof UpdateInventoryDialog>['inventory'] | null>(null);

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useInventorySummary();
  const { data: listData, isLoading: isListLoading, isError, refetch } = useInventoryList({
    page,
    limit: 10,
    stockStatus: stockStatus || undefined,
    // Add variantId search helper if needed
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/inventory?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Inventory</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Stock Levels</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Stock Inventory Management</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Track physical stock, reserve quantities, record damaged items, and configure replenishment levels.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/inventory/movements"
            className="bg-white hover:bg-neutral-50 text-neutral-800 font-semibold py-2.5 px-4 rounded-xl text-xs border border-neutral-200 flex items-center gap-2 transition"
          >
            <ArrowLeftRight className="w-4 h-4" /> Stock Movements
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {!isSummaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-neutral-50 rounded-lg text-neutral-600">
              <Package2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total SKUs</span>
              <span className="text-lg font-bold text-neutral-900">{summary.totalItems}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-green-600/70 font-bold uppercase tracking-wider block">In Stock</span>
              <span className="text-lg font-bold text-green-700">{summary.inStock}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-lg text-yellow-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-yellow-600/70 font-bold uppercase tracking-wider block">Low Stock</span>
              <span className="text-lg font-bold text-yellow-700">{summary.lowStock}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider block">Out of Stock</span>
              <span className="text-lg font-bold text-red-700">{summary.outOfStock}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Package2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-wider block">Available / Reserved</span>
              <span className="text-xs font-bold text-neutral-900">
                {summary.totalAvailable} <span className="text-neutral-400 font-normal">/</span> {summary.totalReserved}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search variant SKU or Variant ID..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={stockStatus}
            onChange={(e) => updateQuery('stockStatus', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">IN STOCK</option>
            <option value="LOW_STOCK">LOW STOCK</option>
            <option value="OUT_OF_STOCK">OUT OF STOCK</option>
            <option value="BACKORDER">BACKORDER</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isListLoading ? (
        <SectionLoader message="Fetching inventory levels..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not retrieve inventory levels from backend." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">SKU / ID</th>
                  <th className="p-4">Variant Info</th>
                  <th className="p-4 text-center">Available</th>
                  <th className="p-4 text-center">Reserved</th>
                  <th className="p-4 text-center">Damaged</th>
                  <th className="p-4 text-center">Returned</th>
                  <th className="p-4 text-center">Effective Stock</th>
                  <th className="p-4 text-center">Min/Max</th>
                  <th className="p-4 text-center">Reorder</th>
                  <th className="p-4">Status</th>
                  {isEditor && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((item) => {
                  const effectiveQty = item.availableQuantity - item.reservedQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[10px] text-neutral-900">
                        {item.variant?.sku || item.variantId.substring(0, 8)}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">{item.variant?.title || 'Unknown Product Variant'}</div>
                        <div className="text-[10px] text-neutral-400">Variant ID: {item.variantId}</div>
                      </td>
                      <td className="p-4 text-center font-semibold text-neutral-900">{item.availableQuantity}</td>
                      <td className="p-4 text-center text-neutral-500">{item.reservedQuantity}</td>
                      <td className="p-4 text-center text-red-500">{item.damagedQuantity}</td>
                      <td className="p-4 text-center text-indigo-500">{item.returnedQuantity}</td>
                      <td className={`p-4 text-center font-bold ${effectiveQty <= 0 ? 'text-red-600' : 'text-neutral-900'}`}>
                        {effectiveQty}
                      </td>
                      <td className="p-4 text-center text-neutral-500">
                        {item.minimumStock} <span className="text-neutral-300">/</span> {item.maximumStock}
                      </td>
                      <td className="p-4 text-center font-medium">{item.reorderLevel}</td>
                      <td className="p-4">
                        <StockStatusBadge status={item.stockStatus} />
                      </td>
                      {isEditor && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActionItem(item)}
                              className="px-2 py-1 bg-neutral-900 text-white rounded text-[10px] font-bold hover:bg-neutral-800 transition"
                            >
                              Transact
                            </button>
                            <button
                              onClick={() => setSettingsItem(item)}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-950"
                              title="Settings"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-neutral-400 font-medium">
                      No stock listings matching current filter criteria.
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
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock action transaction Dialog */}
      {actionItem && (
        <StockActionDialog
          inventory={actionItem}
          onClose={() => {
            setActionItem(null);
            refetch();
          }}
        />
      )}

      {/* Inventory Settings Dialog */}
      {settingsItem && (
        <UpdateInventoryDialog
          inventory={settingsItem}
          onClose={() => {
            setSettingsItem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
