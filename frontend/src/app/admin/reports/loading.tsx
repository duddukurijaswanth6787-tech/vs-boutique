import React from 'react';

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-neutral-200 rounded-lg" />
        <div className="h-4 w-64 bg-neutral-250 rounded mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neutral-200" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-neutral-200 rounded" />
                <div className="h-3 w-48 bg-neutral-250 rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
