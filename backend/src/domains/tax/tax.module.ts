import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { TaxRepository } from './tax.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [TaxController],
  providers: [TaxService, TaxRepository],
  exports: [TaxService],
})
export class TaxModule {}
