'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  useCategories, 
  useCategorySummary, 
  useCategoryTree, 
  useDeleteCategory,
  useBulkCategories,
  useCloneCategory,
} from '@/features/catalog/categories/category.hooks';
import { CategoryResponse } from '@/features/catalog/categories/category.types';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import BulkActionBar from '@/components/ui/BulkActionBar';
import { useExport } from '@/lib/bulk/useExport';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Calendar,
  Copy,
  Download,
  RotateCcw
} from 'lucide-react';
import { formatDateTime } from '@/utils/format';

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const parentId = searchParams.get('parentId') || '';
  const deleted = searchParams.get('deleted') || '';

  // Local state for filters
  const [searchInput, setSearchInput] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: summary, isLoading: summaryLoading } = useCategorySummary();
  const { data: listData, isLoading: listLoading, isError, refetch } = useCategories({
    page,
    limit,
    search,
    status,
    parentId,
    deleted: deleted || undefined,
  });
  const { data: categoryTree } = useCategoryTree();
  const deleteCategoryMut = useDeleteCategory();
  const bulkMut = useBulkCategories();
  const cloneMut = useCloneCategory();
  const { triggerExport, isExporting } = useExport();

  // Flattened lists of parent categories to select from
  const getFlattenedOptions = (nodes?: CategoryResponse[], depth = 0): { id: string; name: string }[] => {
    if (!nodes) return [];
    let opts: { id: string; name: string }[] = [];
    for (const node of nodes) {
      opts.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}` });
      if (node.children) {
        opts = [...opts, ...getFlattenedOptions(node.children, depth + 1)];
      }
    }
    return opts;
  };
  const parentOptions = getFlattenedOptions(categoryTree);

  // Update query params helper
  const updateQuery = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val.toString());
      }
    });
    // Reset page if filters change
    if (!updates.page && updates.page !== null) {
      params.set('page', '1');
    }
    router.push(`/admin/catalog/categories?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This action soft deletes the category.`)) {
      try {
        await deleteCategoryMut.mutateAsync(id);
        refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message
          : getApiErrorMessage(err);
        toast.error(message || 'Error occurred during deletion');
      }
    }
  };

  // ponytail: bulk selection derived from current page rows; listData already filters deleted
  const filteredIds = (listData?.data ?? []).map((c) => c.id);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredIds) : new Set());
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  const handleClone = async (id: string, name: string) => {
    try {
      await cloneMut.mutateAsync(id);
      toast.success(`Cloned "${name}"`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Failed to clone category');
    }
  };

  const handleExport = () => {
    triggerExport({ entity: 'Category', filters: { status, search } });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-[#F0EEEC] shadow-sm">
        <div>
          <div className="text-xs text-[#78716C] mb-1 font-medium">
            Catalog &nbsp;/&nbsp; <span className="text-[#8B1538] font-semibold">Categories</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1C1917] tracking-tight">Categories</h1>
          <p className="text-xs text-[#78716C] mt-0.5">Manage and organize your product categories hierarchy, visibility, and sort order.</p>
        </div>
        <Link
          href="/admin/catalog/categories/new"
          className="bg-[#8B1538] hover:bg-[#72102D] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Link>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-white border border-[#E7E5E4] hover:bg-[#FCFBFA] text-[#57534E] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {isExporting ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#F0EEEC] animate-pulse h-28" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Total Categories</span>
              <div className="text-2xl font-black text-[#1C1917]">{summary.totalCategories}</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>+{summary.createdThisMonth}</span> this month
              </div>
            </div>
            <div className="p-3 bg-[#FFF1F4] text-[#8B1538] rounded-2xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Active Categories</span>
              <div className="text-2xl font-black text-[#1C1917]">{summary.activeCategories}</div>
              <div className="text-[10px] text-[#78716C] font-semibold">
                <span className="text-[#1C1917] font-bold">{summary.activePercentage}%</span> of total
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Inactive */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Inactive Categories</span>
              <div className="text-2xl font-black text-[#1C1917]">{summary.inactiveCategories}</div>
              <div className="text-[10px] text-[#78716C] font-semibold">
                <span className="text-[#1C1917] font-bold">{summary.inactivePercentage}%</span> of total
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Product Mapped */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">With Products</span>
              <div className="text-2xl font-black text-[#1C1917]">{summary.categoriesWithProducts}</div>
              <div className="text-[10px] text-[#78716C] font-semibold">
                <span className="text-[#1C1917] font-bold">{summary.categoriesWithProductsPercentage}%</span> of total
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-[#F0EEEC] shadow-sm items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#8B1538]"
          />
          <button type="submit" className="absolute left-3 top-2.5 text-[#A8A29E]">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#FCFBFA] px-3 py-1.5 rounded-xl border border-[#E7E5E4]">
            <span className="text-[10px] font-bold text-[#78716C] uppercase">Status:</span>
            <select
              value={status}
              onChange={(e) => updateQuery({ status: e.target.value })}
              className="bg-transparent text-xs font-semibold text-[#1C1917] focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Parent Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#FCFBFA] px-3 py-1.5 rounded-xl border border-[#E7E5E4]">
            <span className="text-[10px] font-bold text-[#78716C] uppercase">Parent:</span>
            <select
              value={parentId}
              onChange={(e) => updateQuery({ parentId: e.target.value })}
              className="bg-transparent text-xs font-semibold text-[#1C1917] focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="">All Categories</option>
              <option value="ROOT">Root Level Only</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show Deleted Toggle */}
          <button
            onClick={() => updateQuery({ deleted: deleted ? '' : 'only' })}
            className={`text-xs font-bold px-2 py-1.5 rounded-lg border transition-colors ${
              deleted
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-[#FCFBFA] text-[#78716C] border-[#E7E5E4] hover:text-[#8B1538]'
            }`}
          >
            {deleted ? 'Showing Deleted' : 'Show Deleted'}
          </button>

          {/* Clear Filters */}
          {(search || status || parentId || deleted) && (
            <button
              onClick={() => {
                setSearchInput('');
                router.push('/admin/catalog/categories');
              }}
              className="text-xs font-bold text-[#8B1538] hover:text-[#72102D] px-2 py-1.5"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Table) */}
      {listLoading ? (
        <SectionLoader message="Syncing e-commerce taxonomy lists..." />
      ) : isError ? (
        <PageError title="Fetch Failure" message="Could not retrieve the categories page data." retry={refetch} />
      ) : listData && listData.data.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#F0EEEC] shadow-sm">
          <Layers className="w-12 h-12 text-[#A8A29E] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1C1917]">No categories found</h3>
          <p className="text-xs text-[#78716C] mt-1">Try resetting your search query or filters.</p>
        </div>
      ) : listData ? (
        <div className="bg-white rounded-2xl border border-[#F0EEEC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 z-10">
                 <tr className="bg-[#FCFBFA] border-b border-[#E7E5E4] text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
                   <th className="py-4 px-3 w-10">
                     <input
                       type="checkbox"
                       checked={isAllSelected}
                       onChange={(e) => handleSelectAll(e.target.checked)}
                       className="w-4 h-4 rounded border-[#D6D3D1] text-[#8B1538] focus:ring-[#8B1538]"
                       aria-label="Select all categories"
                     />
                   </th>
                   <th className="py-4 px-6">Category</th>
                   <th className="py-4 px-6">Parent Level</th>
                   <th className="py-4 px-6 text-center">Products Count</th>
                   <th className="py-4 px-6 text-center">Status</th>
                   <th className="py-4 px-6 text-center">Sort Order</th>
                   <th className="py-4 px-6">Created On</th>
                   <th className="py-4 px-6 text-right">Actions</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-[#F0EEEC]">
                {listData.data.map((cat) => (
                   <tr key={cat.id} className="hover:bg-[#FCFBFA]/50 transition-colors text-xs text-[#57534E]">
                     {/* Select checkbox */}
                     <td className="py-3 px-3">
                       <input
                         type="checkbox"
                         checked={selectedIds.has(cat.id)}
                         onChange={(e) => handleSelectOne(cat.id, e.target.checked)}
                         className="w-4 h-4 rounded border-[#D6D3D1] text-[#8B1538] focus:ring-[#8B1538]"
                         aria-label={`Select ${cat.name}`}
                       />
                     </td>
                     {/* Category Column */}
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail
                          src={cat.image}
                          alt={cat.name}
                          href={`/admin/catalog/categories/${cat.id}`}
                        />
                        <div>
                          <span className="font-bold text-[#1C1917] block hover:text-[#8B1538] transition-colors">
                            <Link href={`/admin/catalog/categories/${cat.id}`}>{cat.name}</Link>
                          </span>
                          <span className="text-[10px] text-[#A8A29E] font-mono font-medium">/{cat.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Parent Column */}
                    <td className="py-3 px-6">
                      {cat.parent ? (
                        <div className="font-medium text-[#1C1917]">
                          {cat.parent.name}
                          <span className="text-[9px] text-[#78716C] block font-mono">Level {cat.level}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                          Root Level
                        </span>
                      )}
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-6 text-center font-bold text-[#1C1917]">
                      {cat.productCount ?? 0}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-6 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        cat.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {cat.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="py-3 px-6 text-center font-bold text-[#1C1917] font-mono">
                      {cat.displayOrder}
                    </td>

                    {/* Created On */}
                    <td className="py-3 px-6 text-[#78716C] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#A8A29E]" />
                        {formatDateTime(cat.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-6 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/catalog/categories/${cat.id}`}
                          className="p-1.5 hover:bg-[#FFF1F4] text-[#78716C] hover:text-[#8B1538] rounded-lg transition-colors"
                          aria-label={`View ${cat.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/catalog/categories/${cat.id}/edit`}
                          className="p-1.5 hover:bg-[#FFF1F4] text-[#78716C] hover:text-[#8B1538] rounded-lg transition-colors"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 hover:bg-rose-50 text-[#78716C] hover:text-rose-700 rounded-lg transition-colors"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleClone(cat.id, cat.name)}
                          className="p-1.5 hover:bg-[#FFF1F4] text-[#78716C] hover:text-[#8B1538] rounded-lg transition-colors"
                          aria-label={`Clone ${cat.name}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-[#FCFBFA] px-6 py-4 border-t border-[#E7E5E4] flex items-center justify-between">
            <div className="text-xs text-[#78716C] font-medium">
              Showing <span className="font-bold text-[#1C1917]">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-[#1C1917]">
                {Math.min(page * limit, listData.meta.total)}
              </span>{' '}
              of <span className="font-bold text-[#1C1917]">{listData.meta.total}</span> categories
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQuery({ page: page - 1 })}
                disabled={!listData.meta.hasPrevious}
                className="p-2 border border-[#E7E5E4] rounded-lg bg-white text-[#78716C] hover:bg-[#FCFBFA] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(listData.meta.totalPages)].map((_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => updateQuery({ page: pNum })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      page === pNum
                        ? 'bg-[#8B1538] text-white'
                        : 'bg-white border border-[#E7E5E4] text-[#57534E] hover:bg-[#FCFBFA]'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => updateQuery({ page: page + 1 })}
                disabled={!listData.meta.hasNext}
                className="p-2 border border-[#E7E5E4] rounded-lg bg-white text-[#78716C] hover:bg-[#FCFBFA] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        isRunning={bulkMut.isPending}
        result={bulkMut.data}
        actions={
          deleted
            ? [{ label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }), variant: 'default' }]
            : [
                { label: 'Delete', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'delete' }), variant: 'danger' },
                { label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }), variant: 'default' },
              ]
        }
      />
    </div>
  );
}
