import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { staffService } from './staff.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { StaffQueryDto, CreateStaffDto, UpdateStaffDto, InviteStaffDto } from './staff.types';

export function useStaffList(query: StaffQueryDto) {
  return useQuery({
    queryKey: ['staffList', query],
    queryFn: () => staffService.getStaffList(query),
  });
}

export function useStaff(id: string) {
  return useQuery({
    queryKey: ['staffMember', id],
    queryFn: () => staffService.getStaffById(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStaffDto) => staffService.createStaff(dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staffList'] }); },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStaffDto }) => staffService.updateStaff(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useRestoreStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.restoreStaff(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', data.id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useActivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.activateStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.deactivateStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useSuspendStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.suspendStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useLockStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.lockStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useUnlockStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.unlockStaff(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staffMember', id] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useBulkStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { ids: string[]; action: string }) => staffService.bulk(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Bulk operation completed');
    },
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Bulk operation failed'); },
  });
}

// --- Invitation hooks ---

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteStaffDto) => staffService.inviteStaff(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      toast.success('Invitation sent successfully');
    },
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Failed to send invitation'); },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (dto: { token: string; password: string; phone?: string }) =>
      staffService.acceptInvite(dto),
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Failed to accept invitation'); },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.resendInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffInvitations'] });
      toast.success('Invitation resent');
    },
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Failed to resend invitation'); },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.cancelInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffInvitations'] });
      toast.success('Invitation cancelled');
    },
  });
}

export function useInvitations(staffId: string) {
  return useQuery({
    queryKey: ['staffInvitations', staffId],
    queryFn: () => staffService.getInvitations(staffId),
    enabled: !!staffId,
  });
}

// --- Permission override hooks ---

export function useAssignPermissionOverride() {
  return useMutation({
    mutationFn: ({ staffId, permissionCode, isGranted }: { staffId: string; permissionCode: string; isGranted: boolean }) =>
      staffService.assignPermissionOverride(staffId, permissionCode, isGranted),
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Failed to assign permission override'); },
  });
}

export function useRemovePermissionOverride() {
  return useMutation({
    mutationFn: ({ staffId, permissionCode }: { staffId: string; permissionCode: string }) =>
      staffService.removePermissionOverride(staffId, permissionCode),
    onError: (err: unknown) => { toast.error(getApiErrorMessage(err) || 'Failed to remove permission override'); },
  });
}

export function usePermissionOverrides(staffId: string) {
  return useQuery({
    queryKey: ['staffPermissionOverrides', staffId],
    queryFn: () => staffService.getPermissionOverrides(staffId),
    enabled: !!staffId,
  });
}

export const staffKeys = { all: ['staff'] as const };
