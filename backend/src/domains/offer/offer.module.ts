import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { OfferRepository } from './offer.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [OfferController],
  providers: [OfferService, OfferRepository],
  exports: [OfferService],
})
export class OfferModule {}
