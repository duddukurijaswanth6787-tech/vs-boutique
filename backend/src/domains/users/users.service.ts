import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import { PasswordService } from '@domains/auth/services/password.service';
import { AuditService } from '@domains/audit/audit.service';
import { UsersRepository } from './users.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignRoleDto,
  UserQueryDto,
  UserDetailResponse,
} from './users.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly loggerService: LoggerService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    return this.usersRepository.findAll({
      search: query.search,
      status: query.status,
      userType: query.userType,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
  }

  async findById(id: string): Promise<UserDetailResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      userType: user.userType,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      phone: user.phone ?? undefined,
      gender: user.gender ?? undefined,
      roles,
      permissions,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing)
      throw new BusinessException('Email already exists', 'USER_002');
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });
    const role = await this.usersRepository.findRoleByName(
      IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE,
    );
    if (role) await this.usersRepository.assignRole(user.id, role.id);
    this.loggerService.log(
      { action: 'user_created', userId: user.id },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_CREATED',
      module: 'users',
      resource: 'user',
      resourceId: user.id,
      newValue: { email: dto.email },
    });
    return this.findById(user.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    await this.usersRepository.update(id, dto);
    this.loggerService.log(
      { action: 'user_updated', userId: id },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_UPDATED',
      module: 'users',
      resource: 'user',
      resourceId: id,
      oldValue: { firstName: user.firstName, lastName: user.lastName },
      newValue: { ...dto },
    });
    return this.findById(id);
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    await this.usersRepository.softDelete(id);
    this.loggerService.log(
      { action: 'user_deleted', userId: id },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_DELETED',
      module: 'users',
      resource: 'user',
      resourceId: id,
    });
  }

  async restore(id: string) {
    const user = await this.usersRepository.findWithDeleted(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    await this.usersRepository.restore(id);
    this.loggerService.log(
      { action: 'user_restored', userId: id },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_RESTORED',
      module: 'users',
      resource: 'user',
      resourceId: id,
    });
    return this.findById(id);
  }

  private async updateSimple(id: string, status: string, action: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    await this.usersRepository.updateStatus(id, status);
    this.loggerService.log({ action, userId: id }, 'UsersService');
    await this.auditService.log({
      action: action.toUpperCase(),
      module: 'users',
      resource: 'user',
      resourceId: id,
    });
    return this.findById(id);
  }

  async activate(id: string) {
    return this.updateSimple(id, 'ACTIVE', 'user_activated');
  }
  async deactivate(id: string) {
    return this.updateSimple(id, 'INACTIVE', 'user_deactivated');
  }
  async suspend(id: string) {
    return this.updateSimple(id, 'SUSPENDED', 'user_suspended');
  }
  async unlock(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    await this.usersRepository.updateStatus(id, 'ACTIVE');
    await this.usersRepository.resetLockout(id);
    this.loggerService.log(
      { action: 'user_unlocked', userId: id },
      'UsersService',
    );
    return this.findById(id);
  }

  async assignRole(id: string, dto: AssignRoleDto, callerId?: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    const role = await this.usersRepository.findRoleById(dto.roleId);
    if (!role) throw new BusinessException('Role not found', 'ROLE_001');

    // ponytail: hierarchy validation — caller cannot assign a role with higher or equal hierarchy than their own
    if (callerId && callerId !== id) {
      const caller = await this.usersRepository.findById(callerId);
      if (caller) {
        const callerHierarchy = Math.max(
          ...caller.userRoles.map((ur) => ur.role.hierarchy ?? 0),
        );
        if (role.hierarchy >= callerHierarchy) {
          throw new BusinessException(
            'Cannot assign a role with equal or higher hierarchy',
            'ROLE_004',
          );
        }
      }
    }

    // ponytail: skip duplicate role assignment
    const alreadyHas = user.userRoles.some((ur) => ur.role.id === dto.roleId);
    if (alreadyHas) {
      throw new BusinessException('User already has this role', 'ROLE_005');
    }

    await this.usersRepository.assignRole(id, dto.roleId);
    this.loggerService.log(
      { action: 'role_assigned', userId: id, roleId: dto.roleId },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_ROLE_ASSIGNED',
      module: 'users',
      resource: 'user',
      resourceId: id,
      newValue: { roleId: dto.roleId },
    });
    return this.findById(id);
  }

  async removeRole(id: string, roleId: string, callerId?: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');

    // ponytail: prevent removing own roles
    if (callerId === id) {
      throw new BusinessException('Cannot remove your own role', 'ROLE_006');
    }

    const role = await this.usersRepository.findRoleById(roleId);
    if (role?.isSystem) {
      throw new BusinessException('Cannot remove system roles', 'ROLE_007');
    }

    await this.usersRepository.removeRole(id, roleId);
    this.loggerService.log(
      { action: 'role_removed', userId: id, roleId },
      'UsersService',
    );
    await this.auditService.log({
      action: 'USER_ROLE_REMOVED',
      module: 'users',
      resource: 'user',
      resourceId: id,
      oldValue: { roleId },
    });
    return this.findById(id);
  }

  async getRoles(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    return user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    }));
  }

  async getPermissions(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AuthenticationException('User not found', 'USER_001');
    return [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => ({
            code: rp.permission.code,
            name: rp.permission.name,
            module: rp.permission.module,
          })),
        ),
      ),
    ];
  }
}
