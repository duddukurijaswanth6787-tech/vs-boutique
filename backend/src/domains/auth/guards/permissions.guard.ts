import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { SecurityEventService, SecurityEventType } from '@common/security';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly securityEventService: SecurityEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    // ponytail: request.user is set by JwtAuthGuard; typed loosely to avoid Express Request augmentation
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // ponytail: permission set per user changes only on role/perm edits; cache avoids a DB hit on every guarded request
    const userPermissionSet = await this.cache.getOrSet(
      `perms:${user.sub}`,
      () => this.loadPermissions(user.sub),
      300,
    );

    const allowed = requiredPermissions.every((p) => userPermissionSet.has(p));
    if (!allowed) {
      this.securityEventService.log({
        type: SecurityEventType.PERMISSION_DENIED,
        ip: (request.ip as string) || '',
        path: request.url,
        method: request.method,
        correlationId: (request.headers['x-correlation-id'] as string) || '',
        userAgent: request.headers['user-agent'] as string | undefined,
        metadata: { userId: user.sub, requiredPermissions },
      });
    }
    return allowed;
  }

  private async loadPermissions(userId: string): Promise<Set<string>> {
    const userPermissions = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: {
                permission: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    return new Set(
      userPermissions.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.code),
      ),
    );
  }
}
