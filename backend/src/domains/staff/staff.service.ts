import { Injectable } from '@nestjs/common';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import { PasswordService } from '@domains/auth/services/password.service';
import { PrismaService } from '@database/prisma.service';
import { StaffRepository } from './staff.repository';
import { BulkOperationResult } from '@common/dto/bulk.dto';
import { runBulkOperation } from '@common/utils/bulk.helper';
import { AuditService } from '@domains/audit/audit.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  StaffResponse,
  StaffDetailResponse,
  InviteStaffDto,
  AcceptInviteDto,
} from './staff.types';

@Injectable()
export class StaffService {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async toResponse(profile: any): Promise<StaffResponse> {
    const u = profile.user;
    const roles: string[] =
      u.userRoles?.map((ur: any) => ur.role.name as string) ?? [];
    const permissionCodes: string[] =
      u.userRoles?.flatMap(
        (ur: any) =>
          ur.role?.rolePermissions?.map(
            (rp: any) => rp.permission.code as string,
          ) ?? [],
      ) ?? [];
    const permissions = [...new Set<string>(permissionCodes)];
    // ponytail: add permission overrides
    if (u.userPermissionOverrides?.length) {
      for (const ov of u.userPermissionOverrides) {
        if (ov.isGranted) permissions.push(ov.permissionCode as string);
        else {
          const idx = permissions.indexOf(ov.permissionCode as string);
          if (idx !== -1) permissions.splice(idx, 1);
        }
      }
    }
    return {
      id: profile.id,
      userId: profile.userId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName ?? undefined,
      department: profile.department,
      designation: profile.designation,
      employeeId: profile.employeeId,
      jobTitle: profile.jobTitle ?? undefined,
      reportingManagerId: profile.reportingManagerId ?? undefined,
      employmentType: profile.employmentType ?? undefined,
      shift: profile.shift ?? undefined,
      joinedAt: profile.joinedAt ?? undefined,
      dateOfBirth: profile.dateOfBirth ?? undefined,
      salary: profile.salary ? Number(profile.salary) : undefined,
      employmentStatus: profile.employmentStatus,
      accountStatus: u.accountStatus,
      phone: u.phone ?? undefined,
      profileImage: profile.profileImage ?? undefined,
      gender: u.gender ?? undefined,
      emergencyContact: profile.emergencyContact ?? undefined,
      address: profile.address ?? undefined,
      lastLoginAt: u.lastLoginAt ?? undefined,
      roles,
      permissions,
      createdAt: profile.createdAt,
    };
  }

  async findAll(query: StaffQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const result = await this.staffRepository.findAll({
      search: query.search,
      department: query.department,
      designation: query.designation,
      employmentStatus: query.employmentStatus,
      role: query.role,
      employmentType: query.employmentType,
      shift: query.shift,
      deleted: query.deleted,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: await Promise.all(result.data.map((p: any) => this.toResponse(p))),
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<StaffDetailResponse> {
    const profile = await this.staffRepository.findById(id);
    if (!profile || profile.user.deletedAt)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    const base = await this.toResponse(profile);
    return {
      ...base,
      forcePasswordChange: (profile.user as any).forcePasswordChange ?? false,
      createdBy: profile.createdBy ?? undefined,
    };
  }

  async create(dto: CreateStaffDto, createdBy: string) {
    const existing = await this.staffRepository.findByEmployeeId(
      dto.employeeId,
    );
    if (existing)
      throw new BusinessException('Employee ID already exists', 'STAFF_002');
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail)
      throw new BusinessException('Email already exists', 'STAFF_003');

    const passwordHash = dto.password
      ? await this.passwordService.hash(dto.password)
      : null;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: passwordHash ?? '',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userType: 'STAFF',
        accountStatus: dto.sendInvite ? 'PENDING_VERIFICATION' : 'ACTIVE',
        forcePasswordChange: !passwordHash,
        staffProfile: {
          create: {
            department: dto.department as any,
            designation: dto.designation as any,
            employeeId: dto.employeeId,
            jobTitle: dto.jobTitle,
            reportingManagerId: dto.reportingManagerId,
            employmentType: dto.employmentType as any,
            shift: dto.shift as any,
            joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
            dateOfBirth: dto.dateOfBirth
              ? new Date(dto.dateOfBirth)
              : undefined,
            salary: dto.salary,
            emergencyContact: dto.emergencyContact,
            address: dto.address,
            createdBy,
          },
        },
      },
      include: {
        staffProfile: true,
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
        userPermissionOverrides: true,
      },
    });

