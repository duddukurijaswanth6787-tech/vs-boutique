'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRole } from '@/features/access/access.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { ChevronLeft, Shield } from 'lucide-react';

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: role, isLoading, isError, refetch } = useRole(id);

  if (isLoading) return <SectionLoader message="Loading role details..." />;
  if (isError || !role) return <PageError title="Role not found" message="Could not load role details." retry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/access/roles" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
        <h1 className="text-xl font-bold text-neutral-900">{role.name}</h1>
        <p className="text-xs text-neutral-500">{role.description ?? 'No description'}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Permissions</h3>
        {role.permissions && role.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {role.permissions.map((perm: string) => (
              <span key={perm} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-700">
                <Shield className="w-3 h-3" />
                {perm}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">No permissions assigned.</p>
        )}
      </div>
    </div>
  );
}
