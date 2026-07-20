import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@domains/auth/auth.module';
import { SearchModule } from '@domains/search/search.module';
import { ProductsModule } from '@domains/products/products.module';
import { AuditModule } from '@domains/audit/audit.module';

import { RagAgentRepository } from './rag-agent.repository';
import { RagAgentService } from './rag-agent.service';
import { RagOrchestratorService } from './rag-orchestrator.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagIntentService } from './rag-intent.service';
import { RagPromptBuilder } from './rag-prompt.builder';
import { RagToolRegistry } from './rag-tool.registry';
import {
  GeminiLlmProvider,
  OpenAiLlmProvider,
  GeminiEmbeddingProvider,
  OpenAiEmbeddingProvider,
  LlmProviderRegistry,
  EmbeddingProviderRegistry,
} from './rag-providers.service';
import { RagAgentController } from './rag-agent.controller';
import { RagAdminAgentController } from './rag-admin-agent.controller';
import { RagAnalyticsController } from './rag-analytics.controller';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SearchModule),
    forwardRef(() => ProductsModule),
    AuditModule,
  ],
  controllers: [
    RagAgentController,
    RagAdminAgentController,
    RagAnalyticsController,
  ],
  providers: [
    RagAgentRepository,
    RagAgentService,
    RagOrchestratorService,
    RagRetrievalService,
    RagIntentService,
    RagPromptBuilder,
    RagToolRegistry,
    GeminiLlmProvider,
    OpenAiLlmProvider,
    GeminiEmbeddingProvider,
    OpenAiEmbeddingProvider,
    LlmProviderRegistry,
    EmbeddingProviderRegistry,
  ],
  exports: [
    RagAgentService,
    RagOrchestratorService,
    RagRetrievalService,
    LlmProviderRegistry,
    EmbeddingProviderRegistry,
  ],
})
export class RagAgentModule {}
