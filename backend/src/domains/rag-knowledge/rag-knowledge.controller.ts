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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { RagKnowledgeService } from './rag-knowledge.service';
import {
  CreateKnowledgeSourceDto,
  UpdateKnowledgeSourceDto,
  UploadUrlRequestDto,
} from './rag-knowledge.types';

@ApiTags('RAG Knowledge Admin')
@Controller('admin/rag/knowledge-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class RagKnowledgeController {
  constructor(private readonly knowledgeService: RagKnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'List all knowledge sources' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const data = await this.knowledgeService.findAll(
      Number(page),
      Number(limit),
    );
    return ResponseBuilder.success(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific knowledge source' })
  async findById(@Param('id') id: string) {
    const data = await this.knowledgeService.findById(id);
    return ResponseBuilder.success(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge source' })
  async create(
    @Body() dto: CreateKnowledgeSourceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.knowledgeService.create(dto, user.sub);
    return ResponseBuilder.created(data, 'Knowledge source created');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a knowledge source' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeSourceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.knowledgeService.update(id, dto, user.sub);
    return ResponseBuilder.success(data, 'Knowledge source updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a knowledge source' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.knowledgeService.softDelete(id, user.sub);
    return ResponseBuilder.success(null, 'Knowledge source deleted');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted knowledge source' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.knowledgeService.restore(id, user.sub);
    return ResponseBuilder.success(null, 'Knowledge source restored');
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate S3 presigned upload URL for a document' })
  async getUploadUrl(@Body() dto: UploadUrlRequestDto) {
    const data = await this.knowledgeService.getUploadUrl(dto);
    return ResponseBuilder.created(data, 'Upload URL generated');
  }

  @Post(':id/confirm-upload')
  @ApiOperation({
    summary: 'Confirm document upload exists in S3 and trigger indexing',
  })
  async confirmUpload(
    @Param('id') id: string,
    @Body()
    dto: { s3Key: string; fileName: string; mimeType: string; size: number },
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.knowledgeService.confirmUpload(
      id,
      dto.s3Key,
      dto.fileName,
      dto.mimeType,
      dto.size,
      user.sub,
    );
    return ResponseBuilder.created(data, 'Upload confirmed');
  }

  @Post(':id/reindex')
  @ApiOperation({ summary: 'Trigger manual re-indexing for a source' })
  async reindex(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.knowledgeService.reindex(id, user.sub);
    return ResponseBuilder.success(data, 'Reindexing triggered');
  }

  @Get(':id/indexing-status')
  @ApiOperation({ summary: 'Get current indexing status of a source' })
  async getStatus(@Param('id') id: string) {
    const data = await this.knowledgeService.findById(id);
    return ResponseBuilder.success({
      id: data.id,
      status: data.status,
      lastIndexedAt: data.lastIndexedAt,
      indexingError: data.indexingError,
    });
  }

  @Get(':id/chunks')
  @ApiOperation({
    summary: 'List all text chunks inside a specific knowledge source',
  })
  async findChunks(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const data = await this.knowledgeService.findChunks(
      id,
      Number(page),
      Number(limit),
    );
    return ResponseBuilder.success(data);
  }
}
