import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule as AppConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { LoggerModule } from '@common/logger/logger.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { QueuesModule } from '@infrastructure/queues/queues.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { MetricsModule } from '@infrastructure/monitoring/metrics.module';
import { ModerationModule } from '@domains/moderation/moderation.module';
import { CorrelationIdMiddleware } from '@common/middleware/correlation-id.middleware';
import { SecurityModule } from '@common/security/security.module';
import { HttpLoggingInterceptor } from '@common/interceptors/http-logging.interceptor';
import { EventsModule } from '@common/events/events.module';
import { GlobalResponseInterceptor } from '@common/interceptors/global-response.interceptor';
import { StartupDashboardService } from '@common/logging/startup-dashboard.service';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { IdentityModule } from '@shared/identity/identity.module';
import { AuthModule } from '@domains/auth/auth.module';
import { UsersModule } from '@domains/users/users.module';
import { RolesModule } from '@domains/roles/roles.module';
import { SecurityAdminModule } from '@domains/security-admin/security-admin.module';
import { PermissionsModule } from '@domains/permissions/permissions.module';
import { StaffModule } from '@domains/staff/staff.module';
import { AuditModule } from '@domains/audit/audit.module';
import { SessionModule } from '@domains/session/session.module';
import { PasswordResetModule } from '@domains/password-reset/password-reset.module';
import { EmailVerificationModule } from '@domains/email-verification/email-verification.module';
import { CommerceModule } from '@shared/commerce/commerce.module';
import { CategoriesModule } from '@domains/categories/categories.module';
import { BrandsModule } from '@domains/brands/brands.module';
import { AttributesModule } from '@domains/attributes/attributes.module';
import { ProductsModule } from '@domains/products/products.module';
import { ProductVariantsModule } from '@domains/product-variants/product-variants.module';
import { InventoryModule } from '@domains/inventory/inventory.module';
import { WarehouseModule } from '@domains/warehouse/warehouse.module';
import { MediaModule } from '@domains/media/media.module';
import { SearchModule } from '@domains/search/search.module';
import { MeModule } from '@domains/me/me.module';
import { WishlistModule } from '@domains/wishlist/wishlist.module';
import { CustomerProfileModule } from '@domains/customer-profile/customer-profile.module';
import { CustomerAddressModule } from '@domains/customer-address/customer-address.module';
import { OrderModule } from '@domains/order/order.module';
import { CheckoutModule } from '@domains/checkout/checkout.module';
import { ReturnRequestModule } from '@domains/return-request/return-request.module';
import { CancellationModule } from '@domains/cancellation/cancellation.module';
import { PaymentModule } from '@domains/payment/payment.module';
import { CouponModule } from '@domains/coupon/coupon.module';
import { OfferModule } from '@domains/offer/offer.module';
import { ShippingModule } from '@domains/shipping/shipping.module';
import { TaxModule } from '@domains/tax/tax.module';
import { InvoiceModule } from '@domains/invoice/invoice.module';
import { RefundModule } from '@domains/refund/refund.module';
import { WalletModule } from '@domains/wallet/wallet.module';
import { NotificationModule } from '@domains/notification/notification.module';
import { ReviewModule } from '@domains/review/review.module';
import { CmsModule } from '@domains/cms/cms.module';
import { CustomerIntelligenceModule } from '@domains/customer-intelligence/customer-intelligence.module';
import { DashboardModule } from '@domains/dashboard/dashboard.module';
import { ReportModule } from '@domains/report/report.module';
import { AppSettingModule } from '@domains/app-setting/app-setting.module';
import { SupportModule } from '@domains/support/support.module';
import { FaqModule } from '@domains/faq/faq.module';
import { CampaignModule } from '@domains/campaign/campaign.module';
import { SocialModule } from '@domains/social/social.module';
import { ImportModule } from '@domains/import/import.module';
import { LoyaltyModule } from '@domains/loyalty/loyalty.module';
import { RecentlyViewedModule } from '@domains/recently-viewed/recently-viewed.module';
import { RecommendationModule } from '@domains/recommendation/recommendation.module';
import { InstagramReelsModule } from '@domains/instagram-reels/instagram-reels.module';
import { HomepageModule } from '@domains/homepage/homepage.module';
import { RagModule } from '@domains/rag/rag.module';
// import { AiChatModule } from '@domains/ai-chat/ai-chat.module'; // ponytail: excluded — Prisma models mismatch
// import { PrescriptionModule } from '@domains/prescription/prescription.module'; // ponytail: excluded — Prisma models mismatch
// import { DrugInteractionModule } from '@domains/drug-interaction/drug-interaction.module'; // ponytail: excluded — Prisma models mismatch
// import { AiSearchModule } from '@domains/ai-search/ai-search.module'; // ponytail: excluded — Prisma models mismatch
// import { AiRecommendationModule } from '@domains/ai-recommendation/ai-recommendation.module'; // ponytail: excluded — unused/unfinished
// import { AiAnalyticsModule } from '@domains/ai-analytics/ai-analytics.module'; // ponytail: excluded — Prisma models mismatch
// import { AiAdminModule } from '@domains/ai-admin/ai-admin.module'; // ponytail: excluded — Prisma models mismatch
// import { RagAgentModule } from '../domains/rag-agent/rag-agent.module'; // ponytail: schema mismatch — code references customerId, behaviorConfig, ragToolExecution, ragAgentMetric not in schema
// import { RagKnowledgeModule } from '../domains/rag-knowledge/rag-knowledge.module'; // ponytail: depends on RagAgentModule

