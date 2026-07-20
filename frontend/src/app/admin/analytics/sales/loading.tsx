import React from 'react';

export default function SalesAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 w-36 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-64 bg-neutral-250 mt-2 rounded" />
        </div>
        <div className="h-8 w-28 bg-neutral-200 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-neutral-200 rounded" />
              <div className="h-7 w-7 bg-neutral-200 rounded-lg" />
            </div>
            <div className="h-8 w-32 bg-neutral-200 rounded mt-4" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 bg-neutral-200 rounded mb-4" />
        <div className="h-80 w-full bg-neutral-50 rounded-lg flex items-end p-4">
          <div className="w-full h-56 bg-neutral-200/50 rounded" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-32 bg-neutral-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="h-4 w-16 bg-neutral-200 rounded" />
              <div className="h-6 w-20 bg-neutral-200 rounded-lg" />
              <div className="h-4 w-32 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
