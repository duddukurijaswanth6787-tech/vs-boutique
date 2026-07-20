import { apiClient } from '@/lib/api/client';
import { BulkOperationResult, BulkOperationDto } from '@/features/bulk/bulk.types';
import {
  CreateStaffDto, UpdateStaffDto, StaffQueryDto, StaffResponse,
  StaffDetailResponse, InviteStaffDto, AcceptInviteDto,
  StaffInvitation, PermissionOverride,
} from './staff.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const staffService = {
  async getStaffList(query: StaffQueryDto): Promise<PaginatedResponse<StaffResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StaffResponse>>>('/staff', { params: query });
    return res.data.data!;
  },

  async getStaffById(id: string): Promise<StaffDetailResponse> {
    const res = await apiClient.get<ApiResponse<StaffDetailResponse>>(`/staff/${id}`);
    return res.data.data!;
  },

  async createStaff(dto: CreateStaffDto): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>('/staff', dto);
    return res.data.data!;
  },

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<StaffResponse> {
    const res = await apiClient.patch<ApiResponse<StaffResponse>>(`/staff/${id}`, dto);
    return res.data.data!;
  },

  async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },

  bulk: async (dto: BulkOperationDto): Promise<BulkOperationResult> => {
    const res = await apiClient.post<StandardResponse<BulkOperationResult>>('/staff/bulk', dto);
    return res.data.data!;
  },

  async restoreStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/restore`);
    return res.data.data!;
  },

  async activateStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/activate`);
    return res.data.data!;
  },

  async deactivateStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/deactivate`);
    return res.data.data!;
  },

  async suspendStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/suspend`);
    return res.data.data!;
  },

  async lockStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/lock`);
    return res.data.data!;
  },

  async unlockStaff(id: string): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${id}/unlock`);
    return res.data.data!;
  },

  // --- Invitation endpoints ---

  async inviteStaff(dto: InviteStaffDto): Promise<StaffResponse & { invitationToken?: string }> {
    const res = await apiClient.post<ApiResponse<StaffResponse & { invitationToken?: string }>>('/staff/invite', dto);
    return res.data.data!;
  },

  async acceptInvite(dto: AcceptInviteDto): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>('/staff/accept-invite', dto);
    return res.data.data!;
  },

  async resendInvite(id: string): Promise<{ invitationToken?: string }> {
    const res = await apiClient.post<ApiResponse<{ invitationToken?: string }>>(`/staff/${id}/resend-invite`);
    return res.data.data!;
  },

  async cancelInvite(id: string): Promise<void> {
    await apiClient.post(`/staff/${id}/cancel-invite`);
  },

  async getInvitations(id: string): Promise<StaffInvitation[]> {
    const res = await apiClient.get<ApiResponse<StaffInvitation[]>>(`/staff/${id}/invitations`);
    return res.data.data!;
  },

  // --- Permission override endpoints ---

  async assignPermissionOverride(staffId: string, permissionCode: string, isGranted: boolean): Promise<StaffResponse> {
    const res = await apiClient.post<ApiResponse<StaffResponse>>(`/staff/${staffId}/permission-overrides`, { permissionCode, isGranted });
    return res.data.data!;
  },

  async removePermissionOverride(staffId: string, permissionCode: string): Promise<StaffResponse> {
    const res = await apiClient.delete<ApiResponse<StaffResponse>>(`/staff/${staffId}/permission-overrides/${permissionCode}`);
    return res.data.data!;
  },

  async getPermissionOverrides(staffId: string): Promise<PermissionOverride[]> {
    const res = await apiClient.get<ApiResponse<PermissionOverride[]>>(`/staff/${staffId}/permission-overrides`);
    return res.data.data!;
  },
};
