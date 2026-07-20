'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStaff, useUpdateStaff, useActivateStaff, useDeactivateStaff, useSuspendStaff, useLockStaff, useUnlockStaff, useDeleteStaff, useRestoreStaff, useInvitations, useResendInvite, useCancelInvite, usePermissionOverrides, useAssignPermissionOverride, useRemovePermissionOverride } from '@/features/staff/staff.hooks';
import { useRoles } from '@/features/access/access.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import Dialog from '@/components/ui/Dialog';
import { formatDateTime } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { ChevronLeft, User, Mail, Phone, Shield, Key, X } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffInvitation, PermissionOverride } from '@/features/staff/staff.types';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: staff, isLoading, isError, refetch } = useStaff(id);
  const { data: rolesData } = useRoles();
  const roles = rolesData ?? [];
  const { data: invitations, refetch: refetchInv } = useInvitations(staff?.id ?? '');
  const { data: overrides, refetch: refetchOverrides } = usePermissionOverrides(staff?.id ?? '');

  const updateMutation = useUpdateStaff();
  const activateMutation = useActivateStaff();
  const deactivateMutation = useDeactivateStaff();
  const suspendMutation = useSuspendStaff();
  const lockMutation = useLockStaff();
  const unlockMutation = useUnlockStaff();
  const deleteMutation = useDeleteStaff();
  const restoreMutation = useRestoreStaff();
  const resendInvite = useResendInvite();
  const cancelInvite = useCancelInvite();
  const assignOverride = useAssignPermissionOverride();
  const removeOverride = useRemovePermissionOverride();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  if (isLoading) return <SectionLoader message="Loading staff profile..." />;
  if (isError || !staff) return <PageError title="Staff not found" message="Could not load staff profile." retry={refetch} />;

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, dto: editData });
    setEditMode(false);
    refetch();
    toast.success('Staff updated');
  };

  const handleStatusAction = async (action: string) => {
    switch (action) {
      case 'activate': await activateMutation.mutateAsync(id); break;
      case 'deactivate': await deactivateMutation.mutateAsync(id); break;
      case 'suspend': await suspendMutation.mutateAsync(id); break;
      case 'lock': await lockMutation.mutateAsync(id); break;
      case 'unlock': await unlockMutation.mutateAsync(id); break;
      case 'delete':
        if (confirm('Delete this staff member?')) { await deleteMutation.mutateAsync(id); router.push('/admin/staff'); }
        return;
      case 'restore': await restoreMutation.mutateAsync(id); break;
    }
    refetch();
    toast.success(`Staff ${action}d`);
  };

  const handleAssignRole = async (roleId: string) => {
    try {
      const { accessService } = await import('@/features/access/access.service');
      await accessService.assignRoleToStaff(staff.userId, roleId);
      refetch();
      toast.success('Role assigned');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm('Remove this role?')) return;
    try {
      const { accessService } = await import('@/features/access/access.service');
      await accessService.removeRoleFromStaff(staff.userId, roleId);
      refetch();
      toast.success('Role removed');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to remove role');
    }
  };

  const handleToggleOverride = async (code: string, current: boolean) => {
    if (current) {
      await removeOverride.mutateAsync({ staffId: id, permissionCode: code });
    } else {
      await assignOverride.mutateAsync({ staffId: id, permissionCode: code, isGranted: true });
    }
    refetchOverrides();
    refetch();
  };

  const statusVariant = (status: string) => {
    const v: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-100',
      INACTIVE: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      SUSPENDED: 'bg-red-50 text-red-700 border-red-100',
      LOCKED: 'bg-orange-50 text-orange-700 border-orange-100',
      PENDING_VERIFICATION: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      DELETED: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return v[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
  };

  const hasRole = (name: string) => staff.roles.includes(name);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/staff" className="text-neutral-500 hover:text-neutral-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{staff.firstName} {staff.lastName ?? ''}</h1>
            <p className="text-xs text-neutral-500">{staff.employeeId} · {staff.department} · {staff.designation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditMode(!editMode)}
            className="px-3 py-1.5 text-xs font-semibold border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-neutral-400" /><span className="text-xs">{staff.email}</span></div>
            {staff.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-neutral-400" /><span className="text-xs">{staff.phone}</span></div>}
            {staff.gender && <div className="flex items-center gap-2"><User className="w-4 h-4 text-neutral-400" /><span className="text-xs">{staff.gender}</span></div>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Employment</h3>
          <div className="space-y-1 text-xs">
            <p><span className="text-neutral-400">Dept:</span> {staff.department}</p>
            <p><span className="text-neutral-400">Designation:</span> {staff.designation}</p>
            {staff.jobTitle && <p><span className="text-neutral-400">Title:</span> {staff.jobTitle}</p>}
            {staff.employmentType && <p><span className="text-neutral-400">Type:</span> {staff.employmentType}</p>}
            {staff.shift && <p><span className="text-neutral-400">Shift:</span> {staff.shift}</p>}
            {staff.joinedAt && <p><span className="text-neutral-400">Joined:</span> {formatDateTime(staff.joinedAt)}</p>}
            {staff.salary !== undefined && staff.salary !== null && <p><span className="text-neutral-400">Salary:</span> ₹{Number(staff.salary).toLocaleString()}</p>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Status</h3>
          <div className="space-y-2">
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${statusVariant(staff.accountStatus)}`}>
              {staff.accountStatus}
            </span>
            {staff.employmentStatus && <p className="text-xs text-neutral-500">Employment: {staff.employmentStatus}</p>}
            {staff.lastLoginAt && <p className="text-xs text-neutral-400">Last login: {formatDateTime(staff.lastLoginAt)}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {staff.accountStatus !== 'ACTIVE' && <button onClick={() => handleStatusAction('activate')} className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 rounded border border-green-100 cursor-pointer hover:bg-green-100">Activate</button>}
            {staff.accountStatus === 'ACTIVE' && <button onClick={() => handleStatusAction('deactivate')} className="px-2 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded border border-neutral-200 cursor-pointer hover:bg-neutral-200">Deactivate</button>}
            {(staff.accountStatus === 'ACTIVE' || staff.accountStatus === 'INACTIVE') && <button onClick={() => handleStatusAction('suspend')} className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-700 rounded border border-red-100 cursor-pointer hover:bg-red-100">Suspend</button>}
            {staff.accountStatus === 'LOCKED' && <button onClick={() => handleStatusAction('unlock')} className="px-2 py-1 text-[10px] font-bold bg-orange-50 text-orange-700 rounded border border-orange-100 cursor-pointer hover:bg-orange-100">Unlock</button>}
            {staff.accountStatus !== 'DELETED' && <button onClick={() => handleStatusAction('delete')} className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 rounded border border-rose-100 cursor-pointer hover:bg-rose-100">Delete</button>}
            {staff.accountStatus === 'DELETED' && <button onClick={() => handleStatusAction('restore')} className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-100 cursor-pointer hover:bg-blue-100">Restore</button>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Security</h3>
          <div className="space-y-1 text-xs">
            <p><span className="text-neutral-400">Force password change:</span> {staff.forcePasswordChange ? 'Yes' : 'No'}</p>
            <p><span className="text-neutral-400">Roles:</span> {staff.roles?.length ?? 0}</p>
            <p><span className="text-neutral-400">Permissions:</span> {staff.permissions?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5">Assigned Roles</h3>
        <div className="flex flex-wrap gap-2">
          {staff.roles.map((role: string) => (
            <span key={role} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
              {role}
              <button onClick={() => handleRemoveRole(role)} className="hover:text-red-600 cursor-pointer" aria-label={`Remove ${role}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        {roles && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-100">
            {roles.filter((r: { name: string }) => !staff.roles.includes(r.name)).map((role: { id: string; displayName: string }) => (
              <button key={role.id} onClick={() => handleAssignRole(role.id)}
                className="px-2 py-1 text-[10px] font-semibold border border-dashed border-neutral-300 rounded text-neutral-500 hover:border-neutral-600 hover:text-neutral-800 cursor-pointer">
                + {role.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Permission Overrides */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5">Permission Overrides</h3>
        {overrides && overrides.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {overrides.map((ov: PermissionOverride) => (
              <span key={ov.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${ov.isGranted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {ov.isGranted ? '+' : '-'}{ov.permissionCode}
                <button onClick={() => handleToggleOverride(ov.permissionCode, true)} className="hover:text-red-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : <p className="text-xs text-neutral-400">No permission overrides. Permissions are inherited from assigned roles.</p>}
      </div>

      {/* Invitations */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Invitation History</h3>
        {invitations && invitations.length > 0 ? (
          <div className="space-y-2">
            {invitations.map((inv: StaffInvitation) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg text-xs">
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border mr-2
                    ${inv.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                    ${inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                    ${inv.status === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                    ${inv.status === 'CANCELLED' ? 'bg-neutral-100 text-neutral-500 border-neutral-200' : ''}
                  `}>{inv.status}</span>
                  <span className="text-neutral-500">{inv.email} · Expires {formatDateTime(inv.expiresAt)}</span>
                  {inv.acceptedAt && <span className="text-neutral-400 ml-2">· Accepted {formatDateTime(inv.acceptedAt)}</span>}
                </div>
                {inv.status === 'PENDING' && (
                  <div className="flex gap-1">
                    <button onClick={() => { resendInvite.mutateAsync(staff.id); refetchInv(); }}
                      className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-100 cursor-pointer hover:bg-blue-100">Resend</button>
                    <button onClick={() => { cancelInvite.mutateAsync(staff.id); refetchInv(); }}
                      className="px-2 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded border border-neutral-200 cursor-pointer hover:bg-neutral-200">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-neutral-400">No invitations sent.</p>}
      </div>

      {/* Effective Permissions */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Effective Permissions ({staff.permissions?.length ?? 0})</h3>
        {staff.permissions && staff.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {staff.permissions.map((perm: string) => (
              <span key={perm} className="px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-[10px] font-mono text-neutral-600">
                {perm}
              </span>
            ))}
          </div>
        ) : <p className="text-xs text-neutral-400">No permissions assigned.</p>}
      </div>
    </div>
  );
}
