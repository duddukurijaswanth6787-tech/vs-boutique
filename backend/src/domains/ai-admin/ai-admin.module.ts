import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AiAdminController } from './ai-admin.controller';
import { AiAdminService } from './ai-admin.service';
import { AiAdminRepository } from './ai-admin.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AiAdminController],
  providers: [AiAdminService, AiAdminRepository],
})
export class AiAdminModule {}
