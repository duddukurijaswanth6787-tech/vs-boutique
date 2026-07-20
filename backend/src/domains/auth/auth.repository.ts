import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
  }

  // ponytail: lightweight lookup — no roles/permissions, for auth checks that only need user fields
  async findByEmailBasic(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        accountStatus: true,
        userType: true,
        loginAttempts: true,
        lockoutUntil: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async findByIdBasic(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        accountStatus: true,
        userType: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.create({ data: { userId, roleId } });
  }

  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async updateLoginAttempts(
    userId: string,
    attempts: number,
    lockoutUntil?: Date | null,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: attempts, lockoutUntil: lockoutUntil ?? null },
    });
  }

  async resetLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockoutUntil: null, lastLoginAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  async logLoginAttempt(data: {
    email: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    lockoutUntil?: Date;
  }) {
    return this.prisma.loginAttempt.create({ data });
  }
}
