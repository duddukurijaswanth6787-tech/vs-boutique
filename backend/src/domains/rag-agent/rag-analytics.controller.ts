import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { RagAgentRepository } from './rag-agent.repository';

@ApiTags('RAG Analytics Admin')
@Controller('admin/rag')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class RagAnalyticsController {
  constructor(private readonly repository: RagAgentRepository) {}

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get general performance summary of RAG agents' })
  async getSummary() {
    const summary = await this.repository.getSummaryAnalytics();
    return ResponseBuilder.success(summary);
  }

  @Get('analytics/agents/:agentId')
  @ApiOperation({ summary: 'Get detail metrics for a specific agent' })
  async getAgentAnalytics(@Param('agentId') agentId: string) {
    const analytics = await this.repository.getAgentPerformanceSummary(agentId);
    return ResponseBuilder.success(analytics);
  }

  @Get('analytics/intents')
  @ApiOperation({
    summary: 'Get summary counts of classified user message intents',
  })
  async getIntents() {
    // ponytail: intent classification not yet stored in DB — return 501 instead of fake data
    throw new NotFoundException('Intent analytics not yet available — intent classification data is not persisted');
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Inspect all conversations across the system' })
  async getConversations(@Query('page') page = 1, @Query('limit') limit = 10) {
    const data = await this.repository.findConversations({
      page: Number(page),
      limit: Number(limit),
    });
    return ResponseBuilder.success(data);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Inspect details and messages inside a specific conversation',
  })
  async getConversationDetails(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const conversation = await this.repository.findConversationById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.repository.getConversationMessages({
      conversationId: id,
      page: Number(page),
      limit: Number(limit),
    });
    return ResponseBuilder.success({
      conversation,
      messages,
    });
  }
}
