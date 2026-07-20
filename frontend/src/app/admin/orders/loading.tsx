import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <div className="h-6 w-40 bg-neutral-200 rounded-lg" />
          <div className="h-3 w-80 bg-neutral-250 mt-2 rounded" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="h-8 w-80 bg-neutral-200 rounded-xl" />
          <div className="flex gap-3 w-full md:w-auto items-center">
            <div className="h-8 w-48 bg-neutral-200 rounded-xl" />
            <div className="h-8 w-32 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="h-12 bg-neutral-50 border-b border-neutral-200" />
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-neutral-100 last:border-0">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-32 bg-neutral-200 rounded" />
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="h-4 w-8 bg-neutral-200 rounded" />
              <div className="h-4 w-16 bg-neutral-200 rounded text-right" />
              <div className="h-4 w-16 bg-neutral-200 rounded text-right" />
              <div className="h-4 w-20 bg-neutral-200 rounded text-right font-bold" />
              <div className="h-6 w-20 bg-neutral-200 rounded-lg" />
              <div className="h-8 w-20 bg-neutral-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
