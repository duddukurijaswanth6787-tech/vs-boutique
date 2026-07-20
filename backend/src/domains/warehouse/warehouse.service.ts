import { Injectable } from '@nestjs/common';
import { BusinessException, ValidationException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { WarehouseRepository } from './warehouse.repository';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseQueryDto,
  WarehouseResponse,
  CreateLocationDto,
  AssignWarehouseInventoryDto,
  TransferStockDto,
} from './warehouse.types';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(w: any): WarehouseResponse {
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      description: w.description ?? undefined,
      address: w.address ?? undefined,
      city: w.city ?? undefined,
      state: w.state ?? undefined,
      country: w.country ?? undefined,
      postalCode: w.postalCode ?? undefined,
      contactPerson: w.contactPerson ?? undefined,
      phone: w.phone ?? undefined,
      email: w.email ?? undefined,
      status: w.status,
      isDefault: w.isDefault,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    };
  }

  async findAll(query: WarehouseQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.warehouseRepository.findAll({
      search: query.search,
      status: query.status,
      isDefault: query.isDefault,
      page,
      limit,
      sortBy: query.sortBy ?? 'name',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((w) => this.toResponse(w)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    return wh;
  }

  async create(dto: CreateWarehouseDto, userId: string) {
    const existing = await this.warehouseRepository.findByCode(dto.code);
    if (existing)
      throw new BusinessException(
        'Warehouse code already exists',
        'WAREHOUSE_002',
      );

    if (dto.isDefault) await this.warehouseRepository.clearDefault();

    const wh = await this.warehouseRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode,
      contactPerson: dto.contactPerson,
      phone: dto.phone,
      email: dto.email,
      isDefault: dto.isDefault ?? false,
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'WAREHOUSE_CREATED',
      module: 'warehouses',
      resource: 'warehouse',
      resourceId: wh.id,
      userId,
      newValue: { code: dto.code, name: dto.name },
    });
    return this.toResponse(wh);
  }

  async update(id: string, dto: UpdateWarehouseDto, userId: string) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');

    if (dto.isDefault && !wh.isDefault)
      await this.warehouseRepository.clearDefault();

    await this.warehouseRepository.update(id, { ...dto, updatedBy: userId });
    await this.auditService.log({
      action: 'WAREHOUSE_UPDATED',
      module: 'warehouses',
      resource: 'warehouse',
      resourceId: id,
      userId,
      newValue: { ...dto },
    });
    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    await this.warehouseRepository.softDelete(id);
    await this.auditService.log({
      action: 'WAREHOUSE_DELETED',
      module: 'warehouses',
      resource: 'warehouse',
      resourceId: id,
      userId,
    });
  }

  async restore(id: string, userId: string) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    if (!wh.deletedAt)
      throw new BusinessException('Warehouse is not deleted', 'WAREHOUSE_003');
    await this.warehouseRepository.restore(id);
    await this.auditService.log({
      action: 'WAREHOUSE_RESTORED',
      module: 'warehouses',
      resource: 'warehouse',
      resourceId: id,
      userId,
    });
    return this.findById(id);
  }

  async createLocation(id: string, dto: CreateLocationDto) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    return this.warehouseRepository.createLocation({
      warehouse: { connect: { id } },
      zone: dto.zone,
      rack: dto.rack,
      shelf: dto.shelf,
      bin: dto.bin,
      description: dto.description,
    });
  }

  async getLocations(id: string) {
    const wh = await this.warehouseRepository.findById(id);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    return this.warehouseRepository.findLocations(id);
  }

  async assignInventory(warehouseId: string, dto: AssignWarehouseInventoryDto) {
    const wh = await this.warehouseRepository.findById(warehouseId);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');

    const existing = await this.warehouseRepository.findWarehouseInventory(
      warehouseId,
      dto.variantId,
    );
    if (existing)
      throw new BusinessException(
        'Inventory already exists for this variant in this warehouse',
        'WAREHOUSE_004',
      );

    const inv = await this.warehouseRepository.createWarehouseInventory({
      warehouse: { connect: { id: warehouseId } },
      variant: { connect: { id: dto.variantId } },
      availableQuantity: dto.availableQuantity ?? 0,
      minimumStock: dto.minimumStock ?? 0,
      maximumStock: dto.maximumStock ?? 0,
      reorderLevel: dto.reorderLevel ?? 0,
    });
    return inv;
  }

  async getWarehouseInventory(warehouseId: string) {
    const wh = await this.warehouseRepository.findById(warehouseId);
    if (!wh || wh.deletedAt)
      throw new BusinessException('Warehouse not found', 'WAREHOUSE_001');
    return this.warehouseRepository.findWarehouseInventories(warehouseId);
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId)
      throw new ValidationException(
        'Cannot transfer to the same warehouse',
        'WAREHOUSE_005',
      );

    const fromWh = await this.warehouseRepository.findById(dto.fromWarehouseId);
    if (!fromWh || fromWh.deletedAt)
      throw new BusinessException(
        'Source warehouse not found',
        'WAREHOUSE_001',
      );

    const toWh = await this.warehouseRepository.findById(dto.toWarehouseId);
    if (!toWh || toWh.deletedAt)
      throw new BusinessException(
        'Destination warehouse not found',
        'WAREHOUSE_001',
      );

    const fromInv = await this.warehouseRepository.findWarehouseInventory(
      dto.fromWarehouseId,
      dto.variantId,
    );
    if (!fromInv)
      throw new BusinessException(
        'No inventory found in source warehouse',
        'WAREHOUSE_006',
      );

    const available = fromInv.availableQuantity - fromInv.reservedQuantity;
    if (dto.quantity > available)
      throw new ValidationException(
        'Insufficient stock for transfer',
        'WAREHOUSE_007',
      );

    // Decrease from source
    await this.warehouseRepository.updateWarehouseInventory(fromInv.id, {
      availableQuantity: fromInv.availableQuantity - dto.quantity,
    });

    // Increase at destination (create if not exists)
    const toInv = await this.warehouseRepository.findWarehouseInventory(
      dto.toWarehouseId,
      dto.variantId,
    );
    if (toInv) {
      await this.warehouseRepository.updateWarehouseInventory(toInv.id, {
        availableQuantity: toInv.availableQuantity + dto.quantity,
      });
    } else {
      await this.warehouseRepository.createWarehouseInventory({
        warehouse: { connect: { id: dto.toWarehouseId } },
        variant: { connect: { id: dto.variantId } },
        availableQuantity: dto.quantity,
      });
    }

    await this.auditService.log({
      action: 'WAREHOUSE_STOCK_TRANSFERRED',
      module: 'warehouses',
      resource: 'warehouse',
      resourceId: dto.fromWarehouseId,
      userId,
      newValue: {
        variantId: dto.variantId,
        from: dto.fromWarehouseId,
        to: dto.toWarehouseId,
        quantity: dto.quantity,
        reason: dto.reason,
      },
    });

    return {
      transferred: dto.quantity,
      from: dto.fromWarehouseId,
      to: dto.toWarehouseId,
    };
  }
}
