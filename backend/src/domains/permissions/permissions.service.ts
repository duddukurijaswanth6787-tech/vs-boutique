import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { CacheService } from '@infrastructure/redis/cache.service';
import { AuditService } from '@domains/audit/audit.service';
import { PermissionsRepository } from './permissions.repository';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponse,
} from './permissions.types';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly loggerService: LoggerService,
    private readonly cache: CacheService,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(perm: any): PermissionResponse {
    return {
      id: perm.id,
      code: perm.code,
      name: perm.name,
      module: perm.module,
      scope: perm.scope,
      isActive: perm.isActive,
    };
  }

  async findAll(module?: string) {
    const perms = await this.permissionsRepository.findAll(module);
    return perms.map((p) => this.toResponse(p));
  }

  async findById(id: string) {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new BusinessException('Permission not found', 'PERM_001');
    return this.toResponse(perm);
  }

  async create(dto: CreatePermissionDto) {
    const existing = await this.permissionsRepository.findByCode(dto.code);
    if (existing)
      throw new BusinessException('Permission code already exists', 'PERM_002');
    const perm = await this.permissionsRepository.create(dto);
    this.loggerService.log(
      { action: 'permission_created', permissionId: perm.id, code: perm.code },
      'PermissionsService',
    );
    await this.cache.delPattern('perms:*');
    await this.auditService.log({
      action: 'PERMISSION_CREATED',
      module: 'permissions',
      resource: 'permission',
      resourceId: perm.id,
      newValue: { code: perm.code },
    });
    return this.toResponse(perm);
  }

  async update(id: string, dto: UpdatePermissionDto) {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new BusinessException('Permission not found', 'PERM_001');
    const updated = await this.permissionsRepository.update(id, dto);
    this.loggerService.log(
      { action: 'permission_updated', permissionId: id },
      'PermissionsService',
    );
    await this.auditService.log({
      action: 'PERMISSION_UPDATED',
      module: 'permissions',
      resource: 'permission',
      resourceId: id,
      oldValue: { code: perm.code },
      newValue: { ...dto },
    });
    await this.cache.delPattern('perms:*');
    return this.toResponse(updated);
  }

  async delete(id: string) {
    const perm = await this.permissionsRepository.findById(id);
    if (!perm) throw new BusinessException('Permission not found', 'PERM_001');
    await this.permissionsRepository.delete(id);
    this.loggerService.log(
      { action: 'permission_deleted', permissionId: id },
      'PermissionsService',
    );
    await this.auditService.log({
      action: 'PERMISSION_DELETED',
      module: 'permissions',
      resource: 'permission',
      resourceId: id,
    });
    await this.cache.delPattern('perms:*');
  }
}
