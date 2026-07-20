import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-7 w-32 bg-neutral-200 rounded-lg" />
        <div className="h-4 w-64 bg-neutral-250 rounded mt-2" />
      </div>

      {/* KPI Cards Panel Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-neutral-200 rounded" />
              <div className="h-7 w-7 bg-neutral-200 rounded-lg" />
            </div>
            <div className="mt-4">
              <div className="h-8 w-20 bg-neutral-200 rounded" />
              <div className="h-3 w-32 bg-neutral-250 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Operational Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="rounded-lg h-12 w-12 bg-neutral-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-neutral-200 rounded" />
              <div className="h-6 w-12 bg-neutral-200 rounded" />
              <div className="h-3 w-40 bg-neutral-250 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-100">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-neutral-200 rounded" />
            <div className="h-3 w-48 bg-neutral-250 rounded" />
          </div>
          <div className="h-8 w-28 bg-neutral-200 rounded-lg" />
        </div>
        <div className="h-80 w-full bg-neutral-50 rounded-lg flex items-end p-4">
          <div className="w-full h-48 bg-neutral-200/50 rounded" />
        </div>
      </div>
    </div>
  );
}
