import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { CustomerProfileRepository } from './customer-profile.repository';
import { UpdateProfileDto, ProfileResponse } from './customer-profile.types';

@Injectable()
export class CustomerProfileService {
  constructor(
    private readonly profileRepository: CustomerProfileRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toResponse(p: any): ProfileResponse {
    return {
      id: p.id,
      userId: p.userId,
      phone: p.phone ?? undefined,
      gender: p.gender ?? undefined,
      dateOfBirth: p.dateOfBirth ?? undefined,
      preferredLanguage: p.preferredLanguage ?? undefined,
      preferredCurrency: p.preferredCurrency ?? undefined,
      preferredCategories: p.preferredCategories ?? undefined,
      preferredBrands: p.preferredBrands ?? undefined,
      preferredSizes: p.preferredSizes ?? undefined,
      preferredColors: p.preferredColors ?? undefined,
      preferredPriceMin: p.preferredPriceMin
        ? Number(p.preferredPriceMin)
        : undefined,
      preferredPriceMax: p.preferredPriceMax
        ? Number(p.preferredPriceMax)
        : undefined,
      profileImage: p.profileImage ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    let profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      profile = await this.profileRepository.create({
        user: { connect: { id: userId } },
      });
      await this.auditService.log({
        action: 'PROFILE_CREATED',
        module: 'customer-profile',
        resource: 'customerProfile',
        resourceId: profile.id,
        userId,
      });
    }
    return this.toResponse(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile)
      throw new BusinessException('Profile not found', 'PROFILE_001');
    await this.profileRepository.update(profile.id, { ...dto });
    await this.auditService.log({
      action: 'PROFILE_UPDATED',
      module: 'customer-profile',
      resource: 'customerProfile',
      resourceId: profile.id,
      userId,
      newValue: { ...dto },
    });
    return this.getProfile(userId);
  }

  async bulkUpdateStatus(
    dto: { ids: string[]; action: string },
    userId: string,
  ): Promise<any> {
    const actionMap: Record<string, string> = {
      activate: 'ACTIVE',
      deactivate: 'INACTIVE',
      suspend: 'SUSPENDED',
    };
    const status = actionMap[dto.action];
    if (!status)
      throw new BusinessException(
        `Unsupported action: ${dto.action}`,
        'PROFILE_002',
      );

    const results = await Promise.allSettled(
      dto.ids.map(async (id) => {
        const profile = await this.profileRepository.findById(id);
        if (!profile)
          throw new BusinessException('Customer not found', 'PROFILE_001');
        await this.prisma.user.update({
          where: { id: profile.userId },
          data: { accountStatus: status as any },
        });
        return { id };
      }),
    );

    const success: { id: string }[] = [];
    const failed: { id: string; error: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') success.push(r.value);
      else
        failed.push({
          id: dto.ids[i],
          error: r.reason?.message ?? String(r.reason),
        });
    }

    if (success.length > 0) {
      await this.auditService.log({
        action: `CUSTOMER_BULK_${dto.action.toUpperCase()}`,
        module: 'customer-profile',
        resource: 'customer',
        userId,
        metadata: {
          action: dto.action,
          successCount: success.length,
          failureCount: failed.length,
        },
      });
    }
    return {
      success,
      failed,
      totalProcessed: dto.ids.length,
      successCount: success.length,
      failureCount: failed.length,
    };
  }
}
