import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMethods() {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findMethodById(id: string) {
    return this.prisma.shippingMethod.findUnique({ where: { id } });
  }

  async findMethodByCode(code: string) {
    return this.prisma.shippingMethod.findUnique({ where: { code } });
  }

  async createMethod(data: Prisma.ShippingMethodCreateInput) {
    return this.prisma.shippingMethod.create({ data });
  }

  async findZones(methodId: string) {
    return this.prisma.shippingZone.findMany({
      where: { methodId, isActive: true },
    });
  }

  async createZone(data: Prisma.ShippingZoneCreateInput) {
    return this.prisma.shippingZone.create({ data });
  }

  async findMatchingZone(
    methodId: string,
    country: string,
    state: string,
    pincode?: string,
  ) {
    const zones = await this.prisma.shippingZone.findMany({
      where: { methodId, isActive: true },
    });
    return zones.find((z) => {
      const countryMatch =
        z.countries.length === 0 || z.countries.includes(country);
      const stateMatch = z.states.length === 0 || z.states.includes(state);
      const pincodeMatch =
        !pincode || z.pincodes.length === 0 || z.pincodes.includes(pincode);
      return countryMatch && stateMatch && pincodeMatch;
    });
  }
}