    // Assign default staff role
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: IDENTITY_CONSTANTS.DEFAULT_STAFF_ROLE },
    });
    if (defaultRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: defaultRole.id },
      });
    }

    // Assign specified roles
    if (dto.roleIds?.length) {
      for (const roleId of dto.roleIds) {
        const alreadyHas = user.userRoles?.some((ur) => ur.roleId === roleId);
        if (!alreadyHas) {
          await this.prisma.userRole.create({
            data: { userId: user.id, roleId },
          });
        }
      }
    }

    const createdProfile = await this.staffRepository.findByUserId(user.id);
    await this.auditService.log({
      action: 'STAFF_CREATED',
      module: 'staff',
      resource: 'staff',
      resourceId: createdProfile?.id,
      userId: createdBy,
      metadata: {
        employeeId: dto.employeeId,
        email: dto.email,
        sendInvite: !!dto.sendInvite,
      },
    });
    return this.findById(createdProfile!.id);
  }

  async update(id: string, dto: UpdateStaffDto) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');

    await this.staffRepository.updateStaffProfile(id, {
      department: dto.department,
      designation: dto.designation,
      jobTitle: dto.jobTitle,
      reportingManagerId: dto.reportingManagerId,
      employmentType: dto.employmentType,
      shift: dto.shift,
      joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      salary: dto.salary,
      emergencyContact: dto.emergencyContact,
      address: dto.address,
      profileImage: dto.profileImage,
    });
    if (dto.firstName || dto.lastName || dto.phone) {
      await this.staffRepository.updateUser(profile.userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      });
    }
    await this.auditService.log({
      action: 'STAFF_UPDATED',
      module: 'staff',
      resource: 'staff',
      resourceId: id,
      userId: profile.userId,
    });
    return this.findById(id);
  }

  async delete(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      deletedAt: new Date(),
      accountStatus: 'DELETED',
    });
    await this.auditService.log({
      action: 'STAFF_DELETED',
      module: 'staff',
      resource: 'staff',
      resourceId: id,
      userId: profile.userId,
    });
  }

  async restore(id: string) {
    const profile = await this.staffRepository.findWithDeleted(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      deletedAt: null,
      accountStatus: 'ACTIVE',
    });
    await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
    await this.auditService.log({
      action: 'STAFF_RESTORED',
      module: 'staff',
      resource: 'staff',
      resourceId: id,
      userId: profile.userId,
    });
    return this.findByIdRestored(id);
  }

  private async findByIdRestored(id: string) {
    const profile = await this.staffRepository.findWithDeleted(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    return this.toResponse(profile);
  }

  private async updateStatus(
    id: string,
    accountStatus: string,
    employmentStatus: string,
    action: string,
  ) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, { accountStatus });
    await this.staffRepository.updateEmploymentStatus(id, employmentStatus);
    await this.auditService.log({
      action,
      module: 'staff',
      resource: 'staff',
      resourceId: id,
      userId: profile.userId,
    });
    return this.findById(id);
  }

  async activate(id: string) {
    return this.updateStatus(id, 'ACTIVE', 'ACTIVE', 'STAFF_ACTIVATED');
  }
  async deactivate(id: string) {
    return this.updateStatus(id, 'INACTIVE', 'INACTIVE', 'STAFF_DEACTIVATED');
  }
  async suspend(id: string) {
    return this.updateStatus(id, 'SUSPENDED', 'SUSPENDED', 'STAFF_SUSPENDED');
  }
  async lock(id: string) {
    return this.updateStatus(id, 'LOCKED', 'SUSPENDED', 'STAFF_LOCKED');
  }

  async unlock(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      accountStatus: 'ACTIVE',
      loginAttempts: 0,
      lockoutUntil: null,
    });
    await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
    await this.auditService.log({
      action: 'STAFF_UNLOCKED',
      module: 'staff',
      resource: 'staff',
      resourceId: id,
      userId: profile.userId,
    });
    return this.findById(id);
  }

  async bulk(
    dto: { ids: string[]; action: string },
    userId: string,
  ): Promise<BulkOperationResult> {
    const actionMap: Record<string, (id: string) => Promise<any>> = {
      delete: (id) => this.delete(id).then(() => ({ id })),
      restore: (id) => this.restore(id).then((r) => ({ id: r.id })),
      activate: (id) => this.activate(id).then((r) => ({ id: r.id })),
      deactivate: (id) => this.deactivate(id).then((r) => ({ id: r.id })),
      suspend: (id) => this.suspend(id).then((r) => ({ id: r.id })),
      lock: (id) => this.lock(id).then((r) => ({ id: r.id })),
      unlock: (id) => this.unlock(id).then((r) => ({ id: r.id })),
    };
    const result = await runBulkOperation(dto.ids, actionMap, dto.action);
    if (result.successCount > 0) {
      await this.auditService.log({
        action: `STAFF_BULK_${dto.action.toUpperCase()}`,
        module: 'staff',
        resource: 'staff',
        userId,
        metadata: {
          action: dto.action,
          successCount: result.successCount,
          failureCount: result.failureCount,
          ids: dto.ids,
        },
      });
    }
    return result;
  }

  // --- Invitation System ---

  async invite(dto: InviteStaffDto, invitedBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new BusinessException('Email already registered', 'STAFF_003');

    // Create staff with PENDING_VERIFICATION status, no password
    const staff = await this.create(
      {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department,
        designation: dto.designation,
        employeeId: dto.employeeId,
        roleIds: dto.roleIds,
        sendInvite: true,
      },
      invitedBy,
    );

    const crypto = await import('node:crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.staffInvitation.create({
      data: {
        email: dto.email,
        token: tokenHash,
        status: 'PENDING',
        invitedBy,
        staffId: staff.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.auditService.log({
      action: 'STAFF_INVITE_SENT',
      module: 'staff',
      resource: 'invitation',
      resourceId: staff.id,
      userId: invitedBy,
      metadata: { email: dto.email },
    });

    return { ...staff, invitationToken: token };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const crypto = await import('node:crypto');
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const invitation = await this.prisma.staffInvitation.findUnique({
      where: { token: tokenHash },
    });
    if (!invitation)
      throw new BusinessException('Invalid invitation token', 'INV_001');
    if (invitation.status === 'ACCEPTED')
      throw new BusinessException('Invitation already accepted', 'INV_002');
    if (invitation.status === 'CANCELLED')
      throw new BusinessException('Invitation was cancelled', 'INV_003');
    if (invitation.expiresAt < new Date())
      throw new BusinessException('Invitation has expired', 'INV_004');

    const staffProfile = await this.staffRepository.findById(
      invitation.staffId!,
    );
    if (!staffProfile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');

    const passwordHash = await this.passwordService.hash(dto.password);
    await this.staffRepository.updateUser(staffProfile.userId, {
      accountStatus: 'ACTIVE',
      passwordHash,
    } as any);
    await this.staffRepository.updateEmploymentStatus(
      invitation.staffId!,
      'ACTIVE',
    );

    await this.prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await this.auditService.log({
      action: 'STAFF_INVITE_ACCEPTED',
      module: 'staff',
      resource: 'invitation',
      resourceId: invitation.staffId!,
      userId: staffProfile.userId,
    });

    return this.findById(invitation.staffId!);
  }

  async resendInvite(staffId: string) {
    const profile = await this.staffRepository.findById(staffId);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');

    // Cancel old pending invitations
    await this.prisma.staffInvitation.updateMany({
      where: { staffId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    const crypto = await import('node:crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.staffInvitation.create({
      data: {
        email: profile.user.email,
        token: tokenHash,
        status: 'PENDING',
        invitedBy: profile.createdBy,
        staffId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      action: 'STAFF_INVITE_RESENT',
      module: 'staff',
      resource: 'invitation',
      resourceId: staffId,
      userId: profile.userId,
    });

    return { invitationToken: token };
  }

  async cancelInvite(staffId: string) {
    await this.prisma.staffInvitation.updateMany({
      where: { staffId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    await this.auditService.log({
      action: 'STAFF_INVITE_CANCELLED',
      module: 'staff',
      resource: 'invitation',
      resourceId: staffId,
    });
  }

  async getInvitations(staffId: string) {
    return this.prisma.staffInvitation.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Permission Overrides ---

  async assignPermissionOverride(
    staffId: string,
    permissionCode: string,
    isGranted: boolean,
    userId: string,
  ) {
    const profile = await this.staffRepository.findById(staffId);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.prisma.userPermissionOverride.upsert({
      where: {
        userId_permissionCode: { userId: profile.userId, permissionCode },
      },
      create: { userId: profile.userId, permissionCode, isGranted },
      update: { isGranted },
    });
    // ponytail: cache expires naturally in 5 min — no DI access to CacheService outside NestJS context

    await this.auditService.log({
      action: isGranted
        ? 'PERMISSION_OVERRIDE_GRANTED'
        : 'PERMISSION_OVERRIDE_REVOKED',
      module: 'staff',
      resource: 'permission_override',
      resourceId: staffId,
      userId,
      metadata: { permissionCode, isGranted },
    });
    return this.findById(staffId);
  }

  async removePermissionOverride(
    staffId: string,
    permissionCode: string,
    userId: string,
  ) {
    const profile = await this.staffRepository.findById(staffId);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.prisma.userPermissionOverride.deleteMany({
      where: { userId: profile.userId, permissionCode },
    });
    await this.auditService.log({
      action: 'PERMISSION_OVERRIDE_REMOVED',
      module: 'staff',
      resource: 'permission_override',
      resourceId: staffId,
      userId,
      metadata: { permissionCode },
    });
    return this.findById(staffId);
  }

  async getPermissionOverrides(staffId: string) {
    const profile = await this.staffRepository.findById(staffId);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    return this.prisma.userPermissionOverride.findMany({
      where: { userId: profile.userId },
    });
  }
}
