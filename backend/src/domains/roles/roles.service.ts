import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { CacheService } from '@infrastructure/redis/cache.service';
import { AuditService } from '@domains/audit/audit.service';
import { RolesRepository } from './roles.repository';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  RoleResponse,
} from './roles.types';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly loggerService: LoggerService,
    private readonly cache: CacheService,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(role: any): RoleResponse {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      scope: role.scope,
      hierarchy: role.hierarchy,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions:
        role.rolePermissions?.map((rp: any) => rp.permission.code) ?? [],
    };
  }

  async findAll() {
    const roles = await this.rolesRepository.findAll();
    return roles.map((r) => this.toResponse(r));
  }

  async findById(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');
    return this.toResponse(role);
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.rolesRepository.findByName(dto.name);
    if (existing)
      throw new BusinessException('Role name already exists', 'ROLE_002');
    const role = await this.rolesRepository.create(dto);
    this.loggerService.log(
      { action: 'role_created', roleId: role.id, name: role.name },
      'RolesService',
    );
    await this.cache.delPattern('perms:*');
    await this.auditService.log({
      action: 'ROLE_CREATED',
      module: 'roles',
      resource: 'role',
      resourceId: role.id,
      newValue: { name: role.name },
    });
    return this.toResponse({ ...role, rolePermissions: [] });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');
    if (role.isSystem)
      throw new BusinessException('Cannot modify system roles', 'ROLE_003');
    const updated = await this.rolesRepository.update(id, dto);
    this.loggerService.log(
      { action: 'role_updated', roleId: id },
      'RolesService',
    );
    await this.auditService.log({
      action: 'ROLE_UPDATED',
      module: 'roles',
      resource: 'role',
      resourceId: id,
      oldValue: { name: role.name },
      newValue: { ...dto },
    });
    await this.cache.delPattern('perms:*');
    return this.toResponse({
      ...updated,
      rolePermissions: role.rolePermissions,
    });
  }

  async delete(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');
    if (role.isSystem)
      throw new BusinessException('Cannot delete system roles', 'ROLE_003');
    await this.rolesRepository.delete(id);
    this.loggerService.log(
      { action: 'role_deleted', roleId: id },
      'RolesService',
    );
    await this.auditService.log({
      action: 'ROLE_DELETED',
      module: 'roles',
      resource: 'role',
      resourceId: id,
    });
    await this.cache.delPattern('perms:*');
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');
    await this.rolesRepository.assignPermissions(id, dto.permissionIds);
    this.loggerService.log(
      {
        action: 'permissions_assigned',
        roleId: id,
        count: dto.permissionIds.length,
      },
      'RolesService',
    );
    await this.auditService.log({
      action: 'ROLE_PERMISSIONS_ASSIGNED',
      module: 'roles',
      resource: 'role',
      resourceId: id,
      newValue: { permissionIds: dto.permissionIds },
    });
    await this.cache.delPattern('perms:*');
    return this.findById(id);
  }

  async removePermission(id: string, permissionId: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');
    await this.rolesRepository.removePermission(id, permissionId);
    this.loggerService.log(
      { action: 'permission_removed', roleId: id, permissionId },
      'RolesService',
    );
    await this.auditService.log({
      action: 'ROLE_PERMISSION_REMOVED',
      module: 'roles',
      resource: 'role',
      resourceId: id,
      oldValue: { permissionId },
    });
    await this.cache.delPattern('perms:*');
    return this.findById(id);
  }
}