/**
 * Root Application Module coordinates core global services (config, database, caching, health, queues).
 * Applies global correlation tracking middleware and security modules.
 */
@Module({
  imports: [
    // Global Config Module
    AppConfigModule,

    // Global Logger Module
    LoggerModule,

    // Global Throttler Module configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.throttle.ttl', 60) * 1000,
          limit: configService.get<number>('app.throttle.limit', 100),
        },
      ],
    }),

    // Global Event Module (lightweight domain events for cross-domain communication)
    EventsModule,

    // Global Security Module (contains global throttler guard registration)
    SecurityModule,

    // Base database layer
    DatabaseModule,

    // Caching/In-Memory Cache Layer
    RedisModule,

    // Background job queues
    QueuesModule,

    // File Storage Layer
    StorageModule,

    // Multer file upload configuration
    MulterModule.register({ dest: './uploads' }),

    // Subsystem Health monitors
    HealthModule,

    // Application metrics and monitoring
    MonitoringModule,
    MetricsModule,
    ModerationModule,

    // === Identity Layer ===

    // Shared Identity types, enums, constants, and utilities
    IdentityModule,

    // Identity Domain Modules
    AuthModule,
    UsersModule,
    RolesModule,
    SecurityAdminModule,
    PermissionsModule,
    StaffModule,
    AuditModule,
    SessionModule,
    PasswordResetModule,
    EmailVerificationModule,

    // === Commerce Layer (Phase 2.0) ===

    // Shared Commerce types, enums, constants, and utilities
    CommerceModule,

    // Commerce Domain Modules
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    ProductsModule,
    ProductVariantsModule,
    InventoryModule,
    WarehouseModule,
    MediaModule,
    SearchModule,

    // Customer Experience Layer (Phase 3.0)
    MeModule,
    WishlistModule,
    CustomerProfileModule,
    CustomerAddressModule,

    // Order Layer (Phase 4.0)
    OrderModule,
    CheckoutModule,
    ReturnRequestModule,
    CancellationModule,

    // Payments & Business Operations (Phase 5.0)
    PaymentModule,
    CouponModule,
    OfferModule,
    ShippingModule,
    TaxModule,
    InvoiceModule,
    RefundModule,
    WalletModule,

    // Operations, Marketing, CMS, Reports, Dashboard, Settings (Phase 6.0)
    NotificationModule,
    ReviewModule,
    CmsModule,
    CustomerIntelligenceModule,
    DashboardModule,
    ReportModule,
    AppSettingModule,
    SupportModule,
    FaqModule,
    CampaignModule,
    SocialModule,
    ImportModule,
    LoyaltyModule,
    RecentlyViewedModule,
    RecommendationModule,
    InstagramReelsModule,
    HomepageModule,

    // RAG Platform (Phase 1)
    RagModule,

    // AI Platform (Phase 7.0) — ponytail: all excluded, Prisma models not in schema
    // AiChatModule,
    // PrescriptionModule,
    // DrugInteractionModule,
    // AiSearchModule,
    // AiRecommendationModule,
    // AiAnalyticsModule,
    // AiAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    StartupDashboardService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configures middleware components.
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation tracking middleware to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*path');
  }
}
