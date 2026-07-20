import React from 'react';

export default function CustomerAnalyticsLoading() {
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
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm h-72" />
    </div>
  );
}
