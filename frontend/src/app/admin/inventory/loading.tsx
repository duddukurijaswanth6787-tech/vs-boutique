import React from 'react';

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <div className="h-6 w-56 bg-neutral-200 rounded-lg" />
          <div className="h-3 w-96 bg-neutral-250 mt-2 rounded" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded-xl" />
      </div>

      {/* KPI Cards Panel Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-neutral-250 rounded" />
              <div className="h-5 w-10 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="h-8 w-80 bg-neutral-200 rounded-xl" />
        <div className="h-8 w-40 bg-neutral-200 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="h-12 bg-neutral-50 border-b border-neutral-200" />
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-neutral-100 last:border-0">
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="space-y-1.5 flex-1 ml-6">
                <div className="h-4 w-32 bg-neutral-200 rounded" />
                <div className="h-3 w-28 bg-neutral-250 rounded" />
              </div>
              <div className="h-4 w-10 bg-neutral-200 rounded mx-2" />
              <div className="h-4 w-10 bg-neutral-200 rounded mx-2" />
              <div className="h-4 w-10 bg-neutral-200 rounded mx-2" />
              <div className="h-4 w-10 bg-neutral-200 rounded mx-2" />
              <div className="h-4 w-12 bg-neutral-200 rounded mx-2 font-bold" />
              <div className="h-4 w-12 bg-neutral-200 rounded mx-2" />
              <div className="h-4 w-10 bg-neutral-200 rounded mx-2" />
              <div className="h-6 w-20 bg-neutral-200 rounded-lg mx-2" />
              <div className="h-8 w-32 bg-neutral-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
