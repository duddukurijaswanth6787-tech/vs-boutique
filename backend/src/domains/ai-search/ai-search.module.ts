import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AiSearchController } from './ai-search.controller';
import { AiSearchService } from './ai-search.service';
import { AiSearchRepository } from './ai-search.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AiSearchController],
  providers: [AiSearchService, AiSearchRepository],
})
export class AiSearchModule {}
