'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCategory } from '@/features/catalog/categories/category.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { ChevronLeft, Edit3, Layers } from 'lucide-react';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: category, isLoading, isError, refetch } = useCategory(id);

  if (isLoading) return <SectionLoader message="Loading category details..." />;
  if (isError || !category) return <PageError title="Category not found" message="Could not load category details." retry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/catalog/categories" className="text-neutral-500 hover:text-neutral-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{category.name}</h1>
            <p className="text-xs text-neutral-500">/{category.slug} · Created {formatDateTime(category.createdAt)}</p>
          </div>
        </div>
        <Link
          href={`/admin/catalog/categories/${id}/edit`}
          className="flex items-center gap-2 bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Category
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${category.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}
          `}>{category.status}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Parent</h3>
          <p className="text-sm font-medium">{(category as unknown as Record<string, unknown>).parentName as string ?? 'Root'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Products</h3>
          <p className="text-sm font-medium">{category.productCount ?? 0}</p>
        </div>
      </div>

      {category.description && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Description</h3>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{category.description}</p>
        </div>
      )}
    </div>
  );
}
