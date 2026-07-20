import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatRepository } from './ai-chat.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AiChatController],
  providers: [AiChatService, AiChatRepository],
})
export class AiChatModule {}
