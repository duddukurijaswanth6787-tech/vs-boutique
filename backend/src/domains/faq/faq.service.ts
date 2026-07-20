import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { sanitizePlainText, sanitizeRichText } from '@common/utils/sanitize';
import { FaqRepository } from './faq.repository';
import {
  CreateFaqDto,
  UpdateFaqDto,
  FaqQueryDto,
  FaqResponse,
} from './faq.types';

@Injectable()
export class FaqService {
  constructor(
    private readonly faqRepository: FaqRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(f: any): FaqResponse {
    return {
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category ?? undefined,
      displayOrder: f.displayOrder,
      isActive: f.isActive,
      helpfulCount: f.helpfulCount,
      createdAt: f.createdAt,
    };
  }

  async findAll(query: FaqQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.faqRepository.findAll({
      search: query.search,
      category: query.category,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data: result.data.map((f: any) => this.toResponse(f)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new BusinessException('FAQ not found', 'FAQ_001');
    return this.toResponse(faq);
  }

  async create(dto: CreateFaqDto) {
    dto.question = sanitizePlainText(dto.question);
    dto.answer = sanitizeRichText(dto.answer);
    const faq = await this.faqRepository.create({
      question: dto.question,
      answer: dto.answer,
      category: dto.category,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.toResponse(faq);
  }

  async update(id: string, dto: UpdateFaqDto) {
    if (dto.question) dto.question = sanitizePlainText(dto.question);
    if (dto.answer) dto.answer = sanitizeRichText(dto.answer);
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new BusinessException('FAQ not found', 'FAQ_001');
    await this.faqRepository.update(id, { ...dto });
    await this.auditService.log({
      action: 'FAQ_UPDATED',
      module: 'faq',
      resource: 'faq',
      resourceId: id,
      newValue: { ...dto },
    });
    return this.findById(id);
  }

  async delete(id: string) {
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new BusinessException('FAQ not found', 'FAQ_001');
    await this.faqRepository.update(id, { isActive: false });
  }

  async markHelpful(id: string) {
    const faq = await this.faqRepository.findById(id);
    if (!faq) throw new BusinessException('FAQ not found', 'FAQ_001');
    await this.faqRepository.incrementHelpful(id);
    return this.findById(id);
  }
}
