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
import { RagAgentService } from './rag-agent.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentStatusDto,
  AssignKnowledgeDto,
  ConfigureToolsDto,
  TestAgentDto,
} from './rag-agent.types';

@ApiTags('RAG Agent Admin')
@Controller('admin/rag/agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class RagAdminAgentController {
  constructor(private readonly agentService: RagAgentService) {}

  @Get()
  @ApiOperation({ summary: 'List all RAG agents (paginated)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const data = await this.agentService.findAll(Number(page), Number(limit));
    return ResponseBuilder.success(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific RAG agent' })
  async findById(@Param('id') id: string) {
    const data = await this.agentService.findById(id);
    return ResponseBuilder.success(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new RAG agent' })
  async create(@Body() dto: CreateAgentDto, @CurrentUser() user: JwtPayload) {
    const data = await this.agentService.create(dto, user.sub);
    return ResponseBuilder.created(data, 'Agent created');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update configuration of a RAG agent' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.agentService.update(id, dto, user.sub);
    return ResponseBuilder.success(data, 'Agent updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a RAG agent' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.agentService.softDelete(id, user.sub);
    return ResponseBuilder.success(null, 'Agent soft deleted');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted RAG agent' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.agentService.restore(id, user.sub);
    return ResponseBuilder.success(null, 'Agent restored');
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a RAG agent' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AgentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.agentService.updateStatus(id, dto.action, user.sub);
    return ResponseBuilder.success(data, 'Status updated');
  }

  @Put(':id/knowledge-sources')
  @ApiOperation({ summary: 'Assign knowledge sources to a RAG agent' })
  async assignKnowledgeSources(
    @Param('id') id: string,
    @Body() dto: AssignKnowledgeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.agentService.assignKnowledgeSources(
      id,
      dto,
      user.sub,
    );
    return ResponseBuilder.success(data, 'Knowledge sources assigned');
  }

  @Put(':id/tools')
  @ApiOperation({ summary: 'Configure enabled tools for a RAG agent' })
  async configureTools(
    @Param('id') id: string,
    @Body() dto: ConfigureToolsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.agentService.configureTools(id, dto, user.sub);
    return ResponseBuilder.success(data, 'Tools updated');
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test query an agent directly in admin context' })
  async test(@Param('id') id: string, @Body() dto: TestAgentDto) {
    const data = await this.agentService.testAgent(id, dto);
    return ResponseBuilder.created(data, 'Test completed');
  }
}
