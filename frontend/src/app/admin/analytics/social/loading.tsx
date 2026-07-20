import React from 'react';

export default function SocialAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
        <div className="h-4 w-72 bg-neutral-250 mt-2 rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-20 bg-neutral-200 rounded" />
            <div className="flex items-center justify-between mt-3">
              <div className="h-6 w-16 bg-neutral-200 rounded" />
              <div className="h-4 w-4 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-36 bg-neutral-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0">
              <div className="h-4 w-40 bg-neutral-200 rounded" />
              <div className="h-6 w-16 bg-neutral-200 rounded-lg" />
              <div className="h-4 w-8 bg-neutral-200 rounded" />
              <div className="h-4 w-8 bg-neutral-200 rounded" />
              <div className="h-4 w-8 bg-neutral-200 rounded" />
              <div className="h-4 w-8 bg-neutral-200 rounded" />
              <div className="h-4 w-12 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
