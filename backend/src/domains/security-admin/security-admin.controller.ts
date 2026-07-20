import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { SecurityAdminService } from './security-admin.service';

@ApiTags('Security Admin')
@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class SecurityAdminController {
  constructor(private readonly securityService: SecurityAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Security dashboard overview (admin)' })
  async dashboard() {
    const data = await this.securityService.getDashboard();
    return { success: true, data };
  }

  @Get('login-attempts')
  @ApiOperation({ summary: 'Login attempt history (admin)' })
  async loginAttempts(
    @Query('email') email?: string,
    @Query('success') success?: string,
    @Query('ip') ip?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.securityService.getLoginAttempts({
      email,
      success: success !== undefined ? success === 'true' : undefined,
      ip,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Get('failed-logins')
  @ApiOperation({ summary: 'Failed login report (admin)' })
  async failedLogins(@Query('days') days?: string) {
    const data = await this.securityService.getFailedLoginReport(days ? parseInt(days, 10) : 7);
    return { success: true, data };
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Audit log with filters (admin)' })
  async auditLog(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('userId') userId?: string,
    @Query('days') days?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.securityService.getAuditReport({
      action,
      module,
      userId,
      days: days ? parseInt(days, 10) : 30,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Get('permission-audit')
  @ApiOperation({ summary: 'Permission audit — roles, permissions, users (admin)' })
  async permissionAudit() {
    const data = await this.securityService.getPermissionAudit();
    return { success: true, data };
  }

  // ─── Sessions ────────────────────────────────────────
  @Get('sessions')
  @ApiOperation({ summary: 'Active sessions (admin)' })
  async activeSessions(@Query('userId') userId?: string) {
    const data = await this.securityService.getActiveSessions(userId);
    return { success: true, data };
  }

  @Post('sessions/:id/terminate')
  @ApiOperation({ summary: 'Terminate a session (admin)' })
  async terminateSession(@Param('id') id: string) {
    await this.securityService.terminateSession(id);
    return { success: true, message: 'Session terminated' };
  }

  @Post('sessions/user/:userId/terminate-all')
  @ApiOperation({ summary: 'Terminate all sessions for a user (admin)' })
  async terminateAllSessions(@Param('userId') userId: string) {
    await this.securityService.terminateAllUserSessions(userId);
    return { success: true, message: 'All sessions terminated' };
  }

  // ─── Security Events ─────────────────────────────────
  @Get('events')
  @ApiOperation({ summary: 'Security event log (admin)' })
  async securityEvents(
    @Query('category') category?: string, @Query('severity') severity?: string,
    @Query('userId') userId?: string, @Query('days') days?: string,
    @Query('page') page?: string, @Query('limit') limit?: string,
  ) {
    const data = await this.securityService.getSecurityEvents({
      category, severity, userId,
      days: days ? parseInt(days, 10) : 30,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  // ─── API Abuse ───────────────────────────────────────
  @Get('api-abuse')
  @ApiOperation({ summary: 'API abuse detection dashboard (admin)' })
  async apiAbuse() {
    const data = await this.securityService.getAPIAbuse();
    return { success: true, data };
  }
}
