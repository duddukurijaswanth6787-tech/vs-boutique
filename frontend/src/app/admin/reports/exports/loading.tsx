import React from 'react';

export default function ReportsExportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-64 bg-neutral-250 rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded-xl" />
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 flex items-center border-b border-neutral-100 last:border-0">
            <div className="h-4 w-40 bg-neutral-200 rounded" />
            <div className="h-4 w-24 bg-neutral-250 rounded ml-4" />
            <div className="h-4 w-20 bg-neutral-250 rounded ml-auto" />
            <div className="h-6 w-16 bg-neutral-200 rounded ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
