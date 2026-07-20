import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AiAdminRepository } from './ai-admin.repository';
import {
  CreatePromptTemplateDto,
  UpdatePromptTemplateDto,
  PromptTemplateQueryDto,
  PromptTemplateResponse,
  AiUsageLogResponse,
} from './ai-admin.types';

@Injectable()
export class AiAdminService {
  constructor(
    private readonly aiAdminRepository: AiAdminRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(t: any): PromptTemplateResponse {
    return {
      id: t.id,
      name: t.name,
      template: t.template,
      variables: t.variables,
      description: t.description ?? undefined,
      isActive: t.isActive,
      version: t.version,
      createdAt: t.createdAt,
    };
  }

  private toUsageLogResponse(l: any): AiUsageLogResponse {
    return {
      id: l.id,
      userId: l.userId ?? undefined,
      feature: l.feature,
      tokensUsed: l.tokensUsed,
      cost: l.cost,
      createdAt: l.createdAt,
    };
  }

  async findTemplates(query: PromptTemplateQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.aiAdminRepository.findTemplates({
      search: query.search,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data: result.data.map((t) => this.toResponse(t)),
      meta: result.meta,
    };
  }

  async findTemplateById(id: string) {
    const template = await this.aiAdminRepository.findTemplateById(id);
    if (!template)
      throw new BusinessException('Template not found', 'AI_TEMPLATE_001');
    return this.toResponse(template);
  }

  async createTemplate(dto: CreatePromptTemplateDto, userId: string) {
    const existing = await this.aiAdminRepository.findTemplateByName(dto.name);
    if (existing)
      throw new BusinessException(
        'Template name already exists',
        'AI_TEMPLATE_002',
      );
    const template = await this.aiAdminRepository.createTemplate({
      name: dto.name,
      template: dto.template,
      variables: dto.variables,
      description: dto.description,
      createdBy: userId,
    });
    return this.toResponse(template);
  }

  async updateTemplate(
    id: string,
    dto: UpdatePromptTemplateDto,
    userId: string,
  ) {
    const template = await this.aiAdminRepository.findTemplateById(id);
    if (!template)
      throw new BusinessException('Template not found', 'AI_TEMPLATE_001');
    const updated = await this.aiAdminRepository.updateTemplate(id, {
      ...dto,
      version: { increment: 1 },
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'PROMPT_UPDATED',
      module: 'ai-admin',
      resource: 'prompt_template',
      resourceId: id,
      userId,
      oldValue: { template: template.template, version: template.version },
      newValue: { template: updated.template, version: updated.version },
    });
    return this.toResponse(updated);
  }

  async getUsageLogs(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.aiAdminRepository.getUsageLogs({ page, limit });
    return {
      data: result.data.map((l) => this.toUsageLogResponse(l)),
      meta: result.meta,
    };
  }

  async logUsage(
    userId: string | undefined,
    feature: string,
    tokensUsed: number,
    cost: number,
    metadata?: any,
  ) {
    return this.aiAdminRepository.createUsageLog({
      userId,
      feature,
      tokensUsed,
      cost,
      metadata,
    });
  }
}
