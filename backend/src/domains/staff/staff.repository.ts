import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class StaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    department?: string;
    designation?: string;
    employmentStatus?: string;
    role?: string;
    employmentType?: string;
    shift?: string;
    deleted?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      department,
      designation,
      employmentStatus,
      role,
      employmentType,
      shift,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (!params.deleted) where.user = { deletedAt: null };
    else if (params.deleted === 'only')
      where.user = { deletedAt: { not: null } };
    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ];
    }
    if (department) where.department = department;
    if (designation) where.designation = designation;
    if (employmentStatus) where.employmentStatus = employmentStatus;
    if (employmentType) where.employmentType = employmentType;
    if (shift) where.shift = shift;
    if (role) {
      where.user = {
        ...where.user,
        userRoles: { some: { role: { name: role } } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === 'createdAt'
            ? { createdAt: sortOrder }
            : { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              accountStatus: true,
              gender: true,
              lastLoginAt: true,
              createdAt: true,
              forcePasswordChange: true,
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: { select: { code: true } } },
                      },
                    },
                  },
                },
              },
              userPermissionOverrides: true,
            },
          },
          reportingManager: {
            select: { id: true, employeeId: true, jobTitle: true },
          },
        },
      }),
      this.prisma.staffProfile.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountStatus: true,
            gender: true,
            deletedAt: true,
            lastLoginAt: true,
            forcePasswordChange: true,
            createdAt: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: { select: { code: true } } },
                    },
                  },
                },
              },
            },
            userPermissionOverrides: true,
          },
        },
        reportingManager: {
          select: { id: true, employeeId: true, jobTitle: true },
        },
      },
    });
  }

  async findWithDeleted(id: string) {
    return this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountStatus: true,
            gender: true,
            deletedAt: true,
            lastLoginAt: true,
            forcePasswordChange: true,
            createdAt: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: { select: { code: true } } },
                    },
                  },
                },
              },
            },
            userPermissionOverrides: true,
          },
        },
        reportingManager: {
          select: { id: true, employeeId: true, jobTitle: true },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.staffProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountStatus: true,
            gender: true,
            lastLoginAt: true,
            forcePasswordChange: true,
            createdAt: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: { select: { code: true } } },
                    },
                  },
                },
              },
            },
            userPermissionOverrides: true,
          },
        },
      },
    });
  }

  async findByEmployeeId(employeeId: string) {
    return this.prisma.staffProfile.findUnique({ where: { employeeId } });
  }

  async updateEmploymentStatus(id: string, status: string) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: { employmentStatus: status as any },
    });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: data,
    });
  }

  async updateStaffProfile(id: string, data: any) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: data,
    });
  }
}
