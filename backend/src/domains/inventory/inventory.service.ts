import { Injectable } from '@nestjs/common';
import { BusinessException, ValidationException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { InventoryRepository } from './inventory.repository';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustStockDto,
  StockMovementDto,
  InventoryQueryDto,
  MovementQueryDto,
  InventoryResponse,
  InventoryMovementResponse,
} from './inventory.types';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly auditService: AuditService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toResponse(i: any): InventoryResponse {
    const available = i.availableQuantity - i.reservedQuantity;
    return {
      id: i.id,
      variantId: i.variantId,
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      damagedQuantity: i.damagedQuantity,
      returnedQuantity: i.returnedQuantity,
      availableStock: available,
      minimumStock: i.minimumStock,
      maximumStock: i.maximumStock,
      reorderLevel: i.reorderLevel,
      stockStatus: i.stockStatus,
      allowBackorder: i.allowBackorder,
      trackInventory: i.trackInventory,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }

  private toMovementResponse(m: any): InventoryMovementResponse {
    return {
      id: m.id,
      inventoryId: m.inventoryId,
      variantId: m.variantId,
      movementType: m.movementType,
      quantity: m.quantity,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      referenceType: m.referenceType ?? undefined,
      referenceId: m.referenceId ?? undefined,
      reason: m.reason ?? undefined,
      remarks: m.remarks ?? undefined,
      performedBy: m.performedBy ?? undefined,
      createdAt: m.createdAt,
    };
  }

  private calculateStockStatus(inventory: {
    availableQuantity: number;
    reservedQuantity: number;
    minimumStock: number;
    reorderLevel: number;
    allowBackorder: boolean;
  }): string {
    const available = inventory.availableQuantity - inventory.reservedQuantity;
    if (available <= 0)
      return inventory.allowBackorder ? 'BACKORDER' : 'OUT_OF_STOCK';
    if (inventory.minimumStock > 0 && available <= inventory.minimumStock)
      return 'LOW_STOCK';
    if (inventory.reorderLevel > 0 && available <= inventory.reorderLevel)
      return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  private async updateStockStatus(id: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv) return;
    const status = this.calculateStockStatus(inv);
    if (status !== inv.stockStatus) {
      await this.inventoryRepository.update(id, { stockStatus: status });
    }
  }

  async findAll(query: InventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.inventoryRepository.findAll({
      variantId: query.variantId,
      stockStatus: query.stockStatus,
      lowStock: query.lowStock,
      outOfStock: query.outOfStock,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: result.data.map((i) => this.toResponse(i)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');
    return this.toResponse(inv);
  }

  async findByVariantId(variantId: string) {
    const inv = await this.inventoryRepository.findByVariantId(variantId);
    if (!inv)
      throw new BusinessException(
        'Inventory not found for variant',
        'INVENTORY_001',
      );
    return this.toResponse(inv);
  }

  async create(dto: CreateInventoryDto, userId: string) {
    const existing = await this.inventoryRepository.findByVariantId(
      dto.variantId,
    );
    if (existing)
      throw new BusinessException(
        'Inventory already exists for this variant',
        'INVENTORY_002',
      );

    const available = dto.availableQuantity ?? 0;
    const minimumStock = dto.minimumStock ?? 0;
    const reorderLevel = dto.reorderLevel ?? 0;
    const status = this.calculateStockStatus({
      availableQuantity: available,
      reservedQuantity: 0,
      minimumStock,
      reorderLevel,
      allowBackorder: dto.allowBackorder ?? false,
    });

    const inv = await this.inventoryRepository.create({
      variant: { connect: { id: dto.variantId } },
      availableQuantity: available,
      minimumStock,
      maximumStock: dto.maximumStock ?? 0,
      reorderLevel,
      stockStatus: status,
      allowBackorder: dto.allowBackorder ?? false,
      trackInventory: dto.trackInventory ?? true,
    });

    if (available > 0) {
      await this.inventoryRepository.createMovement({
        inventory: { connect: { id: inv.id } },
        variantId: dto.variantId,
        movementType: 'MANUAL_ADD',
        quantity: available,
        previousQuantity: 0,
        newQuantity: available,
        reason: 'Initial stock',
        performedBy: userId,
      });
    }

    await this.auditService.log({
      action: 'INVENTORY_CREATED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: inv.id,
      userId,
      newValue: { variantId: dto.variantId, available },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: dto.variantId,
    });
    return this.toResponse(inv);
  }

  async update(id: string, dto: UpdateInventoryDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    await this.inventoryRepository.update(id, { ...dto });
    await this.updateStockStatus(id);

    await this.auditService.log({
      action: 'INVENTORY_UPDATED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { ...dto },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async increaseStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const prev = inv.availableQuantity;
    const next = prev + dto.quantity;

    await this.inventoryRepository.updateStock(id, { availableQuantity: next });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'MANUAL_ADD',
      quantity: dto.quantity,
      previousQuantity: prev,
      newQuantity: next,
      reason: dto.reason,
      remarks: dto.remarks,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_INCREASED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async decreaseStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const prev = inv.availableQuantity;
    const next = prev - dto.quantity;
    if (next < 0)
      throw new ValidationException('Insufficient stock', 'INVENTORY_003');

    await this.inventoryRepository.updateStock(id, { availableQuantity: next });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'MANUAL_REMOVE',
      quantity: dto.quantity,
      previousQuantity: prev,
      newQuantity: next,
      reason: dto.reason,
      remarks: dto.remarks,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_DECREASED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async adjustStock(id: string, dto: AdjustStockDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const prev = inv.availableQuantity;
    const next = prev + dto.quantity;
    if (next < 0)
      throw new ValidationException(
        'Adjustment would result in negative stock',
        'INVENTORY_004',
      );

    await this.inventoryRepository.updateStock(id, { availableQuantity: next });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'ADJUSTMENT',
      quantity: dto.quantity,
      previousQuantity: prev,
      newQuantity: next,
      reason: dto.reason,
      remarks: dto.remarks,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_ADJUSTED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity, reason: dto.reason },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async reserveStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const available = inv.availableQuantity - inv.reservedQuantity;
    if (dto.quantity > available)
      throw new ValidationException(
        'Cannot reserve more than available stock',
        'INVENTORY_005',
      );

    const prev = inv.reservedQuantity;
    const next = prev + dto.quantity;

    await this.inventoryRepository.updateStock(id, { reservedQuantity: next });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'RESERVED',
      quantity: dto.quantity,
      previousQuantity: prev,
      newQuantity: next,
      reason: dto.reason,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_RESERVED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async releaseStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    if (dto.quantity > inv.reservedQuantity)
      throw new ValidationException(
        'Cannot release more than reserved stock',
        'INVENTORY_006',
      );

    const prev = inv.reservedQuantity;
    const next = prev - dto.quantity;

    await this.inventoryRepository.updateStock(id, { reservedQuantity: next });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'UNRESERVED',
      quantity: dto.quantity,
      previousQuantity: prev,
      newQuantity: next,
      reason: dto.reason,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_RELEASED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async returnStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const prevAvail = inv.availableQuantity;
    const prevReturned = inv.returnedQuantity;

    await this.inventoryRepository.updateStock(id, {
      availableQuantity: prevAvail + dto.quantity,
      returnedQuantity: prevReturned + dto.quantity,
    });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'RETURN',
      quantity: dto.quantity,
      previousQuantity: prevAvail,
      newQuantity: prevAvail + dto.quantity,
      reason: dto.reason,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_RETURNED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async damageStock(id: string, dto: StockMovementDto, userId: string) {
    const inv = await this.inventoryRepository.findById(id);
    if (!inv)
      throw new BusinessException('Inventory not found', 'INVENTORY_001');

    const available = inv.availableQuantity - inv.reservedQuantity;
    if (dto.quantity > available)
      throw new ValidationException(
        'Cannot damage more than available stock',
        'INVENTORY_007',
      );

    const prevAvail = inv.availableQuantity;
    const prevDamaged = inv.damagedQuantity;

    await this.inventoryRepository.updateStock(id, {
      availableQuantity: prevAvail - dto.quantity,
      damagedQuantity: prevDamaged + dto.quantity,
    });
    await this.updateStockStatus(id);

    await this.inventoryRepository.createMovement({
      inventory: { connect: { id } },
      variantId: inv.variantId,
      movementType: 'DAMAGE',
      quantity: dto.quantity,
      previousQuantity: prevAvail,
      newQuantity: prevAvail - dto.quantity,
      reason: dto.reason,
      remarks: dto.remarks,
      performedBy: userId,
    });

    await this.auditService.log({
      action: 'STOCK_DAMAGED',
      module: 'inventory',
      resource: 'inventory',
      resourceId: id,
      userId,
      newValue: { quantity: dto.quantity },
    });
    this.eventEmitter.emit('cache.invalidate.variant.details', {
      variantId: inv.variantId,
    });
    return this.findById(id);
  }

  async findMovements(query: MovementQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.inventoryRepository.findMovements({
      inventoryId: query.inventoryId,
      variantId: query.variantId,
      movementType: query.movementType,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: result.data.map((m) => this.toMovementResponse(m)),
      meta: result.meta,
    };
  }

  async getStockSummary() {
    return this.inventoryRepository.getStockSummary();
  }
}
