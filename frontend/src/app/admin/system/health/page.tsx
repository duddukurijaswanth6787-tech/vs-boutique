'use client';

import React from 'react';
import { useSystemHealth } from '@/features/operations';
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function SystemHealthPage() {
  const {
    data: health,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useSystemHealth();

  if (isLoading) {
    return <SectionLoader message="Retrieving infrastructure health indicators..." />;
  }

  if (error) {
    return (
      <PageError
        title="Infrastructure Call Failure"
        message="Could not resolve current health indicator values. The NestJS backend service may be down."
        retry={refetch}
      />
    );
  }

  const details = health?.info || health?.details || {};
  const statusItems = Object.entries(details).map(([key, value]: [string, Record<string, unknown>]) => ({
    name: key.toUpperCase(),
    status: (value?.status as string) || 'unknown',
    details: value,
  }));

  const isHealthy = health?.status === 'ok';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">System Health</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time status tracking of all underlying service integrations and databases.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-55 hover:text-neutral-800 disabled:opacity-50 transition shadow-sm"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Global Banner status */}
      <div
        className={`rounded-xl border p-6 flex items-start gap-4 shadow-sm
          ${isHealthy 
            ? 'bg-green-50 border-green-100 text-green-800' 
            : 'bg-red-50 border-red-100 text-red-800'
          }
        `}
      >
        {isHealthy ? (
          <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
        ) : (
          <ShieldAlert className="h-8 w-8 text-red-600 shrink-0" />
        )}
        <div>
          <h2 className="text-lg font-bold">
            {isHealthy ? 'All Systems Operational' : 'Infrastructure Issues Detected'}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {isHealthy
              ? 'All backing databases, message queues, and external AI providers are responsive.'
              : 'One or more system integration gates are currently unreachable or reporting latency.'}
          </p>
        </div>
      </div>

      {/* Infrastructure Components List */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            System Components
          </h3>
        </div>
        {statusItems.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {statusItems.map((item, idx) => {
              const itemHealthy = item.status === 'up' || item.status === 'ok';

              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-800 tracking-wide">
                      {item.name}
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Component key: <span className="font-mono text-[10px] bg-neutral-50 px-1 rounded">{item.name.toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide
                        ${itemHealthy
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                        }
                      `}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
            <h4 className="text-sm font-semibold text-neutral-700 mt-3">No Components Reported</h4>
            <p className="text-xs text-neutral-400 mt-1">
              The health check did not return detailed infrastructure statistics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
