'use client';

import React from 'react';
import { useSystemHealth } from '@/features/operations';
import { useDashboardSummary } from '@/features/dashboard';
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

const StatusBadge = ({ status }: { status?: string }) => {
  const clean = (status || 'down').toLowerCase();
  if (clean === 'up' || clean === 'ok' || clean === 'healthy') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100">
        Healthy
      </span>
    );
  }
  if (clean === 'degraded' || clean === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-50 text-yellow-700 border border-yellow-100">
        Degraded
      </span>
    );
  }
  if (clean === 'disabled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
        Disabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-100">
      Down
    </span>
  );
};

export default function OperationsCommandCenterPage() {
  const { data: health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useDashboardSummary();

  const handleRetry = () => {
    refetchHealth();
    refetchSummary();
  };

  if (healthLoading || summaryLoading) {
    return <SectionLoader message="Syncing operational metrics..." />;
  }

  if (healthError || summaryError) {
    return (
      <PageError
        title="Sync Failure"
        message="Could not establish connection to the health services."
        retry={handleRetry}
      />
    );
  }

  // Get raw details dictionary from Terminus wrapper
  const details = (health?.info || health?.details || {}) as Record<string, Record<string, unknown> | undefined>;

  // Extract variables safely
  const dbStatus = (details.database?.status as string) || 'down';
  const redisStatus = (details.redis?.status as string) || 'down';
  const queueStatus = (details.queue?.status as string) || 'down';
  const storageStatus = (details.storage?.status as string) || 'down';
  const storageProvider = (details.storage?.provider as string) || 'local';
  const ragStatus = (details.rag?.status as string) || 'down';
  const ragEnabled = details.rag?.enabled ? 'enabled' : 'disabled';
  const appStatus = (details.app?.status as string) || 'up';

  const alerts = [
    { title: 'Pending Orders', value: summary?.pendingOrders || 0, href: '/admin/orders', desc: 'Orders requiring processing action' },
    { title: 'Low Stock Styles', value: summary?.lowStockCount || 0, href: '/admin/inventory', desc: 'Variants near safety stock limits' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Operations Command Center</h1>
          <p className="text-sm text-neutral-500 mt-1">
            System status monitoring, queue health diagnostics, and catalog warnings.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="text-xs font-bold text-neutral-900 border border-neutral-300 rounded px-3.5 py-2 hover:bg-neutral-50 transition flex items-center gap-1 bg-white shadow-sm"
        >
          <RefreshCw className="h-3 w-3" />
          Poll System Health
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subsystems Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-neutral-500" /> Infrastructure Diagnostics
            </h3>
            <div className="divide-y divide-neutral-100 text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <Database className="h-4 w-4 text-neutral-450" /> PostgreSQL Database
                </span>
                <StatusBadge status={dbStatus} />
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-neutral-450" /> Redis Cache Store
                </span>
                <StatusBadge status={redisStatus} />
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-450" /> BullMQ Job Processor
                </span>
                <StatusBadge status={queueStatus} />
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-neutral-450" /> Private Object Storage ({storageProvider.toUpperCase()})
                </span>
                <StatusBadge status={storageStatus} />
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-neutral-450" /> Enterprise RAG Module
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 capitalize">{ragEnabled}</span>
                  <StatusBadge status={ragStatus} />
                </div>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-neutral-600 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-450" /> Application Runtime Host
                </span>
                <StatusBadge status={appStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-neutral-500" /> Action Required Board
            </h3>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-neutral-800">{alert.title}</span>
                    <span className="text-sm font-extrabold text-neutral-950">{alert.value}</span>
                  </div>
                  <p className="text-[10px] text-neutral-450 mt-1">{alert.desc}</p>
                  <Link
                    href={alert.href}
                    className="text-[10px] font-bold text-neutral-950 hover:underline flex items-center gap-0.5 mt-2"
                  >
                    Resolve Pipeline <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
