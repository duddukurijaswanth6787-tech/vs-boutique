import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { DrugInteractionController } from './drug-interaction.controller';
import { DrugInteractionService } from './drug-interaction.service';
import { DrugInteractionRepository } from './drug-interaction.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DrugInteractionController],
  providers: [DrugInteractionService, DrugInteractionRepository],
})
export class DrugInteractionModule {}
