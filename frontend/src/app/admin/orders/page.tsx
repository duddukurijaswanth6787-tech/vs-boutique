'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderList, useOrderStatistics, useRestoreOrder } from '@/features/orders/order.hooks';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { useExport } from '@/lib/bulk/useExport';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Calendar, 
  Download,
  LayoutGrid,
  List,
  Copy,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDateTime } from '@/utils/format';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation states
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const deleted = searchParams.get('deleted') || '';
  const createdBy = searchParams.get('createdBy') || '';
  const createdAfter = searchParams.get('createdAfter') || '';
  const createdBefore = searchParams.get('createdBefore') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: listData, isLoading, isError, refetch } = useOrderList({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    ...(deleted ? { deleted: 'only' } : {}),
    ...(createdBy ? { createdBy } : {}),
    ...(createdAfter ? { createdAfter } : {}),
    ...(createdBefore ? { createdBefore } : {}),
    ...(minPrice ? { minPrice: Number(minPrice) } : {}),
    ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
  });
  const { data: stats } = useOrderStatistics();
  const restoreMut = useRestoreOrder();
  const { triggerExport, isExporting } = useExport();

  const handleExport = () => {
    triggerExport({ entity: 'order', filters: { status, startDate, endDate, createdBy, createdAfter, createdBefore, minPrice, maxPrice } });
  };

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const handleCopyOrderNumber = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const allIds = (listData?.data ?? []).map((o) => o.id);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const handleSelectAll = (checked: boolean) => setSelectedIds(checked ? new Set(allIds) : new Set());
  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  const handleRestore = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Restore order #${orderNumber}?`)) return;
    try {
      await restoreMut.mutateAsync(id);
      toast.success(`Restored #${orderNumber}`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Failed to restore order');
    }
  };

  // Helper status badge styles
  const renderStatusBadge = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-100">Delivered</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">Shipped</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 font-sans">Processing</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-red-50 text-red-700 border border-red-100">Cancelled</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100">Pending</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Orders</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Orders</h1>
        </div>
        <button
          onClick={() => toast.info('Orders are created through the storefront checkout process.')}
          className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Orders', key: 'total', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', key: 'pending', icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Processing', key: 'processing', icon: Package, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Shipped', key: 'shipped', icon: Truck, color: 'text-purple-600 bg-purple-50' },
          { label: 'Delivered', key: 'delivered', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Cancelled', key: 'cancelled', icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, key, icon: Icon, color }) => (
          <div key={key} className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">{label}</span>
              <span className="text-xl font-bold text-neutral-900">{stats?.[key as keyof typeof stats]?.toLocaleString() ?? 0}</span>
            </div>
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by Order ID, Customer or Email..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2 text-xs text-neutral-900 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[10px] text-neutral-400 font-bold">/</span>
          </div>

          <select
            value={status}
            onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="text"
            value={createdBy}
            onChange={(e) => updateQuery('createdBy', e.target.value)}
            placeholder="Created By (ID)"
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[120px]"
          />
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => { setLocalStartDate(e.target.value); updateQuery('startDate', e.target.value); }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
            aria-label="Start date"
          />
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => { setLocalEndDate(e.target.value); updateQuery('endDate', e.target.value); }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
            aria-label="End date"
          />
          <input
            type="number"
            value={minPrice}
            onChange={(e) => updateQuery('minPrice', e.target.value)}
            placeholder="Min ₹"
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none w-24"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => updateQuery('maxPrice', e.target.value)}
            placeholder="Max ₹"
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none w-24"
          />

        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => updateQuery('deleted', deleted ? '' : 'only')}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold shadow-sm cursor-pointer ${
              deleted ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> {deleted ? 'Showing Deleted' : 'Show Deleted'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-white text-xs font-bold text-neutral-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          <div className="flex border border-neutral-200 p-1 rounded-xl bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      {isLoading ? (
        <SectionLoader message="Fetching orders queue..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch orders from backend server." retry={refetch} />
      ) : !listData?.data?.length ? (
        <EmptyState
          title="No orders found"
          description="No orders match your current filter criteria. Try adjusting filters or search."
          action={
            <button
              onClick={() => router.push('/admin/orders')}
              className="rounded-xl bg-neutral-900 px-4 h-9 text-sm font-medium text-white hover:bg-neutral-800 transition"
            >
              Clear Filters
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label="Select all orders" /></th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Fulfillment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Items</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {(listData?.data ?? []).map((ord) => {
                    const itemsCount = ord.items?.length ?? 0;
                    return (
                    <tr key={ord.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(ord.id)} onChange={(e) => handleSelectOne(ord.id, e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label={`Select order ${ord.orderNumber}`} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/orders/${ord.id}`} className="font-bold text-[#7A1C30] hover:underline font-mono">
                            #{ord.orderNumber}
                          </Link>
                          <button
                            onClick={(e) => handleCopyOrderNumber(e, ord.orderNumber)}
                            className="text-neutral-400 hover:text-neutral-600 p-1"
                            aria-label={`Copy order number ${ord.orderNumber}`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-neutral-900 block">{ord.customerName ?? '—'}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">{ord.customerEmail ?? '—'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-neutral-800 block">{formatMoney(ord.grandTotal)}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">({itemsCount} items)</span>
                      </td>
                      <td className="p-4"><span className="text-[10px] text-neutral-400">—</span></td>
                      <td className="p-4"><span className="text-[10px] text-neutral-400">—</span></td>
                      <td className="p-4">{renderStatusBadge(ord.status)}</td>
                      <td className="p-4 font-semibold text-neutral-400">{formatDateTime(ord.createdAt)}</td>
                      <td className="p-4"><span className="text-[10px] text-neutral-400">{itemsCount} items</span></td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/admin/orders/${ord.id}`} className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm" aria-label="View order details">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {deleted && (
                            <button
                              type="button"
                              onClick={() => handleRestore(ord.id, ord.orderNumber)}
                              className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-emerald-600 shadow-sm"
                              aria-label={`Restore order ${ord.orderNumber}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination Strip */}
          {listData?.meta && (
          <div className="flex justify-between items-center text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
            <span>
              Showing {((listData.meta.page - 1) * listData.meta.limit) + 1} to {Math.min(listData.meta.page * listData.meta.limit, listData.meta.total)} of {listData.meta.total.toLocaleString()} orders
            </span>
            <div className="flex items-center gap-3">
              <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', page - 1)}
                  className="p-2 hover:bg-neutral-50 text-neutral-500 flex items-center justify-center border-r border-neutral-200 disabled:opacity-30"
                ><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(listData.meta.totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateQuery('page', p)}
                      className={`px-3 py-1.5 text-xs font-bold ${p === page ? 'bg-[#7A1C30] text-white' : 'hover:bg-neutral-50 text-neutral-600'} ${p < Math.min(listData.meta.totalPages, 5) ? 'border-r border-neutral-200' : ''}`}
                    >{p}</button>
                  );
                })}
                <button
                  type="button"
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="p-2 hover:bg-neutral-50 text-neutral-500 flex items-center justify-center disabled:opacity-30"
                ><ChevronRight className="w-4 h-4" /></button>
              </div>
              <select
                className="border border-neutral-200 bg-white rounded-xl px-2 py-1.5 text-xs text-neutral-700 font-bold focus:outline-none"
                value={10}
                onChange={(e) => updateQuery('limit', e.target.value)}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
