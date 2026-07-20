'use client';

import React, { useState } from 'react';
import {
  useStaffList, useCreateStaff, useActivateStaff, useDeactivateStaff,
  useSuspendStaff, useDeleteStaff, useRestoreStaff, useBulkStaff, useInviteStaff,
} from '@/features/staff/staff.hooks';
import { useRoles } from '@/features/access/access.hooks';
import { StaffResponse, StaffDepartment, StaffDesignation } from '@/features/staff/staff.types';
import { User, Plus, Search, Eye, ToggleLeft, ToggleRight, ShieldAlert, Download, Trash2, RotateCcw, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import Dialog from '@/components/ui/Dialog';
import { useExport } from '@/lib/bulk/useExport';
import BulkActionBar from '@/components/ui/BulkActionBar';

const DEPARTMENTS: StaffDepartment[] = ['MANAGEMENT', 'SALES', 'MARKETING', 'WAREHOUSE', 'PACKING', 'CUSTOMER_SUPPORT', 'INVENTORY', 'ACCOUNTING', 'IT'];
const DESIGNATIONS: StaffDesignation[] = ['MANAGER', 'SUPERVISOR', 'EXECUTIVE', 'ASSOCIATE', 'TRAINEE'];

export default function StaffPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showDeleted = searchParams.get('deleted') === 'true';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState<string>('');
  const [desg, setDesg] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useStaffList({
    page, limit: 10, search: search || undefined,
    department: (dept as StaffDepartment) || undefined,
    designation: (desg as StaffDesignation) || undefined,
    ...(showDeleted ? { deleted: true } : {}),
  });

  const { data: roles } = useRoles();

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    department: 'SALES' as StaffDepartment, designation: 'ASSOCIATE' as StaffDesignation,
    employeeId: '', jobTitle: '',
  });
  const [inviteData, setInviteData] = useState({
    email: '', firstName: '', lastName: '', department: 'SALES' as StaffDepartment,
    designation: 'ASSOCIATE' as StaffDesignation, employeeId: '', roleIds: [] as string[],
  });

  const createMutation = useCreateStaff();
  const inviteMutation = useInviteStaff();
  const activateMutation = useActivateStaff();
  const deactivateMutation = useDeactivateStaff();
  const suspendMutation = useSuspendStaff();
  const bulkMut = useBulkStaff();
  const { triggerExport, isExporting } = useExport();

  const handleExport = () => triggerExport({ entity: 'Staff', filters: { search } });
  const toggleDeleted = () => router.push(showDeleted ? '/admin/staff' : '/admin/staff?deleted=true');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', department: 'SALES', designation: 'ASSOCIATE', employeeId: '', jobTitle: '' });
    refetch();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteMutation.mutateAsync(inviteData);
    setIsInviteOpen(false);
    setInviteData({ email: '', firstName: '', lastName: '', department: 'SALES', designation: 'ASSOCIATE', employeeId: '', roleIds: [] });
    refetch();
  };

  const handleToggleStatus = async (staff: StaffResponse) => {
    if (staff.accountStatus === 'ACTIVE') {
      if (confirm('Deactivate this staff account?')) { await deactivateMutation.mutateAsync(staff.id); refetch(); }
    } else {
      if (confirm('Activate this staff account?')) { await activateMutation.mutateAsync(staff.id); refetch(); }
    }
  };

  const handleSuspend = async (staff: StaffResponse) => {
    if (confirm('Suspend this staff account?')) { await suspendMutation.mutateAsync(staff.id); refetch(); }
  };

  if (isError) return <PageError title="Connection Failure" message="Could not fetch staff directory." retry={refetch} />;
  if (isLoading) return <SectionLoader message="Loading staff directory..." />;

  const staffList = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const allIds = staffList.map((s: StaffResponse) => s.id);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const handleSelectAll = (checked: boolean) => setSelectedIds(checked ? new Set(allIds) : new Set());
  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Staff</span><span>/</span><span className="text-[#8B5A6B]">Management</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Staff Management</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage operators, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={toggleDeleted}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold shadow-sm cursor-pointer ${showDeleted ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'}`}>
            <Trash2 className="w-3.5 h-3.5" /> {showDeleted ? 'Showing Deleted' : 'Show Deleted'}
          </button>
          <button onClick={handleExport} disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-white text-xs font-bold text-neutral-700 shadow-sm cursor-pointer disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button onClick={() => setIsInviteOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
            <Mail className="w-4 h-4" /> Invite Staff
          </button>
          <button onClick={() => setIsCreateOpen(true)}
            className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> Add Direct
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 bg-white border border-neutral-200/60 p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" placeholder="Search by name, email, employee ID..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950" />
        </div>
        <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={desg} onChange={(e) => { setDesg(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Designations</option>
          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-10"><input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label="Select all" /></th>
                <th className="p-4">Staff</th>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {staffList.length > 0 ? staffList.map((s: StaffResponse) => (
                <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 w-10">
                    <input type="checkbox" checked={selectedIds.has(s.id)} onChange={(e) => handleSelectOne(s.id, e.target.checked)}
                      className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label={`Select ${s.firstName}`} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2 text-neutral-500"><User className="h-4 w-4" /></div>
                      <div>
                        <Link href={`/admin/staff/${s.id}`} className="font-bold text-neutral-900 hover:underline">
                          {s.firstName} {s.lastName || ''}
                        </Link>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-neutral-600">{s.employeeId}</td>
                  <td className="p-4"><span className="font-semibold text-neutral-700">{s.department}</span></td>
                  <td className="p-4"><span className="text-neutral-600">{s.designation}</span></td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${s.accountStatus === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : ''}
                      ${s.accountStatus === 'INACTIVE' ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' : ''}
                      ${s.accountStatus === 'SUSPENDED' || s.accountStatus === 'LOCKED' ? 'bg-red-50 text-red-700 border border-red-100' : ''}
                      ${s.accountStatus === 'PENDING_VERIFICATION' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : ''}
                    `}>{s.accountStatus}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link href={`/admin/staff/${s.id}`}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent hover:border-neutral-200 transition-all"
                        aria-label={`View ${s.firstName}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleToggleStatus(s)}
                        className={`rounded p-1.5 border border-transparent transition-all ${s.accountStatus === 'ACTIVE' ? 'text-green-600 hover:bg-green-50 hover:border-green-200' : 'text-neutral-500 hover:bg-neutral-100 hover:border-neutral-200'}`}
                        aria-label={s.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        {s.accountStatus === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      {s.accountStatus !== 'SUSPENDED' && s.accountStatus !== 'LOCKED' && (
                        <button onClick={() => handleSuspend(s)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all"
                          aria-label="Suspend">
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-8 text-center text-neutral-400">No staff members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <span className="text-xs text-neutral-500">Page {page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        isRunning={bulkMut.isPending}
        result={bulkMut.data}
        actions={showDeleted
          ? [{ label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }), variant: 'default' as const }]
          : [
              { label: 'Activate', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'activate' }), variant: 'default' as const },
              { label: 'Deactivate', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'deactivate' }), variant: 'default' as const },
              { label: 'Suspend', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'suspend' }), variant: 'default' as const },
              { label: 'Delete', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'delete' }), variant: 'danger' as const },
            ]
        }
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Staff Directly" subtitle="Create staff account with password set by admin." size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4" id="staff-create-form">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">First Name</label>
              <input type="text" required autoFocus value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Last Name</label>
              <input type="text" required value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Email</label>
              <input type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Password</label>
              <input type="password" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Employee ID</label>
              <input type="text" required value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone</label>
              <input type="text" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Department</label>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value as StaffDepartment })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Designation</label>
              <select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value as StaffDesignation })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white">
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Job Title</label>
            <input type="text" value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition">Cancel</button>
            <button type="submit" disabled={createMutation.isPending}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center">
              {createMutation.isPending && <ButtonLoader />} {createMutation.isPending ? 'Saving...' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Staff Member" subtitle="Send an email invitation with activation link. Staff sets own password." size="lg">
        <form onSubmit={handleInviteSubmit} className="space-y-4" id="staff-invite-form">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">First Name</label>
              <input type="text" required autoFocus value={inviteData.firstName}
                onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Last Name</label>
              <input type="text" value={inviteData.lastName}
                onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Email Address</label>
            <input type="email" required value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Department</label>
              <select value={inviteData.department} onChange={(e) => setInviteData({ ...inviteData, department: e.target.value as StaffDepartment })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Designation</label>
              <select value={inviteData.designation} onChange={(e) => setInviteData({ ...inviteData, designation: e.target.value as StaffDesignation })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none bg-white">
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">Employee ID</label>
            <input type="text" required value={inviteData.employeeId}
              onChange={(e) => setInviteData({ ...inviteData, employeeId: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none" />
          </div>
          {roles && roles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.filter((r: any) => !r.isSystem || r.name === 'staff').map((role: any) => (
                  <label key={role.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={inviteData.roleIds.includes(role.id)}
                      onChange={(e) => {
                        setInviteData({
                          ...inviteData,
                          roleIds: e.target.checked
                            ? [...inviteData.roleIds, role.id]
                            : inviteData.roleIds.filter(id => id !== role.id),
                        });
                      }}
                      className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" />
                    {role.displayName}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button type="button" onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition">Cancel</button>
            <button type="submit" disabled={inviteMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center">
              {inviteMutation.isPending && <ButtonLoader />} {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
