import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CustomerAddressRepository } from './customer-address.repository';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressQueryDto,
  AddressResponse,
} from './customer-address.types';

@Injectable()
export class CustomerAddressService {
  constructor(
    private readonly addressRepository: CustomerAddressRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toResponse(a: any): AddressResponse {
    return {
      id: a.id,
      customerId: a.customerId,
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? undefined,
      city: a.city,
      state: a.state,
      country: a.country,
      postalCode: a.postalCode,
      landmark: a.landmark ?? undefined,
      latitude: a.latitude?.toString() ?? undefined,
      longitude: a.longitude?.toString() ?? undefined,
      isDefaultBilling: a.isDefaultBilling,
      isDefaultShipping: a.isDefaultShipping,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  private async getCustomerId(userId: string): Promise<string> {
    const profile = await this.addressRepository.findCustomerByUserId(userId);
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile.id;
  }

  async findAll(userId: string, query: AddressQueryDto) {
    const customerId = await this.getCustomerId(userId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.addressRepository.findAll({
      customerId,
      search: query.search,
      status: query.status,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: result.data.map((a: any) => this.toResponse(a)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const customerId = await this.getCustomerId(userId);
    const address = await this.addressRepository.findById(id);
    if (!address || address.customerId !== customerId)
      throw new BusinessException('Address not found', 'ADDRESS_001');
    return this.toResponse(address);
  }

  async create(dto: CreateAddressDto, userId: string) {
    const customerId = await this.getCustomerId(userId);
    if (dto.isDefaultBilling)
      await this.addressRepository.clearDefaultBilling(customerId);
    if (dto.isDefaultShipping)
      await this.addressRepository.clearDefaultShipping(customerId);

    const address = await this.addressRepository.create({
      customer: { connect: { id: customerId } },
      label: dto.label ?? 'Home',
      fullName: dto.fullName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      country: dto.country ?? 'IN',
      postalCode: dto.postalCode,
      landmark: dto.landmark,
      latitude: dto.latitude ? parseFloat(dto.latitude) : undefined,
      longitude: dto.longitude ? parseFloat(dto.longitude) : undefined,
      isDefaultBilling: dto.isDefaultBilling ?? false,
      isDefaultShipping: dto.isDefaultShipping ?? false,
    });

    await this.auditService.log({
      action: 'ADDRESS_CREATED',
      module: 'customer-address',
      resource: 'address',
      resourceId: address.id,
      userId,
      newValue: { fullName: dto.fullName, city: dto.city },
    });
    this.loggerService.log(
      { action: 'address_created', addressId: address.id },
      'CustomerAddressService',
    );
    return this.toResponse(address);
  }

  async update(id: string, dto: UpdateAddressDto, userId: string) {
    const customerId = await this.getCustomerId(userId);
    const address = await this.addressRepository.findById(id);
    if (!address || address.customerId !== customerId)
      throw new BusinessException('Address not found', 'ADDRESS_001');

    if (dto.isDefaultBilling)
      await this.addressRepository.clearDefaultBilling(customerId);
    if (dto.isDefaultShipping)
      await this.addressRepository.clearDefaultShipping(customerId);

    const updateData: any = { ...dto };
    if (dto.latitude !== undefined)
      updateData.latitude = dto.latitude ? parseFloat(dto.latitude) : null;
    if (dto.longitude !== undefined)
      updateData.longitude = dto.longitude ? parseFloat(dto.longitude) : null;

    await this.addressRepository.update(id, updateData);
    await this.auditService.log({
      action: 'ADDRESS_UPDATED',
      module: 'customer-address',
      resource: 'address',
      resourceId: id,
      userId,
      oldValue: { fullName: address.fullName },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'address_updated', addressId: id },
      'CustomerAddressService',
    );
    return this.findById(id, userId);
  }

  async delete(id: string, userId: string) {
    const customerId = await this.getCustomerId(userId);
    const address = await this.addressRepository.findById(id);
    if (!address || address.customerId !== customerId)
      throw new BusinessException('Address not found', 'ADDRESS_001');

    await this.addressRepository.delete(id);
    await this.auditService.log({
      action: 'ADDRESS_DELETED',
      module: 'customer-address',
      resource: 'address',
      resourceId: id,
      userId,
      oldValue: { fullName: address.fullName },
    });
    this.loggerService.log(
      { action: 'address_deleted', addressId: id },
      'CustomerAddressService',
    );
  }

  async findByCustomerIdAdmin(customerId: string) {
    const result = await this.addressRepository.findAll({
      customerId,
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    return result.data.map((a) => this.toResponse(a));
  }
}
