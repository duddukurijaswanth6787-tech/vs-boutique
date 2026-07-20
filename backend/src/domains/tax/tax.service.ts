import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { TaxRepository } from './tax.repository';
import {
  CreateTaxRuleDto,
  UpdateTaxRuleDto,
  CalculateTaxDto,
  TaxRuleResponse,
  TaxCalculationResponse,
  TaxBreakdownItem,
} from './tax.types';

@Injectable()
export class TaxService {
  constructor(
    private readonly taxRepository: TaxRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(r: any): TaxRuleResponse {
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      rate: Number(r.rate),
      applicableTo: r.applicableTo ?? undefined,
      isActive: r.isActive,
      priority: r.priority,
      createdAt: r.createdAt,
    };
  }

  async findAll(query: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.taxRepository.findAll({
      type: query.type,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data: result.data.map((r) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const rule = await this.taxRepository.findById(id);
    if (!rule) throw new BusinessException('Tax rule not found', 'TAX_001');
    return this.toResponse(rule);
  }

  async create(userId: string, dto: CreateTaxRuleDto) {
    const rule = await this.taxRepository.create({
      name: dto.name,
      type: dto.type,
      rate: dto.rate,
      applicableTo: dto.applicableTo,
      applicableIds: dto.applicableIds ?? [],
      isActive: dto.isActive ?? true,
      priority: dto.priority ?? 0,
    });

    await this.auditService.log({
      action: 'TAX_RULE_CREATED',
      module: 'tax',
      resource: 'TaxRule',
      resourceId: rule.id,
      userId,
    });

    return this.toResponse(rule);
  }

  async update(id: string, userId: string, dto: UpdateTaxRuleDto) {
    const existing = await this.taxRepository.findById(id);
    if (!existing) throw new BusinessException('Tax rule not found', 'TAX_001');

    const rule = await this.taxRepository.update(id, {
      name: dto.name,
      type: dto.type,
      rate: dto.rate,
      applicableTo: dto.applicableTo,
      applicableIds: dto.applicableIds,
      isActive: dto.isActive,
      priority: dto.priority,
    });

    await this.auditService.log({
      action: 'TAX_RULE_UPDATED',
      module: 'tax',
      resource: 'TaxRule',
      resourceId: id,
      userId,
    });

    return this.toResponse(rule);
  }

  async calculateTax(dto: CalculateTaxDto): Promise<TaxCalculationResponse> {
    const rules = await this.taxRepository.findActiveRules();

    const matchingRules = rules.filter((rule) => {
      if (!rule.applicableTo) return true;
      if (rule.applicableTo === 'product' && dto.productIds?.length) {
        return rule.applicableIds.some((id) => dto.productIds!.includes(id));
      }
      if (rule.applicableTo === 'category' && dto.categoryIds?.length) {
        return rule.applicableIds.some((id) => dto.categoryIds!.includes(id));
      }
      return false;
    });

    const taxBreakdown: TaxBreakdownItem[] = matchingRules.map((rule) => {
      const rate = Number(rule.rate);
      return {
        type: rule.type,
        rate,
        amount: +((dto.orderAmount * rate) / 100).toFixed(2),
      };
    });

    const taxAmount = +taxBreakdown
      .reduce((sum, item) => sum + item.amount, 0)
      .toFixed(2);

    return {
      orderAmount: dto.orderAmount,
      taxAmount,
      taxBreakdown,
    };
  }
}
