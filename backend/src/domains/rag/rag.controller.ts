import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { UploadService } from './upload.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  CreateKnowledgeSourceDto,
  UpdateKnowledgeSourceDto,
  SubmitFeedbackDto,
  VectorSearchDto,
  PaginationDto,
} from './rag.types';
import { GenerateEmbeddingDto, BatchEmbeddingDto } from './embedding.types';
import {
  UploadDocumentDto,
  DocumentListDto,
  ReprocessDocumentDto,
} from './upload.types';
import { RetrievalService } from './retrieval.service';
import { RetrieveDto, BatchRetrieveDto } from './retrieval.types';
import { AIOrchestratorService } from './orchestrator.service';
import { OrchestrateDto } from './orchestrator.types';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('RAG Platform')
@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly embeddingService: EmbeddingService,
    private readonly uploadService: UploadService,
    private readonly retrievalService: RetrievalService,
    private readonly orchestratorService: AIOrchestratorService,
  ) {}

  @Get('agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all RAG agents (paginated)' })
  async findAgents(@Query() pagination: PaginationDto) {
    const data = await this.ragService.findAgents(
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a RAG agent by ID' })
  async findAgentById(@Param('id') id: string) {
    const data = await this.ragService.findAgentById(id);
    return ResponseBuilder.success(data);
  }

  @Post('agents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new RAG agent' })
  async createAgent(
    @Body() dto: CreateAgentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.ragService.createAgent(dto, user.sub);
    return ResponseBuilder.created(data, 'Agent created');
  }

  @Put('agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a RAG agent' })
  async updateAgent(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.ragService.updateAgent(id, dto, user.sub);
    return ResponseBuilder.success(data, 'Agent updated');
  }

  @Delete('agents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a RAG agent' })
  async deleteAgent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.ragService.deleteAgent(id, user.sub);
    return ResponseBuilder.success(null, 'Agent deleted');
  }

  @Get('knowledge-sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all knowledge sources (paginated)' })
  async findKnowledgeSources(@Query() pagination: PaginationDto) {
    const data = await this.ragService.findKnowledgeSources(
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('knowledge-sources/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Knowledge source health check' })
  async knowledgeSourceHealth() {
    const data = await this.ragService.getKnowledgeSourceHealth();
    return ResponseBuilder.success(data);
  }

  @Get('knowledge-sources/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Knowledge source statistics' })
  async knowledgeSourceStats() {
    const data = await this.ragService.getKnowledgeSourceStats();
    return ResponseBuilder.success(data);
  }

  @Get('knowledge-sources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a knowledge source by ID' })
  async findKnowledgeSourceById(@Param('id') id: string) {
    const data = await this.ragService.findKnowledgeSourceById(id);
    return ResponseBuilder.success(data);
  }

  @Post('knowledge-sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge source' })
  async createKnowledgeSource(
    @Body() dto: CreateKnowledgeSourceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.ragService.createKnowledgeSource(dto, user.sub);
    return ResponseBuilder.created(data, 'Knowledge source created');
  }

  @Put('knowledge-sources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge source' })
  async updateKnowledgeSource(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeSourceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.ragService.updateKnowledgeSource(id, dto, user.sub);
    return ResponseBuilder.success(data, 'Knowledge source updated');
  }

  @Delete('knowledge-sources/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a knowledge source' })
  async deleteKnowledgeSource(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.ragService.deleteKnowledgeSource(id, user.sub);
    return ResponseBuilder.success(null, 'Knowledge source deleted');
  }

  @Post('knowledge-sources/:id/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger sync for a knowledge source' })
  async syncKnowledgeSource(@Param('id') id: string) {
    const data = await this.ragService.syncKnowledgeSource(id);
    return ResponseBuilder.success(data, 'Sync completed');
  }

  @Post('knowledge-sources/sync-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger sync for all enabled knowledge sources' })
  async syncAllKnowledgeSources() {
    const data = await this.ragService.syncAllKnowledgeSources();
    return ResponseBuilder.success(data, 'Bulk sync completed');
  }

  @Get('knowledge-sources/:id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List documents in a knowledge source' })
  async findDocumentsBySource(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    const data = await this.ragService.findDocumentsBySource(
      id,
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all RAG conversations (paginated)' })
  async findConversations(@Query() pagination: PaginationDto) {
    const data = await this.ragService.findConversations(
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a conversation by ID with messages' })
  async findConversationById(@Param('id') id: string) {
    const data = await this.ragService.findConversationById(id);
    return ResponseBuilder.success(data);
  }

  @Delete('conversations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a conversation' })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.ragService.deleteConversation(id, user.sub);
    return ResponseBuilder.success(null, 'Conversation archived');
  }

  @Post('messages/:id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback on a message' })
  async submitFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.ragService.submitFeedback(id, dto, user.sub);
    return ResponseBuilder.created(data, 'Feedback recorded');
  }

  @Get('embedding-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List embedding jobs (paginated)' })
  async findEmbeddingJobs(@Query() pagination: PaginationDto) {
    const data = await this.ragService.findEmbeddingJobs(
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('embedding-jobs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an embedding job by ID' })
  async findEmbeddingJobById(@Param('id') id: string) {
    const data = await this.ragService.findEmbeddingJobById(id);
    return ResponseBuilder.success(data);
  }

  // ── Document Ingestion ───────────────────────────────────────

  @Get('documents/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Document ingestion health check' })
  async documentHealth() {
    const data = await this.uploadService.health();
    return ResponseBuilder.success(data);
  }

  @Post('documents/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for ingestion' })
  async uploadDocument(
    @UploadedFile() file: UploadedFile,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.uploadService.upload(file, {
      ...dto,
      createdBy: user.sub,
    });
    return ResponseBuilder.created(
      result,
      'Document uploaded and queued for ingestion',
    );
  }

  @Post('documents/batch-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiOperation({ summary: 'Upload multiple documents (max 20)' })
  async batchUploadDocuments(
    @UploadedFiles() files: UploadedFile[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const results = await Promise.allSettled(
      files.map((f) =>
        this.uploadService.upload(
          {
            buffer: f.buffer,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          },
          { ...dto, createdBy: user.sub },
        ),
      ),
    );
    const documents = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').length;
    return ResponseBuilder.created(
      { documents, totalSize: files.reduce((s, f) => s + f.size, 0), failed },
      `${documents.length} documents uploaded, ${failed} failed`,
    );
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List ingested documents (paginated)' })
  async listDocuments(@Query() pagination: DocumentListDto) {
    const data = await this.uploadService.listDocuments(
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(@Param('id') id: string) {
    const data = await this.uploadService.getDocument(id);
    return ResponseBuilder.success(data);
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a document' })
  async deleteDocument(@Param('id') id: string) {
    await this.uploadService.deleteDocument(id);
    return ResponseBuilder.success(null, 'Document deleted');
  }

  @Post('documents/:id/reprocess')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reprocess a document (re-parse, re-chunk, re-embed)',
  })
  async reprocessDocument(
    @Param('id') id: string,
    @Body() dto: ReprocessDocumentDto,
  ) {
    const result = await this.uploadService.reprocessDocument(id, dto);
    return ResponseBuilder.success(result, 'Document reprocessing started');
  }

  @Get('documents/:id/chunks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List chunks for a document' })
  async getDocumentChunks(
    @Param('id') id: string,
    @Query() pagination: DocumentListDto,
  ) {
    const data = await this.uploadService.getChunksByDocument(
      id,
      pagination.page!,
      pagination.limit!,
    );
    return ResponseBuilder.success(data);
  }

  @Get('documents/:id/jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List embedding jobs for a document' })
  async getDocumentJobs(@Param('id') id: string) {
    const data = await this.uploadService.getJobsByDocument(id);
    return ResponseBuilder.success(data);
  }

  // ── Retrieval ────────────────────────────────────────────────

  @Post('retrieve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve relevant context chunks for a query' })
  async retrieve(@Body() dto: RetrieveDto) {
    const data = await this.retrievalService.retrieve(dto);
    return ResponseBuilder.success(data);
  }

  @Post('retrieve/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch retrieve for multiple queries (max 25)' })
  async batchRetrieve(@Body() dto: BatchRetrieveDto) {
    const data = await this.retrievalService.batchRetrieve(
      dto.queries,
      dto.topK ?? 5,
      dto.threshold ?? 0.7,
    );
    return ResponseBuilder.success(data);
  }

  @Get('retrieve/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieval pipeline health check' })
  async retrieveHealth() {
    const data = await this.retrievalService.health();
    return ResponseBuilder.success(data);
  }

  // ── Orchestrator ─────────────────────────────────────────────

  @Post('orchestrate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Orchestrate an AI conversation with retrieval-augmented generation',
  })
  async orchestrate(@Body() dto: OrchestrateDto) {
    const data = await this.orchestratorService.orchestrate(dto);
    return ResponseBuilder.success(data);
  }

  @Get('orchestrate/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Orchestrator health check' })
  async orchestratorHealth() {
    const data = await this.orchestratorService.health();
    return ResponseBuilder.success(data);
  }

  @Get('orchestrate/tools')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available orchestrator tools' })
  async listTools() {
    const data = await this.orchestratorService.getTools();
    return ResponseBuilder.success(data);
  }

  // ── Vector search ────────────────────────────────────────────

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vector similarity search using pgvector' })
  async vectorSearch(@Body() dto: VectorSearchDto) {
    const data = await this.ragService.vectorSearch(dto);
    return ResponseBuilder.success(data);
  }

  @Get('health/vector')
  @ApiOperation({
    summary: 'Vector infrastructure health check: pgvector, indexes, latency',
  })
  async vectorHealth() {
    const data = await this.ragService.vectorHealth();
    return ResponseBuilder.success(data);
  }

  @Get('search/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vector index statistics (indexed vs pending chunks)',
  })
  async searchStats() {
    const [indexed, pending] = await Promise.all([
      this.ragService.countIndexed(),
      this.ragService.countPending(),
    ]);
    return ResponseBuilder.success({ indexed, pending });
  }

  // ── Embeddings ──────────────────────────────────────────────

  @Post('embeddings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate embedding for text and store in vector DB',
  })
  async generateEmbedding(@Body() dto: GenerateEmbeddingDto) {
    const result = await this.embeddingService.generateEmbedding(
      dto.text,
      dto.model,
    );
    return ResponseBuilder.success(result);
  }

  @Post('embeddings/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate embeddings for multiple texts (max 100)' })
  async generateBatch(@Body() dto: BatchEmbeddingDto) {
    const result = await this.embeddingService.generateBatch(
      dto.texts,
      dto.model,
    );
    return ResponseBuilder.success(result);
  }

  @Get('embeddings/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Embedding provider health check' })
  async embeddingHealth() {
    const result = await this.embeddingService.healthCheck();
    return ResponseBuilder.success(result);
  }

  @Get('embeddings/providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available embedding providers' })
  async listProviders() {
    const result = await this.embeddingService.getProviderInfo();
    return ResponseBuilder.success(result);
  }
}
