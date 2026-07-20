'use client';

import React from 'react';
import { Loader2, AlertCircle, ShieldAlert, Inbox } from 'lucide-react';
import Link from 'next/link';

export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" />;
}

export function PageLoader() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-10 w-10 animate-spin text-admin-primary" />
      <p className="text-sm font-medium text-admin-text-secondary">Loading admin panel...</p>
    </div>
  );
}

export function SectionLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-admin-primary" />
      <p className="text-sm text-admin-text-secondary">{message}</p>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-700 mt-1" role="alert">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SkeletonRow({ cells = 6 }: { cells?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-neutral-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cells = 6 }: { rows?: number; cells?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
      <div className="animate-pulse p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cells }).map((_, j) => (
              <div key={j} className="h-5 bg-neutral-200 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-24" />
            <div className="h-8 bg-neutral-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this page.',
  retry,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center px-4" role="alert">
      <AlertCircle className="h-12 w-12 text-red-700" />
      <div>
        <h2 className="text-xl font-bold text-admin-text-primary">{title}</h2>
        <p className="text-sm text-admin-text-secondary mt-1 max-w-md">{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="rounded-xl bg-neutral-900 px-4 h-9 text-sm font-medium text-white hover:bg-neutral-800 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = 'No items found',
  description = 'There is no data available to display at this moment.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 border border-dashed border-neutral-200 rounded-xl p-6 text-center">
      <Inbox className="h-10 w-10 text-admin-text-disabled" />
      <div>
        <h3 className="text-sm font-semibold text-admin-text-secondary">{title}</h3>
        <p className="text-xs text-admin-text-muted mt-1">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <ShieldAlert className="h-16 w-16 text-yellow-700" />
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Access Denied</h1>
        <p className="text-sm text-admin-text-secondary mt-2 max-w-md">
          You do not have the required permissions or administrative privileges to view this page.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-xl bg-neutral-900 px-4 h-9 flex items-center text-sm font-medium text-white hover:bg-neutral-800 transition"
      >
        Return to Login
      </Link>
    </div>
  );
}

export function ApiErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold">Request Failed</p>
        <p className="opacity-90">{message}</p>
      </div>
    </div>
  );
}
