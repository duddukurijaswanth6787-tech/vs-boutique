import { apiClient } from '@/lib/api/client';
import {
  PermissionResponse,
  RoleResponse,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './access.types';
import { StandardResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const accessService = {
  // Roles
  async getRoles(): Promise<RoleResponse[]> {
    const res = await apiClient.get<ApiResponse<RoleResponse[]>>('/roles');
    return res.data.data!;
  },

  async getRoleById(id: string): Promise<RoleResponse> {
    const res = await apiClient.get<ApiResponse<RoleResponse>>(`/roles/${id}`);
    return res.data.data!;
  },

  async createRole(dto: CreateRoleDto): Promise<RoleResponse> {
    const res = await apiClient.post<ApiResponse<RoleResponse>>('/roles', dto);
    return res.data.data!;
  },

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
    const res = await apiClient.patch<ApiResponse<RoleResponse>>(`/roles/${id}`, dto);
    return res.data.data!;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },

  async assignPermissionsToRole(id: string, permissionIds: string[]): Promise<RoleResponse> {
    const res = await apiClient.post<ApiResponse<RoleResponse>>(`/roles/${id}/permissions`, {
      permissionIds,
    });
    return res.data.data!;
  },

  async removePermissionFromRole(id: string, permissionId: string): Promise<RoleResponse> {
    const res = await apiClient.delete<ApiResponse<RoleResponse>>(`/roles/${id}/permissions/${permissionId}`);
    return res.data.data!;
  },

  // Permissions
  async getPermissions(module?: string): Promise<PermissionResponse[]> {
    const res = await apiClient.get<ApiResponse<PermissionResponse[]>>('/permissions', {
      params: { module },
    });
    return res.data.data!;
  },

  async getPermissionById(id: string): Promise<PermissionResponse> {
    const res = await apiClient.get<ApiResponse<PermissionResponse>>(`/permissions/${id}`);
    return res.data.data!;
  },

  async createPermission(dto: CreatePermissionDto): Promise<PermissionResponse> {
    const res = await apiClient.post<ApiResponse<PermissionResponse>>('/permissions', dto);
    return res.data.data!;
  },

  async updatePermission(id: string, dto: UpdatePermissionDto): Promise<PermissionResponse> {
    const res = await apiClient.patch<ApiResponse<PermissionResponse>>(`/permissions/${id}`, dto);
    return res.data.data!;
  },

  async deletePermission(id: string): Promise<void> {
    await apiClient.delete(`/permissions/${id}`);
  },

  // Staff Assignment
  async assignRoleToStaff(staffUserId: string, roleId: string): Promise<unknown> {
    const res = await apiClient.post<ApiResponse<unknown>>(`/users/${staffUserId}/roles`, {
      roleId,
    });
    return res.data.data!;
  },

  async removeRoleFromStaff(staffUserId: string, roleId: string): Promise<unknown> {
    const res = await apiClient.delete<ApiResponse<unknown>>(`/users/${staffUserId}/roles/${roleId}`);
    return res.data.data!;
  },
};
