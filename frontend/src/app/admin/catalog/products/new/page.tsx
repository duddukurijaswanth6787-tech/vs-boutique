'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductBuilder from '@/features/catalog/products/components/ProductBuilder';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <Link
          href="/admin/catalog/products"
          className="p-2 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Add Catalog Product</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Establish basic data, pricing, dimensions, and upload S3 media assets.</p>
        </div>
      </div>

      <ProductBuilder 
        onSaveSuccess={(id) => {
          router.push(`/admin/catalog/products/${id}/edit`);
        }} 
      />
    </div>
  );
}
