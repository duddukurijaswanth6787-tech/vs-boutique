'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useProductStats, useDeleteProduct, useRestoreProduct, usePublishProduct, useUnpublishProduct, useFeatureProduct, useUnfeatureProduct, useCloneProduct, useBulkProducts } from '@/features/catalog/products/product.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { useImportPreview, useImportConfirm } from '@/features/import/import.hooks';
import { ProductStatus } from '@/features/catalog/products/product.types';
import Link from 'next/link';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag,
  Download,
  Upload,
  Copy,
  MoreVertical,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { useExport } from '@/lib/bulk/useExport';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import BulkActionBar from '@/components/ui/BulkActionBar';
import Dialog from '@/components/ui/Dialog';

// ponytail: full class names so Tailwind JIT keeps them
const TINT: Record<string, string> = {
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // URL Query Parameters Sync
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const deleted = searchParams.get('deleted') || '';
  const createdBy = searchParams.get('createdBy') || '';
  const updatedBy = searchParams.get('updatedBy') || '';
  const tags = searchParams.get('tags') || '';
  const createdAfter = searchParams.get('createdAfter') || '';
  const createdBefore = searchParams.get('createdBefore') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
        router.push(`/admin/catalog/products?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, router, searchParams]);

  // Queries
  const { data: productsData, isLoading, isError, refetch } = useProducts({
    page,
    limit: 10,
    search,
    status: status || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    ...(deleted ? { deleted: 'only' } : {}),
    ...(createdBy ? { createdBy } : {}),
    ...(updatedBy ? { updatedBy } : {}),
    ...(tags ? { tags: tags.split(',').map(t => t.trim()).filter(Boolean) } : {}),
    ...(createdAfter ? { createdAfter } : {}),
    ...(createdBefore ? { createdBefore } : {}),
    ...(minPrice ? { minPrice: Number(minPrice) } : {}),
    ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
  });

  const { data: categoryList } = useCategories({ limit: 100 });
  const { data: brandList } = useBrands({ limit: 100 });
  const { data: stats, isLoading: statsLoading } = useProductStats();

  // Mutations
  const deleteProductMut = useDeleteProduct();
  const restoreProductMut = useRestoreProduct();
  const publishProductMut = usePublishProduct();
  const unpublishProductMut = useUnpublishProduct();
  const featureProductMut = useFeatureProduct();
  const unfeatureProductMut = useUnfeatureProduct();
  const cloneMut = useCloneProduct();
  const bulkMut = useBulkProducts();

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allIds = productsData?.data?.map(p => p.id) || [];
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(allIds));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const { triggerExport, isExporting } = useExport();
  const handleExport = () => triggerExport({ entity: 'Product', filters: { search, status, categoryId, brandId } });

  const handleClone = async (id: string, name: string) => {
    try {
      await cloneMut.mutateAsync(id);
      toast.success(`Cloned "${name}"`);
      refetch();
    } catch (err) {
      /* error toast handled by hook */
    }
  };

  // Update query params
  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset pagination to first page
    router.push(`/admin/catalog/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await deleteProductMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isSuperAdmin = user?.roles?.includes('super_admin');

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            <span>Catalog</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Products</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Products</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage your product catalog, inventory and visibility.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50">
            <Download className="w-3.5 h-3.5 text-neutral-500" /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" /> Import
          </button>
          <button
            onClick={() => updateQuery('deleted', deleted ? '' : 'only')}
            className={`flex items-center gap-2 border font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              deleted ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> {deleted ? 'Showing Deleted' : 'Show Deleted'}
          </button>
          <Link
            href="/admin/catalog/products/new"
            className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: 'total', label: 'Total Products', icon: ShoppingBag, tint: 'purple', value: stats?.total },
          { key: 'active', label: 'Active Products', icon: CheckCircle2, tint: 'green', value: stats?.active },
          { key: 'outOfStock', label: 'Out of Stock', icon: AlertOctagon, tint: 'red', value: stats?.outOfStock },
          { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle, tint: 'amber', value: stats?.lowStock },
          { key: 'draft', label: 'Draft Products', icon: FileText, tint: 'blue', value: stats?.draft },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">{c.label}</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {statsLoading ? '—' : (c.value ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TINT[c.tint]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <input
              key={search}
              type="text"
              defaultValue={search}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by product name, SKU, category..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-3.5" />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <select
              value={categoryId}
              onChange={(e) => updateQuery('categoryId', e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[130px]"
            >
              <option value="">All Categories</option>
              {categoryList?.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={brandId}
              onChange={(e) => updateQuery('brandId', e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[110px]"
            >
              <option value="">All Brands</option>
              {brandList?.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => updateQuery('status', e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[110px]"
            >
              <option value="">All Status</option>
              {Object.values(ProductStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={createdBy}
              onChange={(e) => updateQuery('createdBy', e.target.value)}
              placeholder="Created By (ID)"
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[120px]"
            />
            <input
              type="text"
              value={updatedBy}
              onChange={(e) => updateQuery('updatedBy', e.target.value)}
              placeholder="Updated By (ID)"
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[120px]"
            />
            <input
              type="text"
              value={tags}
              onChange={(e) => updateQuery('tags', e.target.value)}
              placeholder="Tags (comma)"
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[110px]"
            />
            <input
              type="date"
              value={createdAfter}
              onChange={(e) => updateQuery('createdAfter', e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
              aria-label="Created after"
            />
            <input
              type="date"
              value={createdBefore}
              onChange={(e) => updateQuery('createdBefore', e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
              aria-label="Created before"
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

            <select
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none min-w-[130px]"
            >
              <option value="">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <button className="flex items-center gap-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 font-bold py-2 px-3.5 rounded-xl text-xs transition-all shadow-sm shrink-0 cursor-pointer">
              <Filter className="w-3.5 h-3.5 text-neutral-500" /> More Filters
            </button>
            
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                router.push('/admin/catalog/products');
              }}
              className="flex items-center gap-1 text-[#7A1C30] hover:text-[#5e1322] font-bold text-xs shrink-0 px-2 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <SectionLoader message="Fetching product listings..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch product catalog values from backend server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                    <th className="p-4 w-10">
                    <input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" />
                  </th>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {productsData?.data?.map((prod) => {
                  const hasDiscount = prod.salePrice && prod.salePrice < prod.basePrice;
                  const catName = prod.categories?.[0]?.categoryName || '—';
                  const brandName = prod.brandName || '—';

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 w-10">
                        <input type="checkbox" checked={selectedIds.has(prod.id)} onChange={(e) => handleSelectOne(prod.id, e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail
                            src={prod.primaryImageUrl}
                            alt={prod.name}
                            href={`/admin/catalog/products/${prod.id}`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900">{prod.name}</span>
                              {prod.isFeatured && (
                                <span className="text-[9px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Featured
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">{prod.shortDescription || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-neutral-900 font-mono text-[10px]">{prod.sku}</td>
                      <td className="p-4 text-neutral-600 font-medium">{catName}</td>
                      <td className="p-4 text-neutral-600 font-medium">{brandName}</td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">₹{(prod.salePrice || prod.basePrice).toLocaleString()}</div>
                        {hasDiscount && (
                          <div className="text-[10px] text-neutral-400 line-through">₹{prod.basePrice.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="p-4">
                        {prod.trackInventory ? (
                          prod.minimumOrderQuantity === 0 ? (
                            <div>
                              <span className="text-[10px] text-red-600 font-bold block">0</span>
                              <span className="text-[9px] text-red-700 font-bold block mt-0.5 bg-red-50 border border-red-100 px-2 py-0.5 rounded w-max">Out of Stock</span>
                            </div>
                          ) : prod.minimumOrderQuantity < 20 ? (
                            <div>
                              <span className="text-[10px] text-amber-600 font-bold block">{prod.minimumOrderQuantity}</span>
                              <span className="text-[9px] text-amber-700 font-bold block mt-0.5 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded w-max">Low Stock</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] text-green-600 font-bold block">{prod.minimumOrderQuantity}</span>
                              <span className="text-[9px] text-green-700 font-bold block mt-0.5 bg-green-50 border border-green-100 px-2 py-0.5 rounded w-max">In Stock</span>
                            </div>
                          )
                        ) : (
                          <div>
                            <span className="text-[10px] text-neutral-400 font-bold block">—</span>
                            <span className="text-[9px] text-neutral-400 font-bold block mt-0.5 bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded w-max">Not Tracked</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border
                          ${prod.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-neutral-50 text-neutral-400 border-neutral-200'}
                        `}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-500 font-medium text-[10px]">
                        {new Date(prod.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="block text-[9px] text-neutral-400 mt-0.5">
                          {new Date(prod.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/catalog/products/${prod.id}`}
                            className="p-1.5 hover:bg-neutral-50 rounded text-neutral-500 hover:text-neutral-900 border border-neutral-200 transition-colors shadow-sm"
                            aria-label={`View ${prod.name}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/catalog/products/${prod.id}/edit`}
                            className="p-1.5 hover:bg-neutral-50 rounded text-neutral-500 hover:text-[#7A1C30] border border-neutral-200 transition-colors shadow-sm"
                            aria-label={`Edit ${prod.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 hover:bg-red-50 rounded text-neutral-500 hover:text-red-600 border border-neutral-200 transition-colors shadow-sm cursor-pointer"
                            aria-label={`Archive ${prod.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleClone(prod.id, prod.name)}
                            className="p-1.5 hover:bg-neutral-50 rounded text-neutral-500 hover:text-[#7A1C30] border border-neutral-200 transition-colors shadow-sm cursor-pointer"
                            aria-label={`Clone ${prod.name}`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!productsData?.data || productsData.data.length === 0) && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-neutral-400">
                      No catalog products matching the active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {productsData?.meta && productsData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, productsData.meta.total)} of {productsData.meta.total} products
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!productsData.meta.hasPrevious}
                  onClick={() => updateQuery('page', page - 1)}
                  className="p-2 border border-neutral-200 rounded-lg hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!productsData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="p-2 border border-neutral-200 rounded-lg hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                { label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }) },
                { label: 'Publish', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'publish' }) },
                { label: 'Unpublish', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'unpublish' }) },
                { label: 'Feature', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'feature' }) },
                { label: 'Unfeature', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'unfeature' }) },
              ]
        }
      />

      {/* Import Dialog */}
      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onDone={() => { setIsImportOpen(false); refetch(); }}
        entity="products"
      />
    </div>
  );
}

interface ImportPreview {
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
  preview?: Record<string, unknown>[];
  errors?: { row: number; message: string }[];
  columns?: string[];
}

function ImportDialog({ open, onClose, onDone, entity }: { open: boolean; onClose: () => void; onDone: () => void; entity: 'products' | 'categories' | 'brands' | 'staff' | 'orders' }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const previewMut = useImportPreview();
  const confirmMut = useImportConfirm();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const form = new FormData();
    form.append('file', f);
    try {
      const res = await previewMut.mutateAsync({ entity, file: f });
      setPreview(res as ImportPreview);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Preview failed');
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    const rows = preview.preview ?? [];
    try {
      await confirmMut.mutateAsync({ entity, rows });
      toast.success('Import complete');
      onDone();
      setPreview(null);
      setFile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Import failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Import Products" subtitle="Upload a CSV with product rows. Preview before confirming." size="lg">
      <div className="space-y-4">
        <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-xs" />
        {previewMut.isPending && <div className="text-xs text-neutral-500">Parsing file...</div>}
        {preview && (
          <div className="text-xs text-neutral-700 border border-neutral-200 rounded-xl p-3 max-h-60 overflow-auto">
            <div className="font-bold mb-2">Preview: {preview.validRows ?? 0} valid rows, {preview.errorRows ?? 0} invalid</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(preview.preview ?? preview, null, 2).slice(0, 2000)}</pre>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview || confirmMut.isPending}
            className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50"
          >
            {confirmMut.isPending ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
