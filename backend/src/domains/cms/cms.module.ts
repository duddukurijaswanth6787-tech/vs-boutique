import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsRepository } from './cms.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [CmsController],
  providers: [CmsService, CmsRepository],
  exports: [CmsService],
})
export class CmsModule {}
