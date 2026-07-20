import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { DrugInteractionRepository } from './drug-interaction.repository';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  InteractionQueryDto,
  CheckInteractionDto,
  InteractionResponse,
  InteractionCheckResponse,
} from './drug-interaction.types';

@Injectable()
export class DrugInteractionService {
  constructor(
    private readonly drugInteractionRepository: DrugInteractionRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(i: any): InteractionResponse {
    return {
      id: i.id,
      medicineA: i.medicineA,
      medicineB: i.medicineB,
      severity: i.severity,
      description: i.description,
      recommendation: i.recommendation ?? undefined,
      createdAt: i.createdAt,
    };
  }

  async findAll(query: InteractionQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.drugInteractionRepository.findAll({
      search: query.search,
      severity: query.severity,
      page,
      limit,
    });
    return {
      data: result.data.map((i: any) => this.toResponse(i)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const interaction = await this.drugInteractionRepository.findById(id);
    if (!interaction)
      throw new BusinessException(
        'Drug interaction not found',
        'INTERACTION_001',
      );
    return this.toResponse(interaction);
  }

  async findByMedicine(medicineName: string) {
    const interactions =
      await this.drugInteractionRepository.findByMedicine(medicineName);
    return interactions.map((i: any) => this.toResponse(i));
  }

  async create(dto: CreateInteractionDto) {
    const existing = await this.drugInteractionRepository.findByMedicinePair(
      dto.medicineA,
      dto.medicineB,
    );
    if (existing)
      throw new BusinessException(
        'Interaction already exists for this medicine pair',
        'INTERACTION_002',
      );
    const interaction = await this.drugInteractionRepository.create({
      medicineA: dto.medicineA,
      medicineB: dto.medicineB,
      severity: dto.severity,
      description: dto.description,
      recommendation: dto.recommendation,
    });
    return this.toResponse(interaction);
  }

  async update(id: string, dto: UpdateInteractionDto) {
    const interaction = await this.drugInteractionRepository.findById(id);
    if (!interaction)
      throw new BusinessException(
        'Drug interaction not found',
        'INTERACTION_001',
      );
    if (dto.medicineA || dto.medicineB) {
      const mA = dto.medicineA ?? interaction.medicineA;
      const mB = dto.medicineB ?? interaction.medicineB;
      const existing = await this.drugInteractionRepository.findByMedicinePair(
        mA,
        mB,
      );
      if (existing && existing.id !== id)
        throw new BusinessException(
          'Interaction already exists for this medicine pair',
          'INTERACTION_002',
        );
    }
    const updated = await this.drugInteractionRepository.update(id, { ...dto });
    return this.toResponse(updated);
  }

  async checkInteractions(
    dto: CheckInteractionDto,
  ): Promise<InteractionCheckResponse> {
    const { medicines } = dto;
    const pairs: [string, string][] = [];
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        pairs.push([medicines[i], medicines[j]]);
      }
    }

    const interactions: InteractionResponse[] = [];
    for (const [a, b] of pairs) {
      const found = await this.drugInteractionRepository.findByMedicinePair(
        a,
        b,
      );
      if (found) interactions.push(this.toResponse(found));
    }

    await this.auditService.log({
      action: 'INTERACTION_CHECKED',
      module: 'drug-interaction',
      resource: 'drug-interaction',
      newValue: { medicines, resultCount: interactions.length },
    });

    return {
      hasInteractions: interactions.length > 0,
      interactions,
    };
  }
}
