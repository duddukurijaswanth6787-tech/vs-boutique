import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { SlugGenerator } from '@shared/commerce/commerce.utils';
import { AttributeType } from '@shared/commerce/commerce.enums';
import { AuditService } from '@domains/audit/audit.service';
import { AttributesRepository } from './attributes.repository';
import type {
  CreateAttributeGroupDto,
  UpdateAttributeGroupDto,
  AttributeGroupQueryDto,
  AttributeGroupResponse,
  CreateAttributeDto,
  UpdateAttributeDto,
  AttributeQueryDto,
  AttributeResponse,
  CreateAttributeOptionDto,
  UpdateAttributeOptionDto,
  AttributeOptionQueryDto,
  AttributeOptionResponse,
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
  CategoryAttributeResponse,
} from './attributes.types';

const VALID_TYPES = new Set(Object.values(AttributeType));

@Injectable()
export class AttributesService {
  constructor(
    private readonly repo: AttributesRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────

  private toGroupResponse(g: any): AttributeGroupResponse {
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description ?? undefined,
      displayOrder: g.displayOrder,
      status: g.status,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  private toAttributeResponse(a: any): AttributeResponse {
    return {
      id: a.id,
      groupId: a.groupId,
      name: a.name,
      slug: a.slug,
      type: a.type,
      description: a.description ?? undefined,
      displayOrder: a.displayOrder,
      isRequired: a.isRequired,
      isFilterable: a.isFilterable,
      isSearchable: a.isSearchable,
      isComparable: a.isComparable,
      isVariant: a.isVariant,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  private toOptionResponse(o: any): AttributeOptionResponse {
    return {
      id: o.id,
      attributeId: o.attributeId,
      value: o.value,
      label: o.label,
      metadata: o.metadata ?? undefined,
      displayOrder: o.displayOrder,
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  private toCategoryMappingResponse(m: any): CategoryAttributeResponse {
    return {
      categoryId: m.categoryId,
      attributeId: m.attributeId,
      displayOrder: m.displayOrder,
      isRequired: m.isRequired,
      isFilterable: m.isFilterable,
      isSearchable: m.isSearchable,
      isComparable: m.isComparable,
      isVariant: m.isVariant,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  private async genSlug(
    name: string,
    finder: (slug: string) => Promise<any>,
    excludeId?: string,
  ): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let existing = await finder(slug);
    let counter = 1;
    while (existing && existing.id !== excludeId) {
      slug = `${SlugGenerator.generate(name)}-${counter}`;
      existing = await finder(slug);
      counter++;
    }
    return slug;
  }

  private assertType(type: string) {
    if (!VALID_TYPES.has(type as AttributeType))
      throw new BusinessException(
        `Invalid attribute type: ${type}`,
        'ATTR_001',
      );
  }

  // ─── Groups ─────────────────────────────────────────────

  async findAllGroups(query: AttributeGroupQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.repo.findAllGroups({
      search: query.search,
      status: query.status,
      page,
      limit,
      sortBy: query.sortBy ?? 'displayOrder',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((g: any) => this.toGroupResponse(g)),
      meta: result.meta,
    };
  }

  async findGroupById(id: string) {
    const group = await this.repo.findGroupById(id);
    if (!group || group.deletedAt)
      throw new BusinessException('Attribute group not found', 'ATTR_002');
    return this.toGroupResponse(group);
  }

  async createGroup(dto: CreateAttributeGroupDto, userId: string) {
    const slug = await this.genSlug(dto.name, (s) =>
      this.repo.findGroupBySlug(s),
    );
    const group = await this.repo.createGroup({
      name: dto.name,
      slug,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 0,
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'ATTRIBUTE_GROUP_CREATED',
      module: 'attributes',
      resource: 'attributeGroup',
      resourceId: group.id,
      userId,
      newValue: { name: dto.name, slug },
    });
    this.loggerService.log(
      { action: 'attribute_group_created', groupId: group.id, name: dto.name },
      'AttributesService',
    );
    return this.findGroupById(group.id);
  }

  async updateGroup(id: string, dto: UpdateAttributeGroupDto, userId: string) {
    const group = await this.repo.findGroupById(id);
    if (!group || group.deletedAt)
      throw new BusinessException('Attribute group not found', 'ATTR_002');
    const data: any = { ...dto, updatedBy: userId };
    if (dto.name)
      data.slug = await this.genSlug(
        dto.name,
        (s) => this.repo.findGroupBySlug(s),
        id,
      );
    await this.repo.updateGroup(id, data);
    await this.auditService.log({
      action: 'ATTRIBUTE_GROUP_UPDATED',
      module: 'attributes',
      resource: 'attributeGroup',
      resourceId: id,
      userId,
      oldValue: { name: group.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'attribute_group_updated', groupId: id },
      'AttributesService',
    );
    return this.findGroupById(id);
  }

  async deleteGroup(id: string, userId: string) {
    const group = await this.repo.findGroupById(id);
    if (!group || group.deletedAt)
      throw new BusinessException('Attribute group not found', 'ATTR_002');
    await this.repo.softDeleteGroup(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_GROUP_DELETED',
      module: 'attributes',
      resource: 'attributeGroup',
      resourceId: id,
      userId,
      oldValue: { name: group.name },
    });
    this.loggerService.log(
      { action: 'attribute_group_deleted', groupId: id },
      'AttributesService',
    );
  }

  async restoreGroup(id: string, userId: string) {
    const group = await this.repo.findGroupById(id);
    if (!group)
      throw new BusinessException('Attribute group not found', 'ATTR_002');
    if (!group.deletedAt)
      throw new BusinessException('Attribute group is not deleted', 'ATTR_003');
    await this.repo.restoreGroup(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_GROUP_RESTORED',
      module: 'attributes',
      resource: 'attributeGroup',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'attribute_group_restored', groupId: id },
      'AttributesService',
    );
    return this.findGroupById(id);
  }

  // ─── Attributes ─────────────────────────────────────────

  async findAllAttributes(query: AttributeQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.repo.findAllAttributes({
      groupId: query.groupId,
      search: query.search,
      status: query.status,
      type: query.type,
      page,
      limit,
      sortBy: query.sortBy ?? 'displayOrder',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((a: any) => this.toAttributeResponse(a)),
      meta: result.meta,
    };
  }

  async findAttributeById(id: string) {
    const attr = await this.repo.findAttributeById(id);
    if (!attr || attr.deletedAt)
      throw new BusinessException('Attribute not found', 'ATTR_004');
    return this.toAttributeResponse(attr);
  }

  async createAttribute(dto: CreateAttributeDto, userId: string) {
    this.assertType(dto.type);
    const groupId = dto.groupId ?? '00000000-0000-0000-0000-000000000000';
    const slug = await this.genSlug(dto.name, (s) =>
      this.repo.findAttributeBySlug(groupId, s),
    );
    const attr = await this.repo.createAttribute({
      name: dto.name,
      slug,
      type: dto.type,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 0,
      isRequired: dto.isRequired ?? false,
      isFilterable: dto.isFilterable ?? false,
      isSearchable: dto.isSearchable ?? false,
      isComparable: dto.isComparable ?? false,
      isVariant: dto.isVariant ?? false,
      createdBy: userId,
      group: { connect: { id: groupId } },
    });
    await this.auditService.log({
      action: 'ATTRIBUTE_CREATED',
      module: 'attributes',
      resource: 'attribute',
      resourceId: attr.id,
      userId,
      newValue: { name: dto.name, type: dto.type },
    });
    this.loggerService.log(
      { action: 'attribute_created', attributeId: attr.id, name: dto.name },
      'AttributesService',
    );
    return this.findAttributeById(attr.id);
  }

  async updateAttribute(id: string, dto: UpdateAttributeDto, userId: string) {
    const attr = await this.repo.findAttributeById(id);
    if (!attr || attr.deletedAt)
      throw new BusinessException('Attribute not found', 'ATTR_004');
    if (dto.type) this.assertType(dto.type);
    const data: any = { ...dto, updatedBy: userId };
    if (dto.name)
      data.slug = await this.genSlug(
        dto.name,
        (s) => this.repo.findAttributeBySlug(attr.groupId, s),
        id,
      );
    await this.repo.updateAttribute(id, data);
    await this.auditService.log({
      action: 'ATTRIBUTE_UPDATED',
      module: 'attributes',
      resource: 'attribute',
      resourceId: id,
      userId,
      oldValue: { name: attr.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'attribute_updated', attributeId: id },
      'AttributesService',
    );
    return this.findAttributeById(id);
  }

  async deleteAttribute(id: string, userId: string) {
    const attr = await this.repo.findAttributeById(id);
    if (!attr || attr.deletedAt)
      throw new BusinessException('Attribute not found', 'ATTR_004');
    await this.repo.softDeleteAttribute(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_DELETED',
      module: 'attributes',
      resource: 'attribute',
      resourceId: id,
      userId,
      oldValue: { name: attr.name },
    });
    this.loggerService.log(
      { action: 'attribute_deleted', attributeId: id },
      'AttributesService',
    );
  }

  async restoreAttribute(id: string, userId: string) {
    const attr = await this.repo.findAttributeById(id);
    if (!attr) throw new BusinessException('Attribute not found', 'ATTR_004');
    if (!attr.deletedAt)
      throw new BusinessException('Attribute is not deleted', 'ATTR_005');
    await this.repo.restoreAttribute(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_RESTORED',
      module: 'attributes',
      resource: 'attribute',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'attribute_restored', attributeId: id },
      'AttributesService',
    );
    return this.findAttributeById(id);
  }

  // ─── Options ────────────────────────────────────────────

  async findAllOptions(query: AttributeOptionQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 100, 500);
    const result = await this.repo.findAllOptions({
      attributeId: query.attributeId,
      page,
      limit,
    });
    return {
      data: result.data.map((o: any) => this.toOptionResponse(o)),
      meta: result.meta,
    };
  }

  async findOptionById(id: string) {
    const opt = await this.repo.findOptionById(id);
    if (!opt || opt.deletedAt)
      throw new BusinessException('Attribute option not found', 'ATTR_006');
    return this.toOptionResponse(opt);
  }

  async createOption(dto: CreateAttributeOptionDto, userId: string) {
    const attr = await this.repo.findAttributeById(dto.attributeId);
    if (!attr || attr.deletedAt)
      throw new BusinessException('Attribute not found', 'ATTR_004');
    const opt = await this.repo.createOption({
      value: dto.value,
      label: dto.label,
      metadata: dto.metadata as any,
      displayOrder: dto.displayOrder ?? 0,
      attribute: { connect: { id: dto.attributeId } },
    });
    await this.auditService.log({
      action: 'ATTRIBUTE_OPTION_CREATED',
      module: 'attributes',
      resource: 'attributeOption',
      resourceId: opt.id,
      userId,
      newValue: { value: dto.value, label: dto.label },
    });
    this.loggerService.log(
      { action: 'attribute_option_created', optionId: opt.id },
      'AttributesService',
    );
    return this.findOptionById(opt.id);
  }

  async updateOption(
    id: string,
    dto: UpdateAttributeOptionDto,
    userId: string,
  ) {
    const opt = await this.repo.findOptionById(id);
    if (!opt || opt.deletedAt)
      throw new BusinessException('Attribute option not found', 'ATTR_006');
    await this.repo.updateOption(id, dto as any);
    await this.auditService.log({
      action: 'ATTRIBUTE_OPTION_UPDATED',
      module: 'attributes',
      resource: 'attributeOption',
      resourceId: id,
      userId,
      oldValue: { value: opt.value },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'attribute_option_updated', optionId: id },
      'AttributesService',
    );
    return this.findOptionById(id);
  }

  async deleteOption(id: string, userId: string) {
    const opt = await this.repo.findOptionById(id);
    if (!opt || opt.deletedAt)
      throw new BusinessException('Attribute option not found', 'ATTR_006');
    await this.repo.softDeleteOption(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_OPTION_DELETED',
      module: 'attributes',
      resource: 'attributeOption',
      resourceId: id,
      userId,
      oldValue: { value: opt.value },
    });
    this.loggerService.log(
      { action: 'attribute_option_deleted', optionId: id },
      'AttributesService',
    );
  }

  async restoreOption(id: string, userId: string) {
    const opt = await this.repo.findOptionById(id);
    if (!opt)
      throw new BusinessException('Attribute option not found', 'ATTR_006');
    if (!opt.deletedAt)
      throw new BusinessException(
        'Attribute option is not deleted',
        'ATTR_007',
      );
    await this.repo.restoreOption(id);
    await this.auditService.log({
      action: 'ATTRIBUTE_OPTION_RESTORED',
      module: 'attributes',
      resource: 'attributeOption',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'attribute_option_restored', optionId: id },
      'AttributesService',
    );
    return this.findOptionById(id);
  }

  // ─── Category Mappings ──────────────────────────────────

  async findAllCategoryMappings(categoryId: string) {
    const result = await this.repo.findAllCategoryMappings(categoryId);
    return {
      data: result.data.map((m: any) => this.toCategoryMappingResponse(m)),
    };
  }

  async createCategoryMapping(dto: CreateCategoryAttributeDto, userId: string) {
    const existing = await this.repo.findCategoryMapping(
      dto.categoryId,
      dto.attributeId,
    );
    if (existing)
      throw new BusinessException(
        'Attribute already mapped to this category',
        'ATTR_008',
      );
    const attr = await this.repo.findAttributeById(dto.attributeId);
    if (!attr || attr.deletedAt)
      throw new BusinessException('Attribute not found', 'ATTR_004');
    const mapping = await this.repo.createCategoryMapping({
      displayOrder: dto.displayOrder ?? 0,
      isRequired: dto.isRequired ?? false,
      isFilterable: dto.isFilterable ?? false,
      isSearchable: dto.isSearchable ?? false,
      isComparable: dto.isComparable ?? false,
      isVariant: dto.isVariant ?? false,
      category: { connect: { id: dto.categoryId } },
      attribute: { connect: { id: dto.attributeId } },
    });
    await this.auditService.log({
      action: 'ATTRIBUTE_MAPPED_TO_CATEGORY',
      module: 'attributes',
      resource: 'categoryAttribute',
      userId,
      newValue: { categoryId: dto.categoryId, attributeId: dto.attributeId },
    });
    this.loggerService.log(
      {
        action: 'attribute_mapped_to_category',
        categoryId: dto.categoryId,
        attributeId: dto.attributeId,
      },
      'AttributesService',
    );
    return this.toCategoryMappingResponse(mapping);
  }

  async updateCategoryMapping(
    categoryId: string,
    attributeId: string,
    dto: UpdateCategoryAttributeDto,
    userId: string,
  ) {
    const existing = await this.repo.findCategoryMapping(
      categoryId,
      attributeId,
    );
    if (!existing)
      throw new BusinessException(
        'Category attribute mapping not found',
        'ATTR_009',
      );
    const mapping = await this.repo.updateCategoryMapping(
      categoryId,
      attributeId,
      { ...dto },
    );
    await this.auditService.log({
      action: 'ATTRIBUTE_MAPPING_UPDATED',
      module: 'attributes',
      resource: 'categoryAttribute',
      userId,
      oldValue: { categoryId, attributeId },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'attribute_mapping_updated', categoryId, attributeId },
      'AttributesService',
    );
    return this.toCategoryMappingResponse(mapping);
  }

  async deleteCategoryMapping(
    categoryId: string,
    attributeId: string,
    userId: string,
  ) {
    const existing = await this.repo.findCategoryMapping(
      categoryId,
      attributeId,
    );
    if (!existing)
      throw new BusinessException(
        'Category attribute mapping not found',
        'ATTR_009',
      );
    await this.repo.deleteCategoryMapping(categoryId, attributeId);
    await this.auditService.log({
      action: 'ATTRIBUTE_UNMAPPED_FROM_CATEGORY',
      module: 'attributes',
      resource: 'categoryAttribute',
      userId,
      oldValue: { categoryId, attributeId },
    });
    this.loggerService.log(
      { action: 'attribute_unmapped_from_category', categoryId, attributeId },
      'AttributesService',
    );
  }
}
