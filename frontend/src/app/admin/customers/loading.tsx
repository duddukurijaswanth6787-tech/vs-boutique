import React from 'react';

export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-40 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-56 bg-neutral-250 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-neutral-200 rounded-xl" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-64 bg-neutral-200 rounded-xl" />
        <div className="h-10 w-32 bg-neutral-200 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="h-12 bg-neutral-50 border-b border-neutral-200" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white border-b border-neutral-100 flex items-center px-6">
            <div className="h-8 w-8 rounded-full bg-neutral-200 mr-3" />
            <div className="h-4 w-40 bg-neutral-200 rounded" />
            <div className="h-4 w-32 bg-neutral-250 rounded ml-4" />
            <div className="h-4 w-24 bg-neutral-250 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
