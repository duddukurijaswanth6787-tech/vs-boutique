import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { ShippingRepository } from './shipping.repository';
import {
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
  ShippingMethodResponse,
  ShippingZoneResponse,
  ShippingCalculationResponse,
} from './shipping.types';

@Injectable()
export class ShippingService {
  constructor(
    private readonly shippingRepository: ShippingRepository,
    private readonly auditService: AuditService,
  ) {}

  private toMethodResponse(m: any): ShippingMethodResponse {
    return {
      id: m.id,
      name: m.name,
      code: m.code,
      description: m.description ?? undefined,
      estimatedDays: m.estimatedDays,
      isActive: m.isActive,
    };
  }

  private toZoneResponse(z: any): ShippingZoneResponse {
    return {
      id: z.id,
      methodId: z.methodId,
      name: z.name,
      countries: z.countries,
      states: z.states,
      rateType: z.rateType,
      rate: Number(z.rate),
      freeAbove: z.freeAbove ? Number(z.freeAbove) : undefined,
    };
  }

  async getMethods(): Promise<ShippingMethodResponse[]> {
    const methods = await this.shippingRepository.findMethods();
    return methods.map((m) => this.toMethodResponse(m));
  }

  async createMethod(
    dto: CreateShippingMethodDto,
    userId: string,
  ): Promise<ShippingMethodResponse> {
    const existing = await this.shippingRepository.findMethodByCode(dto.code);
    if (existing)
      throw new BusinessException(
        'Shipping method code already exists',
        'SHIPPING_001',
      );
    const method = await this.shippingRepository.createMethod({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      estimatedDays: dto.estimatedDays,
    });
    await this.auditService.log({
      action: 'SHIPPING_METHOD_CREATED',
      module: 'shipping',
      resource: 'shipping_method',
      resourceId: method.id,
      userId,
      newValue: { name: dto.name, code: dto.code },
    });
    return this.toMethodResponse(method);
  }

  async getZones(methodId: string): Promise<ShippingZoneResponse[]> {
    const zones = await this.shippingRepository.findZones(methodId);
    return zones.map((z) => this.toZoneResponse(z));
  }

  async createZone(
    dto: CreateShippingZoneDto,
    userId: string,
  ): Promise<ShippingZoneResponse> {
    const method = await this.shippingRepository.findMethodById(dto.methodId);
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    const zone = await this.shippingRepository.createZone({
      method: { connect: { id: dto.methodId } },
      name: dto.name,
      countries: dto.countries,
      states: dto.states,
      pincodes: dto.pincodes,
      rateType: dto.rateType,
      rate: dto.rate,
      freeAbove: dto.freeAbove,
      maxWeight: dto.maxWeight,
    });
    await this.auditService.log({
      action: 'SHIPPING_ZONE_CREATED',
      module: 'shipping',
      resource: 'shipping_zone',
      resourceId: zone.id,
      userId,
      newValue: { name: dto.name, methodId: dto.methodId },
    });
    return this.toZoneResponse(zone);
  }

  async calculateShipping(
    dto: CalculateShippingDto,
  ): Promise<ShippingCalculationResponse> {
    const method = await this.shippingRepository.findMethodByCode(
      dto.methodCode,
    );
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    const zone = await this.shippingRepository.findMatchingZone(
      method.id,
      dto.country,
      dto.state,
      dto.pincode,
    );
    if (!zone)
      throw new BusinessException(
        'No shipping zone found for the given location',
        'SHIPPING_003',
      );

    let rate = Number(zone.rate);
    let freeShipping = false;

    if (zone.rateType === 'WEIGHT' && dto.weight) {
      rate = rate * dto.weight;
    }

    if (
      zone.freeAbove &&
      dto.orderAmount &&
      dto.orderAmount >= Number(zone.freeAbove)
    ) {
      rate = 0;
      freeShipping = true;
    }

    return {
      methodCode: method.code,
      methodName: method.name,
      rate,
      estimatedDelivery: method.estimatedDays,
      freeShipping,
    };
  }

  async getEstimatedDelivery(methodCode: string): Promise<string> {
    const method = await this.shippingRepository.findMethodByCode(methodCode);
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    return method.estimatedDays;
  }
}
