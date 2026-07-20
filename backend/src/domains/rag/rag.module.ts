import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { DatabaseModule } from '@database/database.module';
import { MetricsModule } from '@infrastructure/monitoring/metrics.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { ProductsModule } from '@domains/products/products.module';
import { CategoriesModule } from '@domains/categories/categories.module';
import { InventoryModule } from '@domains/inventory/inventory.module';
import { OrderModule } from '@domains/order/order.module';
import { CustomerProfileModule } from '@domains/customer-profile/customer-profile.module';
import { RecentlyViewedModule } from '@domains/recently-viewed/recently-viewed.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { RagRepository } from './rag.repository';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import { EmbeddingService } from './embedding.service';
import { EmbeddingWorker } from './embedding.worker';
import { UploadService } from './upload.service';
import { ChunkingService } from './chunking.service';
import { LocalStorageProvider, S3StorageProvider } from './storage.provider';
import { DocumentAdapter } from './knowledge-source.adapter';
import { RetrievalService } from './retrieval.service';
import { RerankingService } from './reranking.service';
import { AIOrchestratorService } from './orchestrator.service';
import { GeminiLLMProvider, MockLLMProvider } from './llm-provider.interface';
import { AIConsoleService } from './ai-console.service';
import { AIConsoleController } from './ai-console.controller';
import { CustomerChatService } from './customer-chat.service';
import { CustomerChatController } from './customer-chat.controller';
import { ChatStreamService } from './chat-stream.service';
import {
  ToolRegistryService,
  BUSINESS_TOOLS,
} from './business-tools/tool-registry.service';
import { BusinessToolsController } from './business-tools/business-tools.controller';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  ProductTool,
  CategoryTool,
  InventoryTool,
  OrderTool,
  CustomerTool,
  RecommendationTool,
  KnowledgeTool,
  AnalyticsTool,
} from './business-tools/tools';
import ragConfig from './rag.config';

const storageProviderFactory: Provider = {
  provide: 'STORAGE_PROVIDER',
  useFactory: (config: ConfigService) => {
    const provider = config.get<string>('rag.storageProvider', 'local');
    return provider === 's3'
      ? new S3StorageProvider(config)
      : new LocalStorageProvider(config);
  },
  inject: [ConfigService],
};

const businessToolsFactory: Provider = {
  provide: BUSINESS_TOOLS,
  useFactory: (
    product: ProductTool,
    category: CategoryTool,
    inventory: InventoryTool,
    order: OrderTool,
    customer: CustomerTool,
    recommendation: RecommendationTool,
    knowledge: KnowledgeTool,
    analytics: AnalyticsTool,
  ) => [
    product,
    category,
    inventory,
    order,
    customer,
    recommendation,
    knowledge,
    analytics,
  ],
  inject: [
    ProductTool,
    CategoryTool,
    InventoryTool,
    OrderTool,
    CustomerTool,
    RecommendationTool,
    KnowledgeTool,
    AnalyticsTool,
  ],
};

@Module({
  imports: [
    ConfigModule.forFeature(ragConfig),
    DatabaseModule,
    AuthModule,
    AuditModule,
    StorageModule,
    ProductsModule,
    CategoriesModule,
    InventoryModule,
    OrderModule,
    CustomerProfileModule,
    RecentlyViewedModule,
    BullModule.registerQueue({ name: 'embedding-generation' }),
    MetricsModule,
  ],
  controllers: [
    RagController,
    AIConsoleController,
    CustomerChatController,
    BusinessToolsController,
    AnalyticsController,
  ],
  providers: [
    RagService,
    RagRepository,
    GeminiEmbeddingProvider,
    EmbeddingService,
    EmbeddingWorker,
    UploadService,
    ChunkingService,
    DocumentAdapter,
    RetrievalService,
    RerankingService,
    AIOrchestratorService,
    GeminiLLMProvider,
    MockLLMProvider,
    AIConsoleService,
    CustomerChatService,
    ChatStreamService,
    ProductTool,
    CategoryTool,
    InventoryTool,
    OrderTool,
    CustomerTool,
    RecommendationTool,
    KnowledgeTool,
    AnalyticsTool,
    ToolRegistryService,
    businessToolsFactory,
    storageProviderFactory,
    AnalyticsService,
  ],
  exports: [
    RagService,
    RagRepository,
    EmbeddingService,
    UploadService,
    ChunkingService,
    AIOrchestratorService,
    AIConsoleService,
    CustomerChatService,
    ToolRegistryService,
    AnalyticsService,
  ],
})
export class RagModule {}
