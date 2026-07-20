import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { ReportService } from './report.service';
import { convertToCsv } from './report.utils';

@Processor('report-export')
@Injectable()
export class ReportExportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportExportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { jobId, type, startDate, endDate } = job.data;
    this.logger.log(`Processing export job ${jobId} of type ${type}`);

    try {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      let reportData: any;
      if (type === 'SALES') {
        reportData = await this.reportService.generateSalesReport(
          startDate,
          endDate,
        );
      } else if (type === 'INVENTORY') {
        reportData = await this.reportService.generateInventoryReport();
      } else if (type === 'CUSTOMER') {
        reportData = await this.reportService.generateCustomerReport();
      } else if (type === 'ORDER') {
        reportData = await this.reportService.generateOrderReport(
          startDate,
          endDate,
        );
      } else {
        throw new BadRequestException(`Unsupported report type: ${type}`);
      }

      // Convert to CSV
      const csvString = this.convertToCsv(type, reportData.data);
      const csvBuffer = Buffer.from(csvString, 'utf-8');

      // Upload to StorageService
      const filename = `export_${type.toLowerCase()}_${Date.now()}.csv`;
      const uploadResult = await this.storageService.upload(csvBuffer, {
        originalName: filename,
        mimeType: 'text/csv',
        folder: `exports/${type.toLowerCase()}/${jobId}`,
      });

      // Update ExportJob
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          fileUrl: uploadResult.key,
        },
      });

      this.logger.log(`Export job ${jobId} completed successfully.`);
    } catch (err: any) {
      this.logger.error(
        `Export job ${jobId} failed: ${err.message}`,
        err.stack,
      );
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: err.message,
        },
      });
    }
  }

  private convertToCsv(type: string, data: any): string {
    return convertToCsv(type, data);
  }
}
