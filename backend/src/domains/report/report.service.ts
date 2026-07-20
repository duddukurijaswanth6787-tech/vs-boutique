import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StorageService } from '@infrastructure/storage/storage.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { BusinessException, ValidationException } from '@common/exceptions';
import {
  GenerateReportDto,
  ReportResponse,
  ExportJobResponse,
} from './report.types';
import { convertToCsv } from './report.utils';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: CacheService,
    @Optional()
    @InjectQueue('report-export')
    private readonly exportQueue?: Queue,
  ) {}

  // ponytail: reports are read-only aggregations; cache by type+range to skip heavy scans on repeat loads
  private async cachedReport(
    type: string,
    startDate: string | undefined,
    endDate: string | undefined,
    factory: () => Promise<ReportResponse>,
  ): Promise<ReportResponse> {
    const key = `report:${type}:${startDate ?? 'all'}:${endDate ?? 'all'}`;
    return this.cache.getOrSet(key, factory, 120);
  }

  async generateSalesReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    return this.cachedReport('sales', startDate, endDate, () =>
      this.computeSalesReport(startDate, endDate),
    );
  }

  private async computeSalesReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, revenueAgg] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.aggregate({ _sum: { grandTotal: true }, where }),
    ]);

    return {
      type: 'SALES',
      data: {
        totalRevenue: Number(revenueAgg._sum.grandTotal ?? 0),
        totalOrders: orders.length,
        orders,
      },
      generatedAt: new Date(),
    };
  }

  async generateInventoryReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    return this.cachedReport('inventory', startDate, endDate, () =>
      this.computeInventoryReport(startDate, endDate),
    );
  }

  private async computeInventoryReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = {};
    if (startDate || endDate) {
      where.variant = { product: {} };
      if (startDate)
        where.variant.product.createdAt = { gte: new Date(startDate) };
      if (endDate)
        where.variant.product.createdAt = {
          ...where.variant.product.createdAt,
          lte: new Date(endDate),
        };
    }

    const inventory = await this.prisma.inventory.findMany({
      where,
      include: {
        variant: {
          select: {
            sku: true,
            title: true,
            product: { select: { name: true, createdAt: true } },
          },
        },
      },
    });

    return {
      type: 'INVENTORY',
      data: {
        totalItems: inventory.length,
        lowStock: inventory.filter((i) => i.stockStatus === 'LOW_STOCK').length,
        outOfStock: inventory.filter((i) => i.stockStatus === 'OUT_OF_STOCK')
          .length,
        items: inventory,
      },
      generatedAt: new Date(),
    };
  }

  async generateCustomerReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    return this.cachedReport('customer', startDate, endDate, () =>
      this.computeCustomerReport(startDate, endDate),
    );
  }

  private async computeCustomerReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }
    const hasDateFilter = startDate || endDate;

    const orderWhere = hasDateFilter ? { createdAt: dateFilter } : {};
    const [customers, totalOrders] = await Promise.all([
      this.prisma.customerProfile.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        _sum: { grandTotal: true },
        _count: true,
        where: orderWhere,
      }),
    ]);

    const orderMap = new Map(totalOrders.map((o) => [o.customerId, o]));

    return {
      type: 'CUSTOMER',
      data: {
        totalCustomers: customers.length,
        customers: customers.map((c) => ({
          ...c,
          totalSpent: Number(orderMap.get(c.id)?._sum.grandTotal ?? 0),
          orderCount: orderMap.get(c.id)?._count ?? 0,
        })),
      },
      generatedAt: new Date(),
    };
  }

  async generateOrderReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    return this.cachedReport('order', startDate, endDate, () =>
      this.computeOrderReport(startDate, endDate),
    );
  }

  private async computeOrderReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, statusCounts] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: { productName: true, quantity: true, totalPrice: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: true, where }),
    ]);

    return {
      type: 'ORDER',
      data: {
        totalOrders: orders.length,
        statusBreakdown: Object.fromEntries(
          statusCounts.map((s) => [s.status, s._count]),
        ),
        orders,
      },
      generatedAt: new Date(),
    };
  }

  async generatePaymentReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    return this.cachedReport('payment', startDate, endDate, () =>
      this.computePaymentReport(startDate, endDate),
    );
  }

  private async computePaymentReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payments, amountAgg] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where }),
    ]);

    return {
      type: 'PAYMENT',
      data: {
        totalPayments: payments.length,
        totalAmount: Number(amountAgg._sum.amount ?? 0),
        payments,
      },
      generatedAt: new Date(),
    };
  }

  async getExportJobs(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.exportJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.exportJob.count(),
    ]);

    return {
      data: data.map((job) => ({
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        fileUrl: job.fileUrl ?? undefined,
        error: job.error ?? undefined,
        createdAt: job.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getExportJobDownloadUrl(id: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id },
    });

    if (!job) throw new BusinessException('Export job not found', 'EXPORT_001');
    if (job.status !== 'COMPLETED' || !job.fileUrl) {
      throw new BusinessException('Export file not ready', 'EXPORT_002');
    }

    const url = await this.storageService.getSignedDownloadUrl(job.fileUrl);
    return { url };
  }

  async createExportJob(
    dto: GenerateReportDto,
    userId: string,
  ): Promise<ExportJobResponse> {
    const job = await this.prisma.exportJob.create({
      data: {
        type: dto.type,
        format: dto.format ?? 'CSV',
        requestedBy: userId,
      },
    });

    const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

    if (isBullMQEnabled && this.exportQueue) {
      await this.exportQueue.add('generate-report', {
        jobId: job.id,
        type: job.type,
        format: job.format,
        startDate: dto.startDate,
        endDate: dto.endDate,
        userId,
      });
    } else {
      // Fallback: trigger synchronous generation in next tick
      process.nextTick(async () => {
        try {
          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: { status: 'PROCESSING' },
          });

          let reportData: any;
          if (job.type === 'SALES') {
            reportData = await this.generateSalesReport(
              dto.startDate,
              dto.endDate,
            );
          } else if (job.type === 'INVENTORY') {
            reportData = await this.generateInventoryReport();
          } else if (job.type === 'CUSTOMER') {
            reportData = await this.generateCustomerReport();
          } else if (job.type === 'ORDER') {
            reportData = await this.generateOrderReport(
              dto.startDate,
              dto.endDate,
            );
          } else {
            throw new ValidationException(
              `Unsupported report type: ${job.type}`,
              'REPORT_001',
            );
          }

          const csvString = this.convertToCsv(job.type, reportData.data);
          const csvBuffer = Buffer.from(csvString, 'utf-8');

          const filename = `export_${job.type.toLowerCase()}_${Date.now()}.csv`;
          const uploadResult = await this.storageService.upload(csvBuffer, {
            originalName: filename,
            mimeType: 'text/csv',
            folder: `exports/${job.type.toLowerCase()}/${job.id}`,
          });

          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              fileUrl: uploadResult.key,
            },
          });
        } catch (err: any) {
          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              error: err.message,
            },
          });
        }
      });
    }

    return {
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status,
      fileUrl: job.fileUrl ?? undefined,
      createdAt: job.createdAt,
    };
  }

  private convertToCsv(type: string, data: any): string {
    return convertToCsv(type, data);
  }
}
