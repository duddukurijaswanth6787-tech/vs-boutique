'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  useCustomers,
  useActivateCustomer,
  useDeactivateCustomer,
  useSuspendCustomer,
} from '@/features/customers/customers.hooks';
import { UserProfileResponse } from '@/features/customers/customers.types';
import {
  User,
  Search,
  Eye,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  LayoutGrid,
  List,
  CheckCircle2,
  UserPlus,
  Clock,
  Wallet,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError, ButtonLoader, EmptyState } from '@/components/feedback/FeedbackStates';
import Dialog from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { apiClient } from '@/lib/api/client';
import { X } from 'lucide-react';
import { useBulkOperation } from '@/lib/bulk/useBulkOperation';
import { useExport } from '@/lib/bulk/useExport';
import BulkActionBar from '@/components/ui/BulkActionBar';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Queries
  const { data: apiData, isLoading, isError, refetch } = useCustomers({
    page,
    limit: 100,
    search: searchQuery || undefined,
    status: statusFilter !== 'All' ? statusFilter.toUpperCase() : undefined,
  });

  const activateMutation = useActivateCustomer();
  const deactivateMutation = useDeactivateCustomer();
  const suspendMutation = useSuspendCustomer();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const customerList = apiData?.data ?? [];
  const liveTotal = apiData?.meta?.total ?? 0;
  const activeCount = customerList.filter(c => c.accountStatus === 'ACTIVE').length;
  const [thirtyDaysAgoMs] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newCount = useMemo(
    () =>
      customerList.filter(
        c => new Date(c.createdAt).getTime() >= thirtyDaysAgoMs,
      ).length,
    [customerList, thirtyDaysAgoMs],
  );
  const repeatCount = customerList.filter(c => c.lastLoginAt).length;

  // Filter list locally from API data
  const filteredCustomers = customerList.filter(c => {
    const fullName = `${c.firstName} ${c.lastName ?? ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone ?? '').includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && c.accountStatus === 'ACTIVE') ||
                          (statusFilter === 'Inactive' && c.accountStatus === 'INACTIVE');

    return matchesSearch && matchesStatus;
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filteredIds = filteredCustomers.map(c => c.id);
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredIds));
    else setSelectedIds(new Set());
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const bulkActivate = useBulkOperation((id) => activateMutation.mutateAsync(id), () => refetch());
  const bulkDeactivate = useBulkOperation((id) => deactivateMutation.mutateAsync(id), () => refetch());
  const bulkSuspend = useBulkOperation((id) => suspendMutation.mutateAsync(id), () => refetch());

  const { triggerExport, isExporting } = useExport();
  const handleExport = () => triggerExport({ entity: 'Customer', filters: { status: statusFilter } });

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Customers</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Manage</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Customers</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage and track your store customers</p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* 5 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Customers</span>
            <span className="text-2xl font-bold text-neutral-900">{liveTotal.toLocaleString()}</span>
            <span className="text-[10px] text-neutral-400 font-bold block">No trend available</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7A1C30] flex items-center justify-center shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Active Customers</span>
            <span className="text-2xl font-bold text-neutral-900">{activeCount.toLocaleString()}</span>
            <span className="text-[10px] text-green-600 font-bold block">{((activeCount / liveTotal) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">New Customers</span>
            <span className="text-2xl font-bold text-neutral-900">{newCount}</span>
            <span className="text-[10px] text-neutral-400 font-bold block">No trend available</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* Repeat Customers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Repeat Customers</span>
            <span className="text-2xl font-bold text-neutral-900">{repeatCount.toLocaleString()}</span>
            <span className="text-[10px] text-amber-600 font-bold block">{((repeatCount / liveTotal) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Logged In Users */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Returning</span>
            <span className="text-xl font-bold text-neutral-900">{repeatCount}</span>
            <span className="text-[10px] text-green-600 font-bold block">{liveTotal > 0 ? ((repeatCount / liveTotal) * 100).toFixed(1) + '% returned' : '—'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2 text-xs text-neutral-900 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[10px] text-neutral-400 font-bold">Ctrl + K</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white"
          >
            <option value="All">Customer Group: All</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
            <option value="New">New</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white"
          >
            <option value="All">Location: All</option>
          </select>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={handleExport} disabled={isExporting} className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-white text-xs font-bold text-neutral-700 shadow-sm cursor-pointer disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          <div className="flex border border-neutral-200 p-1 rounded-xl bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      {isLoading ? (
        <SectionLoader message="Retrieving customers queue..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch customer data from server." retry={refetch} />
      ) : !customerList.length ? (
        <EmptyState
          title="No customers found"
          description="No customer accounts match your search criteria."
          action={
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="rounded-xl bg-neutral-900 px-4 h-9 text-sm font-medium text-white hover:bg-neutral-800 transition"
            >
              Clear Filters
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" /></th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Email / Phone</th>
                    <th className="p-4">Location</th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4">Total Spent</th>
                    <th className="p-4">Customer Group</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredCustomers.map((c) => {
                    const customerName = `${c.firstName} ${c.lastName ?? ''}`.trim();
                    return (
                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={(e) => handleSelectOne(c.id, e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" />
                      </td>

                      {/* Customer Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 overflow-hidden shrink-0 flex items-center justify-center">
                            <User className="w-5 h-5 text-neutral-400" />
                          </div>
                          <div>
                            <Link href={`/admin/customers/${c.id}`} className="font-bold text-neutral-900 hover:underline block">
                              {customerName}
                            </Link>
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">#{c.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email and Phone contacts */}
                      <td className="p-4">
                        <span className="font-semibold text-neutral-800 block">{c.email}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">{c.phone ?? '—'}</span>
                      </td>

                      {/* Location */}
                      <td className="p-4"><span className="text-[10px] text-neutral-400">—</span></td>

                      {/* Order Count */}
                      <td className="p-4 text-center font-bold text-neutral-800">—</td>

                      {/* Total spent */}
                      <td className="p-4 font-bold text-neutral-800">—</td>

                      {/* Group */}
                      <td className="p-4"><span className="text-[10px] text-neutral-400">—</span></td>

                      {/* Status badge */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase
                          ${c.accountStatus === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                        `}>
                          {c.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 font-semibold text-neutral-400">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/admin/customers/${c.id}`} className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm" aria-label={`View ${customerName}`}>
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Suspend this customer profile?')) {
                                try {
                                  await suspendMutation.mutateAsync(c.id);
                                  toast.success('Customer suspended successfully');
                                  refetch();
                                } catch (err: unknown) {
                                  toast.error(
                                    getApiErrorMessage(err) ||
                                      'Failed to suspend customer',
                                  );
                                }
                              }
                            }}
                            className="p-1.5 border border-[#FFEAEA] bg-white rounded-lg hover:bg-[#FFEAEA] text-red-500 shadow-sm"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination Strip */}
          {apiData?.meta && apiData.meta.totalPages > 1 && (
          <div className="flex justify-between items-center text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
            <span>Showing {((page - 1) * 100) + 1} to {Math.min(page * 100, liveTotal)} of {liveTotal.toLocaleString()} customers</span>
            
            <div className="flex items-center gap-3">
              <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 hover:bg-neutral-50 text-neutral-500 flex items-center justify-center border-r border-neutral-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(apiData.meta.totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} type="button" onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs font-bold ${p === page ? 'bg-[#7A1C30] text-white' : 'hover:bg-neutral-50 text-neutral-600'} ${p < Math.min(apiData.meta.totalPages, 5) ? 'border-r border-neutral-200' : ''}`}>{p}</button>
                  );
                })}
                <button type="button" onClick={() => setPage(Math.min(apiData.meta.totalPages, page + 1))} disabled={page === apiData.meta.totalPages} className="p-2 hover:bg-neutral-50 text-neutral-500 flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        isRunning={bulkActivate.isRunning || bulkDeactivate.isRunning || bulkSuspend.isRunning}
        progress={bulkActivate.progress || bulkDeactivate.progress || bulkSuspend.progress}
        total={bulkActivate.total || bulkDeactivate.total || bulkSuspend.total}
        result={bulkActivate.result || bulkDeactivate.result || bulkSuspend.result}
        actions={[
          { label: 'Activate', onClick: () => bulkActivate.execute([...selectedIds]) },
          { label: 'Deactivate', onClick: () => bulkDeactivate.execute([...selectedIds]) },
          { label: 'Suspend', onClick: () => bulkSuspend.execute([...selectedIds]), variant: 'danger' },
        ]}
      />
    </div>
  );
}

function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/users', { ...form, userType: 'CUSTOMER' });
      toast.success('Customer created successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err) ||
          'Failed to create customer',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Add New Customer">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
          <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition">Cancel</button>
          <button type="submit" disabled={loading}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center">
            {loading && <ButtonLoader />} Create Customer
          </button>
        </div>
      </form>
    </Dialog>
  );
}
