import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { SocialController } from './social.controller';
import { SocialAdminController } from './social-admin.controller';
import { SocialService } from './social.service';
import { SocialRepository } from './social.repository';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule, StorageModule],
  controllers: [SocialController, SocialAdminController],
  providers: [SocialService, SocialRepository],
  exports: [SocialService, SocialRepository],
})
export class SocialModule {}
