import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { CustomerAddressService } from './customer-address.service';
import { CustomerAddressRepository } from './customer-address.repository';

@Module({
  imports: [AuditModule],
  providers: [CustomerAddressService, CustomerAddressRepository],
  exports: [CustomerAddressService],
})
export class CustomerAddressModule {}
