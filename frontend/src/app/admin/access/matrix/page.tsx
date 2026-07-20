'use client';

import React, { useState } from 'react';
import {
  useRoles,
  usePermissions,
  useAssignPermissions,
  useRemovePermission,
} from '@/features/access/access.hooks';
import { Shield, Settings, Check, X, ShieldAlert } from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function AccessMatrixPage() {
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useRoles();
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  const assignMutation = useAssignPermissions();
  const removeMutation = useRemovePermission();

  const [togglingCell, setTogglingCell] = useState<string | null>(null);

  const handleCellClick = async (roleId: string, roleName: string, permissionId: string, permissionCode: string, currentChecked: boolean) => {
    // Prevent toggling system super_admin role permissions to avoid lockout
    if (roleName === 'super_admin') {
      toast.error('System super_admin role permissions are protected and cannot be altered.');
      return;
    }

    const cellId = `${roleId}-${permissionId}`;
    setTogglingCell(cellId);

    try {
      if (currentChecked) {
        // Remove permission
        await removeMutation.mutateAsync({ id: roleId, permissionId });
      } else {
        // Add permission
        await assignMutation.mutateAsync({ id: roleId, permissionIds: [permissionId] });
      }
      refetchRoles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Access change rejected by server.');
    } finally {
      setTogglingCell(null);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return <SectionLoader message="Loading security configuration matrix..." />;
  }

  const roleList = roles || [];
  const permissionList = permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Role-Permission Matrix</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Visual access control layout. Toggle checkboxes to immediately alter role privilege scopes.
        </p>
      </div>

      {/* Warning Alert */}
      <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 flex gap-3 text-xs leading-relaxed text-yellow-800">
        <ShieldAlert className="h-5 w-5 text-yellow-600 shrink-0" />
        <div>
          <span className="font-bold">Privilege Escalation Guard Active:</span> Modifications to custom roles take effect on the next session login. Protected system roles (such as `super_admin`) are read-only.
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4 w-[250px] sticky left-0 bg-neutral-50 z-10 border-r border-neutral-100">
                Permission Rule Code
              </th>
              {roleList.map((role) => (
                <th key={role.id} className="p-4 text-center">
                  <span className="block font-bold text-neutral-900">{role.displayName}</span>
                  <span className="block text-[9px] text-neutral-400 font-mono mt-0.5 uppercase">
                    {role.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {permissionList.length > 0 ? (
              permissionList.map((perm) => (
                <tr key={perm.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-neutral-900 sticky left-0 bg-white z-10 border-r border-neutral-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="block text-neutral-805 font-sans font-bold">{perm.name}</span>
                    <span className="block text-[10px] text-neutral-400 font-mono mt-0.5">{perm.code}</span>
                  </td>
                  {roleList.map((role) => {
                    const isChecked = role.permissions?.includes(perm.code) || false;
                    const cellId = `${role.id}-${perm.id}`;
                    const isToggling = togglingCell === cellId;

                    return (
                      <td key={role.id} className="p-4 text-center">
                        <button
                          onClick={() =>
                            handleCellClick(role.id, role.name, perm.id, perm.code, isChecked)
                          }
                          disabled={role.isSystem || isToggling}
                          className={`mx-auto h-6 w-6 rounded border flex items-center justify-center transition-all disabled:opacity-50
                            ${
                              isChecked
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-100'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }
                          `}
                        >
                          {isToggling ? (
                            <div className="h-3.5 w-3.5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                          ) : isChecked ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-3 w-3 text-neutral-200" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={roleList.length + 1} className="p-8 text-center text-neutral-400">
                  No security permissions seeded in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
