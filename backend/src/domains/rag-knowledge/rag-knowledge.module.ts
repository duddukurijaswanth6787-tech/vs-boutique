import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { AuditModule } from '@domains/audit/audit.module';
import { RagAgentModule } from '../rag-agent/rag-agent.module';
import { BullModule } from '@nestjs/bullmq';

import { RagKnowledgeRepository } from './rag-knowledge.repository';
import { RagKnowledgeService } from './rag-knowledge.service';
import { RagIngestionService } from './rag-ingestion.service';
import { RagIngestionWorker } from './rag-ingestion.worker';
import { RagKnowledgeController } from './rag-knowledge.controller';

const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
const imports: any[] = [
  DatabaseModule,
  ConfigModule,
  StorageModule,
  AuditModule,
  RagAgentModule,
];

const providers: any[] = [
  RagKnowledgeRepository,
  RagKnowledgeService,
  RagIngestionService,
];

if (isBullMQEnabled) {
  imports.push(
    BullModule.registerQueue({
      name: 'rag-ingestion',
    }),
  );
  providers.push(RagIngestionWorker);
} else {
  providers.push({
    provide: 'BullQueue_rag-ingestion',
    useValue: {
      add: async () => {},
    },
  });
}

@Module({
  imports,
  controllers: [RagKnowledgeController],
  providers,
  exports: [RagKnowledgeService, RagIngestionService],
})
export class RagKnowledgeModule {}
