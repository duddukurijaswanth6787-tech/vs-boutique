'use client';

import React, { useState } from 'react';
import { useCreateExportJob } from '@/features/reports';
import { FileText, ShoppingBag, Users, Package, ShoppingCart, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReportCenterPage() {
  const createExport = useCreateExportJob();
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const reportsList = [
    {
      id: 'SALES',
      title: 'Sales Report',
      description: 'Audit total gross revenues, average values, and daily order timelines.',
      icon: ShoppingBag,
      href: '/admin/reports/sales',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'ORDER',
      title: 'Order Status Report',
      description: 'Track complete pipelines: pending, processing, shipped, and cancellations.',
      icon: ShoppingCart,
      href: '/admin/reports/orders',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      id: 'INVENTORY',
      title: 'Inventory Report',
      description: 'Check stock items adequacy, warehouse quantities, and low stock warnings.',
      icon: Package,
      href: '/admin/reports/inventory',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      id: 'CUSTOMER',
      title: 'Customer Directory Report',
      description: 'Inspect buyer spend totals, order counts, and registration metrics.',
      icon: Users,
      href: '/admin/reports/customers',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'PAYMENT',
      title: 'Payment Transactions Report',
      description: 'Audit processed payments, methods, and settlement statuses.',
      icon: FileText,
      href: '/admin/reports/payments',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  const handleCreateExport = async (type: 'SALES' | 'ORDER' | 'INVENTORY' | 'CUSTOMER' | 'PAYMENT') => {
    try {
      await createExport.mutateAsync({
        type,
        format: 'CSV',
      });
      setExportSuccess(`Export job for ${type} successfully queued in BullMQ! Check status on the Export Jobs tab.`);
      setTimeout(() => setExportSuccess(null), 8000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Could not spawn export: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b pb-4 border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Report Center</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Generate printable audit logs and schedule background CSV exports.
          </p>
        </div>
        <Link
          href="/admin/reports/exports"
          className="text-xs font-bold text-neutral-900 border border-neutral-300 rounded px-3.5 py-2 hover:bg-neutral-55 transition flex items-center gap-1.5 bg-white shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Inspect Export Jobs
        </Link>
      </div>

      {exportSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Reports Directory Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          return (
            <div key={rep.id} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-neutral-900">{rep.title}</h3>
                  <div className={`rounded-lg border p-2 ${rep.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">{rep.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={rep.href}
                  className="text-xs font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 rounded px-4 py-2 hover:bg-neutral-200 transition text-center flex-1"
                >
                  Run Report
                </Link>
                <button
                  onClick={() => handleCreateExport(rep.id as 'SALES' | 'ORDER' | 'INVENTORY' | 'CUSTOMER' | 'PAYMENT')}
                  disabled={createExport.isPending}
                  className="text-xs font-bold text-white bg-neutral-950 rounded px-4 py-2 hover:bg-neutral-850 transition disabled:opacity-50 text-center flex-1"
                >
                  {createExport.isPending ? 'Spawning...' : 'Export CSV'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
