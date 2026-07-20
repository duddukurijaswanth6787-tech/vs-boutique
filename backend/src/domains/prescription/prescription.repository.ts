import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId: string;
    verificationStatus?: string;
    page: number;
    limit: number;
  }) {
    const { userId, verificationStatus, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PrescriptionWhereInput = { userId };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { medicines: true },
      }),
      this.prisma.prescription.count({ where }),
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
    return this.prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true },
    });
  }

  async create(data: Prisma.PrescriptionCreateInput) {
    return this.prisma.prescription.create({
      data,
      include: { medicines: true },
    });
  }

  async update(id: string, data: Prisma.PrescriptionUpdateInput) {
    return this.prisma.prescription.update({
      where: { id },
      data,
      include: { medicines: true },
    });
  }

  async createMedicine(data: Prisma.PrescriptionMedicineCreateInput) {
    return this.prisma.prescriptionMedicine.create({ data });
  }

  // ── Doctor registry ────────

  async upsertDoctor(data: {
    name: string;
    registrationNo: string;
    hospital?: string;
    specialization?: string;
  }) {
    return this.prisma.doctor.upsert({
      where: { registrationNo: data.registrationNo },
      update: { name: data.name, hospital: data.hospital, specialization: data.specialization },
      create: data,
    });
  }

  async findDoctorByRegistration(registrationNo: string) {
    return this.prisma.doctor.findUnique({ where: { registrationNo } });
  }

  // ── Multi-page support ────────

  async createPages(pages: Array<{
    prescriptionId: string;
    pageNumber: number;
    imageUrl: string;
  }>) {
    return this.prisma.prescriptionPage.createMany({ data: pages });
  }

  async findPages(prescriptionId: string) {
    return this.prisma.prescriptionPage.findMany({
      where: { prescriptionId },
      orderBy: { pageNumber: 'asc' },
    });
  }

  async updatePage(pageId: string, data: {
    ocrRawText?: string;
    ocrConfidence?: number;
    status?: string;
  }) {
    return this.prisma.prescriptionPage.update({
      where: { id: pageId },
      data,
    });
  }

  // ── Admin queries ────────

  async findForAdmin(params: {
    status?: string;
    pharmacistId?: string;
    page: number;
    limit: number;
  }) {
    const { status, pharmacistId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PrescriptionWhereInput = {};
    if (status) where.status = status;
    if (pharmacistId) where.pharmacistId = pharmacistId;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        include: { medicines: true, doctor: true, pages: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return {
      data,
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async assignPharmacist(id: string, pharmacistId: string) {
    return this.prisma.prescription.update({
      where: { id },
      data: { pharmacistId, status: 'PENDING_REVIEW' },
    });
  }

  async getStats() {
    const [total, pending, approved, rejected, processing] = await Promise.all([
      this.prisma.prescription.count(),
      this.prisma.prescription.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.prescription.count({ where: { status: 'APPROVED' } }),
      this.prisma.prescription.count({ where: { status: 'REJECTED' } }),
      this.prisma.prescription.count({ where: { status: { in: ['PROCESSING', 'OCR_COMPLETE'] } } }),
    ]);
    return { total, pending, approved, rejected, processing };
  }
}
