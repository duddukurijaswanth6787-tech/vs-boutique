import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // ─── Rules ──────────────────────────────────────────
  @Post('rules')
  @ApiOperation({ summary: 'Create moderation rule (admin)' })
  async createRule(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    const data = await this.moderationService.createRule({ ...dto, createdBy: user.sub });
    return { success: true, data, message: 'Rule created' };
  }

  @Get('rules')
  @ApiOperation({ summary: 'List moderation rules (admin)' })
  async getRules(@Query('type') type?: string, @Query('isActive') isActive?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.moderationService.getRules({
      type, isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update moderation rule (admin)' })
  async updateRule(@Param('id') id: string, @Body() dto: any) {
    const data = await this.moderationService.updateRule(id, dto);
    return { success: true, data, message: 'Rule updated' };
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete moderation rule (admin)' })
  async deleteRule(@Param('id') id: string) {
    await this.moderationService.deleteRule(id);
    return { success: true, message: 'Rule deleted' };
  }

  // ─── Queue ──────────────────────────────────────────
  @Get('queue')
  @ApiOperation({ summary: 'Moderation queue (admin)' })
  async getQueue(@Query('status') status?: string, @Query('contentType') contentType?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.moderationService.getQueue({
      status, contentType,
      page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Put('queue/:id/review')
  @ApiOperation({ summary: 'Review flagged content (admin)' })
  async reviewFlag(@Param('id') id: string, @Body() dto: { decision: string; notes?: string }, @CurrentUser() user: JwtPayload) {
    const data = await this.moderationService.reviewFlag(id, user.sub, dto.decision as any, dto.notes);
    return { success: true, data, message: `Content ${dto.decision}` };
  }

  @Put('queue/:id/assign')
  @ApiOperation({ summary: 'Assign flag to moderator (admin)' })
  async assignFlag(@Param('id') id: string, @Body() dto: { assigneeId: string }) {
    const data = await this.moderationService.assignFlag(id, dto.assigneeId);
    return { success: true, data, message: 'Flag assigned' };
  }

  // ─── Appeals ────────────────────────────────────────
  @Get('appeals')
  @ApiOperation({ summary: 'List appeals (admin)' })
  async getAppeals(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.moderationService.getAppeals({
      status, page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Put('appeals/:id/review')
  @ApiOperation({ summary: 'Review appeal (admin)' })
  async reviewAppeal(@Param('id') id: string, @Body() dto: { decision: string; notes?: string }, @CurrentUser() user: JwtPayload) {
    const data = await this.moderationService.reviewAppeal(id, user.sub, dto.decision as any, dto.notes);
    return { success: true, data, message: `Appeal ${dto.decision}` };
  }

  // ─── Dashboard ──────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Moderation dashboard (admin)' })
  async dashboard() {
    const data = await this.moderationService.getDashboard();
    return { success: true, data };
  }
}
