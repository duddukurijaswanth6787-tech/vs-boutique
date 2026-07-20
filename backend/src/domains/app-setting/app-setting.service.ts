import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { AppSettingRepository } from './app-setting.repository';
import {
  CreateSettingDto,
  UpdateSettingDto,
  SettingQueryDto,
  SettingResponse,
} from './app-setting.types';

@Injectable()
export class AppSettingService {
  constructor(
    private readonly settingRepository: AppSettingRepository,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toResponse(s: any): SettingResponse {
    return {
      id: s.id,
      key: s.key,
      value: s.value,
      type: s.type,
      group: s.group ?? undefined,
      description: s.description ?? undefined,
      createdAt: s.createdAt,
    };
  }

  // ponytail: settings are config read repeatedly, changed rarely; 300s TTL + invalidation on write
  async findAll(query: SettingQueryDto) {
    return this.cache.getOrSet(
      `setting:list:${JSON.stringify(query)}`,
      () => this.computeFindAll(query),
      300,
    );
  }

  private async computeFindAll(query: SettingQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.settingRepository.findAll({
      group: query.group,
      page,
      limit,
    });
    return {
      data: result.data.map((s) => this.toResponse(s)),
      meta: result.meta,
    };
  }

  async findByKey(key: string): Promise<SettingResponse> {
    return this.cache.getOrSet(
      `setting:key:${key}`,
      () => this.computeFindByKey(key),
      300,
    );
  }

  private async computeFindByKey(key: string): Promise<SettingResponse> {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting)
      throw new BusinessException('Setting not found', 'SETTING_001');
    return this.toResponse(setting);
  }

  async create(
    dto: CreateSettingDto,
    userId: string,
  ): Promise<SettingResponse> {
    const existing = await this.settingRepository.findByKey(dto.key);
    if (existing)
      throw new BusinessException('Setting key already exists', 'SETTING_002');
    const setting = await this.settingRepository.create({
      key: dto.key,
      value: dto.value,
      type: dto.type ?? 'STRING',
      group: dto.group,
      description: dto.description,
    });
    await this.auditService.log({
      action: 'SETTING_CREATED',
      module: 'settings',
      resource: 'setting',
      resourceId: setting.id,
      userId,
      newValue: { key: dto.key },
    });
    await this.cache.delPattern('setting:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toResponse(setting);
  }

  async update(
    id: string,
    dto: UpdateSettingDto,
    userId: string,
  ): Promise<SettingResponse> {
    const setting = await this.settingRepository.findById(id);
    if (!setting)
      throw new BusinessException('Setting not found', 'SETTING_001');
    const updated = await this.settingRepository.update(id, {
      value: dto.value,
      description: dto.description,
    });
    await this.auditService.log({
      action: 'SETTING_UPDATED',
      module: 'settings',
      resource: 'setting',
      resourceId: id,
      userId,
      oldValue: { value: setting.value },
      newValue: { value: dto.value },
    });
    await this.cache.delPattern('setting:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toResponse(updated);
  }

  async getByKey(key: string, defaultValue?: string): Promise<string | null> {
    return this.cache.getOrSet(
      `setting:value:${key}`,
      async () => {
        const value = await this.settingRepository.getByKey(key);
        return value ?? defaultValue ?? null;
      },
      300,
    );
  }
}
