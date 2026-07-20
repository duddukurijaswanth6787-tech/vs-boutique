'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProduct } from '@/features/catalog/products/product.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { ChevronLeft, Edit3 } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(id);

  if (isLoading) return <SectionLoader message="Loading product details..." />;
  if (isError || !product) return <PageError title="Product not found" message="Could not load product details." retry={refetch} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/catalog/products" className="text-neutral-500 hover:text-neutral-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{product.name}</h1>
            <p className="text-xs text-neutral-500">SKU: {product.sku} · Created {formatDateTime(product.createdAt)}</p>
          </div>
        </div>
        <Link
          href={`/admin/catalog/products/${id}/edit`}
          className="flex items-center gap-2 bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Price</h3>
          <p className="text-lg font-bold text-neutral-900">{formatMoney(product.salePrice ?? product.basePrice)}</p>
          {product.salePrice && product.salePrice < product.basePrice && (
            <p className="text-xs text-neutral-400 line-through">{formatMoney(product.basePrice)}</p>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${product.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}
          `}>{product.status}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Brand</h3>
          <p className="text-sm font-medium">{product.brandName ?? '—'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Stock</h3>
          <p className="text-sm font-medium">{product.trackInventory ? product.minimumOrderQuantity : 'Not tracked'}</p>
        </div>
      </div>

      {product.primaryImageUrl && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Image</h3>
          <ProductThumbnail src={product.primaryImageUrl} alt={product.name} />
        </div>
      )}

      {product.description && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Description</h3>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {product.categories && product.categories.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((cat: { categoryId: string; categoryName: string }) => (
              <span key={cat.categoryId} className="px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-700">
                {cat.categoryName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
