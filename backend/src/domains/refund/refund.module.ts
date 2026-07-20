import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { RefundRepository } from './refund.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RefundController],
  providers: [RefundService, RefundRepository],
  exports: [RefundService],
})
export class RefundModule {}
