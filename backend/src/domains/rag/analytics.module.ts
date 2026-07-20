import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RagRepository } from './rag.repository';
import { EmbeddingService } from './embedding.service';
import { AIOrchestratorService } from './orchestrator.service';
import { AIConsoleService } from './ai-console.service';
import { DatabaseModule } from '@database/database.module';
import { MetricsModule } from '@infrastructure/monitoring/metrics.module';
import { AuditModule } from '@domains/audit/audit.module';

// ponytail: Analytics is a thin READ layer over existing repos/services + the shared metric registry.
// No new counters, no new Prisma; everything reuses prior-phase infrastructure.
@Module({
  imports: [DatabaseModule, MetricsModule, AuditModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    RagRepository,
    EmbeddingService,
    AIOrchestratorService,
    AIConsoleService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
