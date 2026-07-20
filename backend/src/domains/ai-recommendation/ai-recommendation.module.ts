import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AiRecommendationController } from './ai-recommendation.controller';
import { AiRecommendationService } from './ai-recommendation.service';
import { AiRecommendationRepository } from './ai-recommendation.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AiRecommendationController],
  providers: [AiRecommendationService, AiRecommendationRepository],
  exports: [AiRecommendationService],
})
export class AiRecommendationModule {}
