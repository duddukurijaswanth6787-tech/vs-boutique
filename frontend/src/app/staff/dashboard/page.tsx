'use client';

import React from 'react';
import Link from 'next/link';
import { useOrderList, useOrderStatistics } from '@/features/orders/order.hooks';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';
import { formatMoney, formatDateTime } from '@/utils/format';
import { Package, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function StaffDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useOrderStatistics();
  const { data: orders, isLoading: ordersLoading, isError, refetch } = useOrderList({ page: 1, limit: 5, status: 'PENDING' });

  if (statsLoading || ordersLoading) return <SectionLoader message="Loading dashboard..." />;
  if (isError) return <PageError title="Load Failure" message="Could not load dashboard data." retry={refetch} />;

  const statCards = [
    { label: 'Total Orders', value: stats?.total ?? 0, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Processing', value: stats?.processing ?? 0, icon: Package, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Shipped', value: stats?.shipped ?? 0, icon: Package, color: 'bg-purple-50 text-purple-600' },
    { label: 'Delivered', value: stats?.delivered ?? 0, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Cancelled', value: stats?.cancelled ?? 0, icon: XCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Staff Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Your operational overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xl font-bold text-neutral-900">{value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900">Pending Orders</h2>
            <Link href="/admin/orders?status=PENDING" className="text-xs font-bold text-[#7A1C30] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {orders?.data && orders.data.length > 0 ? (
            <div className="space-y-3">
              {orders.data.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-neutral-900">#{order.orderNumber}</span>
                    <p className="text-[10px] text-neutral-400">{order.customerName ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-900">{formatMoney(order.grandTotal)}</span>
                    <p className="text-[10px] text-neutral-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No Pending Orders" description="All orders are processed." />
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/staff/packing" className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <Package className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">Packing Queue</span>
            </Link>
            <Link href="/staff/warehouse" className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <Package className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">Warehouse Ops</span>
            </Link>
            <Link href="/staff/support" className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <Package className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">Support Tickets</span>
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <Package className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700">All Orders</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
