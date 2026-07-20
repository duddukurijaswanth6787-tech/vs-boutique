import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { ToolRegistryService } from './tool-registry.service';
import { ToolExecuteDto } from './business-tools.types';

@ApiTags('RAG Business Tools')
@Controller('rag/tools')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@ApiBearerAuth()
export class BusinessToolsController {
  constructor(private readonly registry: ToolRegistryService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered business tools' })
  async list() {
    const data = this.registry.list();
    return ResponseBuilder.success({ tools: data });
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a single tool by name (schema + description)' })
  async getOne(@Param('name') name: string) {
    if (!this.registry.has(name))
      throw new NotFoundException(`Tool not found: ${name}`);
    const tool = this.registry.get(name);
    return ResponseBuilder.success({
      name: tool.name,
      description: tool.description,
      schema: tool.schema(),
    });
  }

  @Post(':name/execute')
  @ApiOperation({ summary: 'Execute a business tool with an input payload' })
  async execute(@Param('name') name: string, @Body() dto: ToolExecuteDto) {
    const result = await this.registry.execute(
      name,
      dto.input,
      { userId: dto.userId, roles: dto.roles },
      dto.userId,
    );
    return ResponseBuilder.success({ tool: name, success: true, result });
  }

  @Get('health')
  @ApiOperation({ summary: 'Tool registry health' })
  async health() {
    const data = this.registry.health();
    return ResponseBuilder.success(data);
  }
}
