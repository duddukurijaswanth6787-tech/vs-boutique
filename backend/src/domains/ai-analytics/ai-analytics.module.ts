import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AiAnalyticsController } from './ai-analytics.controller';
import { AiAnalyticsService } from './ai-analytics.service';

@Module({
  imports: [AuthModule],
  controllers: [AiAnalyticsController],
  providers: [AiAnalyticsService],
})
export class AiAnalyticsModule {}
