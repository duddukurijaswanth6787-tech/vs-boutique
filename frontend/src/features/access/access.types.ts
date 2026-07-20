export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  scope: 'GLOBAL' | 'MODULE' | 'DOMAIN' | 'SELF';
  isActive: boolean;
  createdAt: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  scope: 'GLOBAL' | 'DOMAIN' | 'CUSTOM';
  hierarchy: number;
  isSystem: boolean;
  isActive: boolean;
  permissions?: string[]; // array of permission codes or objects
  rolePermissions?: Array<{
    permissionId: string;
    permission: PermissionResponse;
  }>;
  createdAt: string;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  scope?: 'GLOBAL' | 'DOMAIN' | 'CUSTOM';
  hierarchy?: number;
}

export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  hierarchy?: number;
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  permissionIds: string[];
}

export interface CreatePermissionDto {
  code: string;
  name: string;
  description?: string;
  module: string;
  scope?: 'GLOBAL' | 'MODULE' | 'DOMAIN' | 'SELF';
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}
