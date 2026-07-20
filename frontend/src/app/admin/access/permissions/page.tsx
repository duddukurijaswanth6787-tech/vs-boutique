'use client';

import React, { useState } from 'react';
import {
  usePermissions,
} from '@/features/access/access.hooks';
import {
  Shield,
  Search,
  Lock,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

export default function PermissionsPage() {
  const { data: permissions, isLoading } = usePermissions();
  const [search, setSearch] = useState('');

  if (isLoading) {
    return <SectionLoader message="Loading permissions catalog..." />;
  }

  const list = permissions || [];

  const filtered = list.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Group by module/domain
  const grouped = filtered.reduce((acc, curr) => {
    const group = curr.module.toUpperCase();
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Permissions Catalog</h1>
          <p className="text-sm text-neutral-500 mt-1">Read-only index of system security rules seeded in the database.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 border uppercase border-neutral-200">
          <Lock className="h-3.5 w-3.5" /> System Seeded
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      {/* Grouped list */}
      <div className="space-y-6">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([group, permissionsList]) => (
            <div key={group} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-950 uppercase border-b border-neutral-50 pb-2">
                {group} Module Permissions
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {permissionsList.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3"
                  >
                    <div className="rounded p-1 bg-white text-neutral-400 border border-neutral-100 mt-0.5">
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{perm.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">{perm.code}</span>
                      {perm.description && (
                        <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl bg-white">
            No permissions found matching search query.
          </div>
        )}
      </div>
    </div>
  );
}
