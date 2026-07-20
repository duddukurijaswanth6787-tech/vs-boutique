import { Module } from '@nestjs/common';
import { CustomerIntelligenceService } from './customer-intelligence.service';
import { CustomerIntelligenceController } from './customer-intelligence.controller';

@Module({
  controllers: [CustomerIntelligenceController],
  providers: [CustomerIntelligenceService],
  exports: [CustomerIntelligenceService],
})
export class CustomerIntelligenceModule {}
