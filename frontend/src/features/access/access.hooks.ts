import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessService } from './access.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, UpdatePermissionDto } from './access.types';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => accessService.getRoles(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => accessService.getRoleById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoleDto) => accessService.createRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRoleDto }) =>
      accessService.updateRole(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      accessService.assignPermissionsToRole(id, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useRemovePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionId }: { id: string; permissionId: string }) =>
      accessService.removePermissionFromRole(id, permissionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function usePermissions(module?: string) {
  return useQuery({
    queryKey: ['permissions', module],
    queryFn: () => accessService.getPermissions(module),
  });
}

export function usePermission(id: string) {
  return useQuery({
    queryKey: ['permission', id],
    queryFn: () => accessService.getPermissionById(id),
    enabled: !!id,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePermissionDto) => accessService.createPermission(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePermissionDto }) =>
      accessService.updatePermission(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
}

export function useAssignRoleToStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffUserId, roleId }: { staffUserId: string; roleId: string }) =>
      accessService.assignRoleToStaff(staffUserId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.staffUserId] }); // invalidates user role
      queryClient.invalidateQueries({ queryKey: ['staffMember'] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}

export function useRemoveRoleFromStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffUserId, roleId }: { staffUserId: string; roleId: string }) =>
      accessService.removeRoleFromStaff(staffUserId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.staffUserId] });
      queryClient.invalidateQueries({ queryKey: ['staffMember'] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
    },
  });
}
