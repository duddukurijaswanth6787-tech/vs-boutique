import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrescriptionRepository } from './prescription.repository';
import {
  UploadPrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionQueryDto,
  PrescriptionResponse,
  PrescriptionMedicineResponse,
} from './prescription.types';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prescriptionRepository: PrescriptionRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toMedicineResponse(m: any): PrescriptionMedicineResponse {
    return {
      id: m.id,
      medicineName: m.medicineName,
      dosage: m.dosage ?? undefined,
      frequency: m.frequency ?? undefined,
      duration: m.duration ?? undefined,
      quantity: m.quantity ?? undefined,
      instructions: m.instructions ?? undefined,
      confidence: m.confidence ? Number(m.confidence) : undefined,
      productId: m.productId ?? undefined,
    };
  }

  private toResponse(p: any): PrescriptionResponse {
    return {
      id: p.id,
      userId: p.userId,
      imageUrl: p.imageUrl,
      doctorName: p.doctorName ?? undefined,
      hospitalName: p.hospitalName ?? undefined,
      prescriptionDate: p.prescriptionDate ?? undefined,
      expiryDate: p.expiryDate ?? undefined,
      ocrConfidence: p.ocrConfidence ? Number(p.ocrConfidence) : undefined,
      verificationStatus: p.verificationStatus,
      medicines: p.medicines?.map((m: any) => this.toMedicineResponse(m)),
      notes: p.notes ?? undefined,
      createdAt: p.createdAt,
    };
  }

  async findAll(userId: string, query: PrescriptionQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.prescriptionRepository.findAll({
      userId,
      verificationStatus: query.verificationStatus,
      page,
      limit,
    });
    return {
      data: result.data.map((p: any) => this.toResponse(p)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    if (prescription.userId !== userId)
      throw new BusinessException('Access denied', 'PRESCRIPTION_002');
    return this.toResponse(prescription);
  }

  async upload(userId: string, dto: UploadPrescriptionDto) {
    const prescription = await this.prescriptionRepository.create({
      user: { connect: { id: userId } },
      imageUrl: dto.imageUrl,
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      prescriptionDate: dto.prescriptionDate
        ? new Date(dto.prescriptionDate)
        : undefined,
      notes: dto.notes,
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_UPLOADED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescription.id,
      userId,
      newValue: { imageUrl: dto.imageUrl },
    });
    this.loggerService.log(
      { action: 'prescription_uploaded', prescriptionId: prescription.id },
      'PrescriptionService',
    );
    // ponytail: placeholder OCR extraction, integrate real OCR service when available
    await this.auditService.log({
      action: 'OCR_COMPLETED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescription.id,
      userId,
      newValue: { ocrConfidence: null },
    });
    return this.toResponse(prescription);
  }

  async update(id: string, dto: UpdatePrescriptionDto, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    if (prescription.userId !== userId)
      throw new BusinessException('Access denied', 'PRESCRIPTION_002');
    const updated = await this.prescriptionRepository.update(id, {
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      prescriptionDate: dto.prescriptionDate
        ? new Date(dto.prescriptionDate)
        : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      notes: dto.notes,
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_UPDATED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: id,
      userId,
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'prescription_updated', prescriptionId: id },
      'PrescriptionService',
    );
    return this.toResponse(updated);
  }

  async verify(id: string, dto: VerifyPrescriptionDto, userId: string) {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.update(id, {
      verificationStatus: dto.verificationStatus,
      notes: dto.notes,
      verifiedBy: userId,
      verifiedAt: new Date(),
    });
    await this.auditService.log({
      action: 'OCR_VERIFIED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: id,
      userId,
      newValue: { verificationStatus: dto.verificationStatus },
    });
    this.loggerService.log(
      {
        action: 'prescription_verified',
        prescriptionId: id,
        status: dto.verificationStatus,
      },
      'PrescriptionService',
    );
    return this.toResponse(updated);
  }

  async addMedicine(
    prescriptionId: string,
    dto: {
      medicineName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      quantity?: number;
      instructions?: string;
      confidence?: number;
      productId?: string;
    },
  ) {
    const prescription =
      await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription)
      throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const medicine = await this.prescriptionRepository.createMedicine({
      prescription: { connect: { id: prescriptionId } },
      medicineName: dto.medicineName,
      dosage: dto.dosage,
      frequency: dto.frequency,
      duration: dto.duration,
      quantity: dto.quantity,
      instructions: dto.instructions,
      confidence: dto.confidence,
      ...(dto.productId ? { product: { connect: { id: dto.productId } } } : {}),
    });
    return this.toMedicineResponse(medicine);
  }

  // ── Multi-page upload ────────

  async uploadMultiPage(userId: string, dto: {
    pages: Array<{ imageUrl: string; pageNumber: number }>;
    doctorName?: string;
    hospitalName?: string;
    prescriptionDate?: string;
    notes?: string;
  }) {
    if (!dto.pages?.length) throw new BusinessException('At least one page required', 'PRESCRIPTION_003');
    const prescription = await this.prescriptionRepository.create({
      user: { connect: { id: userId } },
      imageUrl: dto.pages[0].imageUrl, // primary image = first page
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      prescriptionDate: dto.prescriptionDate ? new Date(dto.prescriptionDate) : undefined,
      notes: dto.notes,
      pageCount: dto.pages.length,
      status: 'UPLOADED',
    });
    await this.prescriptionRepository.createPages(
      dto.pages.map((p) => ({ prescriptionId: prescription.id, pageNumber: p.pageNumber, imageUrl: p.imageUrl })),
    );
    await this.auditService.log({
      action: 'PRESCRIPTION_UPLOADED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescription.id,
      userId,
      newValue: { pageCount: dto.pages.length },
    });
    return this.toResponse(prescription);
  }

  // ── OCR hook ────────
  // ponytail: OCR is a hook — call Gemini or Google Vision when available.
  // For now, stores raw text + confidence from the caller (or null for async processing).

  async processOcr(prescriptionId: string, ocrResult: {
    rawText: string;
    confidence: number;
    provider?: string;
    extractedData?: Record<string, unknown>;
  }) {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.update(prescriptionId, {
      ocrRawText: ocrResult.rawText,
      ocrConfidence: ocrResult.confidence,
      ocrProvider: ocrResult.provider ?? 'manual',
      aiExtractedData: ocrResult.extractedData as any,
      status: 'OCR_COMPLETE',
    });
    await this.auditService.log({
      action: 'OCR_COMPLETED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescriptionId,
      newValue: { confidence: ocrResult.confidence, provider: ocrResult.provider },
    });
    return this.toResponse(updated);
  }

  // ── Medicine matching ────────
  // ponytail: match extracted medicine names against products by fuzzy name match.
  // Upgrade to proper fuzzy matching (Levenshtein/trigram) when product catalog is large.

  async matchMedicines(prescriptionId: string) {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const medicines = prescription.medicines;
    // ponytail: simple product name match — exact or ILIKE. Upgrade when needed.
    const matched = [];
    for (const med of medicines) {
      const product = await (this as any).prescriptionRepository.prisma.product.findFirst({
        where: {
          name: { contains: med.medicineName, mode: 'insensitive' },
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: { id: true, name: true },
      });
      if (product) {
        await this.prescriptionRepository.createMedicine({
          prescription: { connect: { id: prescriptionId } },
          medicineName: med.medicineName,
          dosage: med.dosage ?? undefined,
          frequency: med.frequency ?? undefined,
          duration: med.duration ?? undefined,
          product: { connect: { id: product.id } },
        } as any);
        matched.push({ medicine: med.medicineName, productId: product.id, productName: product.name });
      }
    }
    return { matched, total: medicines.length };
  }

  // ── Workflow: pharmacist review ────────

  async assignPharmacist(prescriptionId: string, pharmacistId: string) {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.assignPharmacist(prescriptionId, pharmacistId);
    await this.auditService.log({
      action: 'PHARMACIST_ASSIGNED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescriptionId,
      newValue: { pharmacistId },
    });
    return this.toResponse(updated);
  }

  async approve(prescriptionId: string, userId: string, notes?: string) {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.update(prescriptionId, {
      status: 'APPROVED',
      verificationStatus: 'APPROVED',
      verifiedBy: userId,
      verifiedAt: new Date(),
      reviewedAt: new Date(),
      completedAt: new Date(),
      notes,
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_APPROVED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescriptionId,
      userId,
      newValue: { status: 'APPROVED' },
    });
    return this.toResponse(updated);
  }

  async reject(prescriptionId: string, userId: string, reason: string) {
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    if (!prescription) throw new BusinessException('Prescription not found', 'PRESCRIPTION_001');
    const updated = await this.prescriptionRepository.update(prescriptionId, {
      status: 'REJECTED',
      verificationStatus: 'REJECTED',
      rejectionReason: reason,
      verifiedBy: userId,
      verifiedAt: new Date(),
      reviewedAt: new Date(),
    });
    await this.auditService.log({
      action: 'PRESCRIPTION_REJECTED',
      module: 'prescriptions',
      resource: 'prescription',
      resourceId: prescriptionId,
      userId,
      newValue: { status: 'REJECTED', reason },
    });
    return this.toResponse(updated);
  }

  // ── Admin features ────────

  async getAdminQueue(params: { status?: string; pharmacistId?: string; page?: number; limit?: number }) {
    return this.prescriptionRepository.findForAdmin({
      status: params.status,
      pharmacistId: params.pharmacistId,
      page: params.page ?? 1,
      limit: Math.min(params.limit ?? 20, 100),
    });
  }

  async getStats() {
    return this.prescriptionRepository.getStats();
  }
}
