import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { loggerContextStorage } from '@common/logger/logger.context';
import { AuditRepository } from './audit.repository';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponse,
} from './audit.types';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly loggerService: LoggerService,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const ctx = loggerContextStorage.getStore();
    const entry = {
      ...dto,
      requestId: dto.requestId || ctx?.requestId,
      correlationId: dto.correlationId || ctx?.requestId,
      ipAddress: dto.ipAddress || ctx?.ip,
      userAgent: dto.userAgent || ctx?.userAgent,
      status: dto.status || 'SUCCESS',
    };
    await this.auditRepository.create(entry);
    this.loggerService.log(
      {
        auditAction: dto.action,
        module: dto.module,
        resource: dto.resource,
        resourceId: dto.resourceId,
        status: entry.status,
      },
      'AuditService',
    );
  }

  async logMany(entries: CreateAuditLogDto[]): Promise<void> {
    const ctx = loggerContextStorage.getStore();
    const enriched = entries.map((dto) => ({
      ...dto,
      requestId: dto.requestId || ctx?.requestId,
      ipAddress: dto.ipAddress || ctx?.ip,
      userAgent: dto.userAgent || ctx?.userAgent,
      status: dto.status || 'SUCCESS',
    }));
    await this.auditRepository.createMany(enriched);
    this.loggerService.log(
      { auditAction: 'BULK_CREATE', count: entries.length },
      'AuditService',
    );
  }

  async findAll(query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.auditRepository.findAll({
      module: query.module,
      action: query.action,
      userId: query.userId,
      staffId: query.staffId,
      resourceId: query.resourceId,
      status: query.status,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
  }

  async findById(id: string): Promise<AuditLogResponse> {
    const log = await this.auditRepository.findById(id);
    if (!log) throw new BusinessException('Audit log not found', 'AUDIT_001');
    return {
      id: log.id,
      userId: log.userId ?? undefined,
      staffId: log.staffId ?? undefined,
      action: log.action,
      module: log.module,
      resource: log.resource,
      resourceId: log.resourceId ?? undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      status: log.status,
      message: log.message ?? undefined,
      createdAt: log.createdAt,
    };
  }
}
