import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OrderModule } from '@domains/order/order.module';
import { CancellationController } from './cancellation.controller';
import { CancellationService } from './cancellation.service';
import { CancellationRepository } from './cancellation.repository';

@Module({
  imports: [AuthModule, AuditModule, OrderModule],
  controllers: [CancellationController],
  providers: [CancellationService, CancellationRepository],
})
export class CancellationModule {}
