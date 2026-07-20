import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderWorkflowService } from './order-workflow.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, OrderWorkflowService],
  exports: [OrderService, OrderWorkflowService],
})
export class OrderModule {}
