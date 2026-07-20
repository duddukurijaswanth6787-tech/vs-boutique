import React from 'react';

export default function OrderAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 bg-neutral-200 rounded" />
            <div className="mt-3 h-8 w-16 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm h-80" />
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 flex items-center border-b border-neutral-100 last:border-0">
            <div className="h-4 w-32 bg-neutral-200 rounded" />
            <div className="h-4 w-20 bg-neutral-250 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
