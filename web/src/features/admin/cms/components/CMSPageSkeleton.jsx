import React from 'react';

export default function CMSPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-gray-100 pb-5">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Toolbar Skeleton */}
      <div className="h-16 bg-gray-200 rounded-2xl w-full mb-6" />

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>

      {/* Main Body Skeleton */}
      <div className="h-64 bg-gray-200 rounded-2xl w-full" />
    </div>
  );
}
