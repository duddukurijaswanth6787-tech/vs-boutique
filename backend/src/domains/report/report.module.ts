import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { DatabaseModule } from '@database/database.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportExportWorker } from './report-export.worker';

const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

const imports: any[] = [AuthModule, AuditModule, DatabaseModule, StorageModule];

const providers: any[] = [ReportService];

if (isBullMQEnabled) {
  imports.push(
    BullModule.registerQueue({
      name: 'report-export',
    }),
  );
  providers.push(ReportExportWorker);
} else {
  providers.push({
    provide: 'BullQueue_report-export',
    useValue: {
      add: async () => ({ id: randomUUID() }),
    },
  });
}

@Module({
  imports,
  controllers: [ReportController],
  providers,
  exports: [ReportService],
})
export class ReportModule {}
