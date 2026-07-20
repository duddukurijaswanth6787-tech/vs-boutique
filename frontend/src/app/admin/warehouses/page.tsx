'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWarehouseList, useDeleteWarehouse, useRestoreWarehouse } from '@/features/warehouse/warehouse.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { Plus, Search, Eye, Edit3, Trash2, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import WarehouseDialog from '@/features/warehouse/components/WarehouseDialog';
import { useAuth } from '@/hooks/useAuth';

export default function WarehousesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeWarehouse, setActiveWarehouse] = useState<React.ComponentProps<typeof WarehouseDialog>['warehouse'] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: listData, isLoading, isError, refetch } = useWarehouseList({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });

  // Mutations
  const deleteMut = useDeleteWarehouse();
  const restoreMut = useRestoreWarehouse();

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/warehouses?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive warehouse "${name}"?`)) return;
    try {
      await deleteMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isSuperAdmin = user?.roles?.includes('super_admin');
  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Warehouse Directory</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage corporate storage locations, bins, layout zones, and check allocations.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveWarehouse(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Warehouse
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by code or name..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={status}
            onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving warehouse registries..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch warehouse directories from backend." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Code</th>
                  <th className="p-4">Name & Description</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((wh) => (
                  <tr key={wh.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[10px] text-neutral-900 flex items-center gap-2">
                      {wh.code}
                      {wh.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold">
                          <Home className="w-2.5 h-2.5" /> Default
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{wh.name}</div>
                      <div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{wh.description || 'No description'}</div>
                    </td>
                    <td className="p-4">
                      {wh.contactPerson ? (
                        <div>
                          <div className="font-semibold text-neutral-800">{wh.contactPerson}</div>
                          <div className="text-[10px] text-neutral-400">{wh.phone || 'No phone'}</div>
                          {wh.email && <div className="text-[10px] text-neutral-400 font-mono">{wh.email}</div>}
                        </div>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {wh.address ? (
                        <div>
                          <div className="font-semibold text-neutral-800">{wh.address}</div>
                          <div className="text-[10px] text-neutral-400">
                            {wh.city}, {wh.state} {wh.postalCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${wh.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                      `}>
                        {wh.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/warehouses/${wh.id}`}
                          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                          title="View layout details & inventory"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveWarehouse(wh);
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            title="Edit settings"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {wh.status === 'ARCHIVED' ? (
                          isSuperAdmin && (
                            <button
                              onClick={() => handleRestore(wh.id)}
                              className="p-1.5 hover:bg-green-50 rounded text-green-600 hover:text-green-800"
                              title="Restore warehouse"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(wh.id, wh.name)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600 hover:text-red-800"
                              title="Archive warehouse"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                      No warehouses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', page - 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', page + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Warehouse Dialog */}
      {isDialogOpen && (
        <WarehouseDialog
          warehouse={activeWarehouse ?? undefined}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveWarehouse(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
