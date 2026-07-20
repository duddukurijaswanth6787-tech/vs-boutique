import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AppSettingController } from './app-setting.controller';
import { AppSettingService } from './app-setting.service';
import { AppSettingRepository } from './app-setting.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AppSettingController],
  providers: [AppSettingService, AppSettingRepository],
  exports: [AppSettingService],
})
export class AppSettingModule {}
