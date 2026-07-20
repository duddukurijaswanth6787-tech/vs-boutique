import { Module } from '@nestjs/common';
import { SecurityAdminService } from './security-admin.service';
import { SecurityAdminController } from './security-admin.controller';

@Module({
  controllers: [SecurityAdminController],
  providers: [SecurityAdminService],
  exports: [SecurityAdminService],
})
export class SecurityAdminModule {}
