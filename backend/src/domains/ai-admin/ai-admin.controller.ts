import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiAdminService } from './ai-admin.service';
import {
  CreatePromptTemplateDto,
  UpdatePromptTemplateDto,
  PromptTemplateQueryDto,
} from './ai-admin.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { SanitizeFieldsPipe } from '@common/validation/pipes.validation';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('AI Admin')
@Controller('ai/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class AiAdminController {
  constructor(private readonly aiAdminService: AiAdminService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List prompt templates' })
  async findTemplates(@Query() query: PromptTemplateQueryDto) {
    return ResponseBuilder.success(
      await this.aiAdminService.findTemplates(query),
    );
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  async findTemplateById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.aiAdminService.findTemplateById(id),
    );
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create prompt template' })
  async createTemplate(
    @Body(new SanitizeFieldsPipe(['template'])) dto: CreatePromptTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.aiAdminService.createTemplate(dto, user.sub),
      'Template created',
    );
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update prompt template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body(new SanitizeFieldsPipe(['template'])) dto: UpdatePromptTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiAdminService.updateTemplate(id, dto, user.sub),
      'Template updated',
    );
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage logs' })
  async getUsageLogs(@Query() query: { page?: number; limit?: number }) {
    return ResponseBuilder.success(
      await this.aiAdminService.getUsageLogs(query),
    );
  }
}
