import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { sanitizePlainText, sanitizeRichText } from '@common/utils/sanitize';
import { CampaignRepository } from './campaign.repository';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
  CampaignResponse,
} from './campaign.types';

@Injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(c: any): CampaignResponse {
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      type: c.type,
      channel: c.channel,
      subject: c.subject ?? undefined,
      content: c.content ?? undefined,
      status: c.status,
      sentCount: c.sentCount,
      openCount: c.openCount,
      clickCount: c.clickCount,
      scheduledAt: c.scheduledAt ?? undefined,
      sentAt: c.sentAt ?? undefined,
      createdAt: c.createdAt,
    };
  }

  async findAll(query: CampaignQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.campaignRepository.findAll({
      type: query.type,
      channel: query.channel,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((c: any) => this.toResponse(c)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign)
      throw new BusinessException('Campaign not found', 'CAMPAIGN_001');
    return this.toResponse(campaign);
  }

  async create(dto: CreateCampaignDto, userId: string) {
    dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    if (dto.subject) dto.subject = sanitizePlainText(dto.subject);
    if (dto.content) dto.content = sanitizeRichText(dto.content);
    const campaign = await this.campaignRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      channel: dto.channel,
      subject: dto.subject,
      content: dto.content,
      audience: dto.audience ?? [],
      scheduledAt: dto.scheduledAt,
      status: 'DRAFT',
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'CAMPAIGN_CREATED',
      module: 'campaign',
      resource: 'campaign',
      resourceId: campaign.id,
      userId,
      newValue: { name: dto.name, type: dto.type, channel: dto.channel },
    });
    return this.toResponse(campaign);
  }

  async update(id: string, dto: UpdateCampaignDto, userId: string) {
    if (dto.name) dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    if (dto.subject) dto.subject = sanitizePlainText(dto.subject);
    if (dto.content) dto.content = sanitizeRichText(dto.content);
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign)
      throw new BusinessException('Campaign not found', 'CAMPAIGN_001');
    await this.campaignRepository.update(id, { ...dto, updatedBy: userId });
    return this.findById(id);
  }

  async send(id: string, userId: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign)
      throw new BusinessException('Campaign not found', 'CAMPAIGN_001');
    await this.campaignRepository.update(id, {
      status: 'SENT',
      sentAt: new Date(),
      updatedBy: userId,
    });
    return this.findById(id);
  }
}
