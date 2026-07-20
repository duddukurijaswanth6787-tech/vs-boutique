import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfileRepository } from './customer-profile.repository';

@Module({
  imports: [AuditModule],
  providers: [CustomerProfileService, CustomerProfileRepository],
  exports: [CustomerProfileService, CustomerProfileRepository],
})
export class CustomerProfileModule {}
