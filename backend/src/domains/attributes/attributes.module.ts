import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { AttributesRepository } from './attributes.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AttributesController],
  providers: [AttributesService, AttributesRepository],
})
export class AttributesModule {}
