import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { FaqRepository } from './faq.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [FaqController],
  providers: [FaqService, FaqRepository],
})
export class FaqModule {}
