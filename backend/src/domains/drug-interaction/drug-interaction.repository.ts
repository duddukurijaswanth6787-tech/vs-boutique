import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DrugInteractionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    severity?: string;
    page: number;
    limit: number;
  }) {
    const { search, severity, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.MedicineInteractionWhereInput = {};
    if (search) {
      where.OR = [
        { medicineA: { contains: search, mode: 'insensitive' } },
        { medicineB: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (severity) where.severity = severity;

    const [data, total] = await Promise.all([
      this.prisma.medicineInteraction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.medicineInteraction.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.medicineInteraction.findUnique({ where: { id } });
  }

  async findByMedicine(medicineName: string) {
    return this.prisma.medicineInteraction.findMany({
      where: {
        OR: [
          { medicineA: { contains: medicineName, mode: 'insensitive' } },
          { medicineB: { contains: medicineName, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMedicinePair(medicineA: string, medicineB: string) {
    return this.prisma.medicineInteraction.findFirst({
      where: {
        OR: [
          {
            medicineA: { equals: medicineA, mode: 'insensitive' },
            medicineB: { equals: medicineB, mode: 'insensitive' },
          },
          {
            medicineA: { equals: medicineB, mode: 'insensitive' },
            medicineB: { equals: medicineA, mode: 'insensitive' },
          },
        ],
      },
    });
  }

  async create(data: Prisma.MedicineInteractionCreateInput) {
    return this.prisma.medicineInteraction.create({ data });
  }

  async update(id: string, data: Prisma.MedicineInteractionUpdateInput) {
    return this.prisma.medicineInteraction.update({ where: { id }, data });
  }
}
