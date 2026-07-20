'use client';

import React, { useState } from 'react';
import {
  useRoles,
  useCreateRole,
  useDeleteRole,
} from '@/features/access/access.hooks';
import { RoleResponse } from '@/features/access/access.types';
import {
  Shield,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

export default function RolesPage() {
  const { data: roles, isLoading, refetch } = useRoles();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    scope: 'DOMAIN' as 'GLOBAL' | 'DOMAIN' | 'CUSTOM',
    hierarchy: 0,
  });

  const createMutation = useCreateRole();
  const deleteMutation = useDeleteRole();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      scope: 'DOMAIN',
      hierarchy: 0,
    });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete/deactivate this role?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  if (isLoading) {
    return <SectionLoader message="Loading access roles..." />;
  }

  const roleList = roles || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Access Roles</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure security levels and default operators privileges.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> Create Role
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roleList.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <Shield className="h-4 w-4 text-neutral-400" /> {role.displayName}
                </div>
                {role.isSystem ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700">
                    <Lock className="h-2.5 w-2.5" /> System Role
                  </span>
                ) : (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                    Custom Role
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-1 uppercase tracking-wider">Key: {role.name}</p>
              <p className="text-xs text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
                {role.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-50 pt-4 mt-4">
              <span className="text-[10px] text-neutral-400">Hierarchy: {role.hierarchy}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/access/roles/${role.id}`}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 border rounded px-2.5 py-1 bg-white hover:bg-neutral-50"
                >
                  Configure
                </Link>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ROLE DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Create access role</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Role Key (Unique, lowercase)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  placeholder="e.g. order_manager"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  placeholder="e.g. Order Manager"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none h-20 resize-none"
                  placeholder="Summarize access domain scope..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Hierarchy level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hierarchy}
                    onChange={(e) => setFormData({ ...formData, hierarchy: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Scope</label>
                  <select
                    value={formData.scope}
                     onChange={(e) => setFormData({ ...formData, scope: e.target.value as 'GLOBAL' | 'DOMAIN' | 'CUSTOM' })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
