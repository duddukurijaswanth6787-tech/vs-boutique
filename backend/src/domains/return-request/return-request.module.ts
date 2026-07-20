import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OrderModule } from '@domains/order/order.module';
import { ReturnRequestController } from './return-request.controller';
import { ReturnRequestService } from './return-request.service';
import { ReturnRequestRepository } from './return-request.repository';

@Module({
  imports: [AuthModule, AuditModule, OrderModule],
  controllers: [ReturnRequestController],
  providers: [ReturnRequestService, ReturnRequestRepository],
})
export class ReturnRequestModule {}
