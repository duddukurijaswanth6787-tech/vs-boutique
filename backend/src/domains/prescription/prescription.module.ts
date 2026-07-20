import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';
import { PrescriptionRepository } from './prescription.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PrescriptionController],
  providers: [PrescriptionService, PrescriptionRepository],
})
export class PrescriptionModule {}
