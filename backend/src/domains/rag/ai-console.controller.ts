import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { AIConsoleService } from './ai-console.service';
import {
  AdminKnowledgeListDto,
  AdminDocumentListDto,
  AdminConversationListDto,
  AdminRetrievalTestDto,
  AdminPromptPreviewDto,
  AdminToggleSourceDto,
} from './ai-console.types';

@ApiTags('RAG Admin Console')
@Controller('rag/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class AIConsoleController {
  constructor(private readonly console: AIConsoleService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard: platform-wide statistics' })
  async dashboard() {
    const data = await this.console.getDashboard();
    return ResponseBuilder.success(data);
  }

  @Get('knowledge')
  @ApiOperation({ summary: 'List knowledge sources (with filters)' })
  async knowledge(@Query() dto: AdminKnowledgeListDto) {
    const data = await this.console.getKnowledge({
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      enabled: dto.enabled,
      syncStatus: dto.syncStatus,
    });
    return ResponseBuilder.success(data);
  }

  @Put('knowledge/:id/toggle')
  @ApiOperation({ summary: 'Enable or disable a knowledge source' })
  async toggleKnowledge(
    @Param('id') id: string,
    @Body() dto: AdminToggleSourceDto,
  ) {
    const data = await this.console.toggleKnowledgeSource(id, dto.enabled);
    return ResponseBuilder.success(data, 'Source updated');
  }

  @Post('knowledge/:id/sync')
  @ApiOperation({ summary: 'Manually trigger sync for a knowledge source' })
  async syncKnowledge(@Param('id') id: string) {
    const data = await this.console.syncKnowledgeSource(id);
    return ResponseBuilder.success(data, 'Sync completed');
  }

  @Post('knowledge/sync-all')
  @ApiOperation({ summary: 'Trigger sync for all enabled knowledge sources' })
  async syncAll() {
    const data = await this.console.syncAllKnowledgeSources();
    return ResponseBuilder.success(data, 'Bulk sync completed');
  }

  @Get('documents')
  @ApiOperation({
    summary: 'List documents with filename/source/status filters',
  })
  async documents(@Query() dto: AdminDocumentListDto) {
    const data = await this.console.getDocuments({
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      filename: dto.filename,
      knowledgeSourceId: dto.knowledgeSourceId,
      status: dto.status,
    });
    return ResponseBuilder.success(data);
  }

  @Get('documents/:id/chunks')
  @ApiOperation({ summary: 'Preview chunks for a document' })
  async documentChunks(
    @Param('id') id: string,
    @Query() dto: AdminDocumentListDto,
  ) {
    const data = await this.console.getDocumentChunks(
      id,
      dto.page ?? 1,
      dto.limit ?? 20,
    );
    return ResponseBuilder.success(data);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'List conversations with user/session/search filters',
  })
  async conversations(@Query() dto: AdminConversationListDto) {
    const data = await this.console.getConversations({
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      userId: dto.userId,
      sessionId: dto.sessionId,
      search: dto.search,
    });
    return ResponseBuilder.success(data);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List configured providers and current selection' })
  async providers() {
    const data = await this.console.getProviders();
    return ResponseBuilder.success(data);
  }

  @Post('retrieval/test')
  @ApiOperation({
    summary: 'Retrieval playground: run retrieval without LLM call',
  })
  async retrievalTest(@Body() dto: AdminRetrievalTestDto) {
    const data = await this.console.testRetrieval(dto);
    return ResponseBuilder.success(data);
  }

  @Post('prompt/preview')
  @ApiOperation({
    summary: 'Prompt playground: preview assembled prompt without LLM call',
  })
  async promptPreview(@Body() dto: AdminPromptPreviewDto) {
    const data = await this.console.previewPrompt(dto);
    return ResponseBuilder.success(data);
  }

  @Get('health')
  @ApiOperation({ summary: 'Aggregated system health with overall score' })
  async health() {
    const data = await this.console.getHealth();
    return ResponseBuilder.success(data);
  }
}
