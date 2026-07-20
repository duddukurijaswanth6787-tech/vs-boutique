import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionService } from './session.service';
import { SessionQueryDto } from './session.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'List active sessions for current user' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: SessionQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.sessionService.findAll(user.sub, query),
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current session' })
  async findCurrent(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return ResponseBuilder.success(
      await this.sessionService.findCurrent(
        user.sub,
        req.ip,
        req.headers['user-agent'],
      ),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get session monitoring stats' })
  async getStats() {
    return ResponseBuilder.success(await this.sessionService.getStats());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return ResponseBuilder.success(
      await this.sessionService.findById(id, user.sub, user.roles),
    );
  }

  @Post('revoke-current')
  @ApiOperation({ summary: 'Logout current session' })
  async revokeCurrent(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return ResponseBuilder.success(
      await this.sessionService.revokeCurrent(
        user.sub,
        req.ip,
        req.headers['user-agent'],
      ),
    );
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  async revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return ResponseBuilder.success(
      await this.sessionService.revoke(id, user.sub, user.roles),
    );
  }

  @Post('revoke-others')
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  async revokeOthers(
    @CurrentUser() user: JwtPayload,
    @Body('currentSessionId') currentId: string,
  ) {
    return ResponseBuilder.success(
      await this.sessionService.revokeOthers(user.sub, currentId),
    );
  }

  @Post('revoke-all')
  @ApiOperation({ summary: 'Revoke all sessions for current user' })
  async revokeAll(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.sessionService.revokeAll(user.sub),
    );
  }

  @Post('revoke-expired')
  @ApiOperation({ summary: 'Revoke all expired sessions (admin only)' })
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  async revokeExpired() {
    return ResponseBuilder.success(await this.sessionService.revokeExpired());
  }

  @Get('admin/users/:userId')
  @ApiOperation({ summary: 'Admin: list sessions for a specific user' })
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  async adminFindAll(
    @Param('userId') userId: string,
    @Query() query: SessionQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.sessionService.findAll(userId, query),
    );
  }

  @Post('admin/users/:userId/revoke-all')
  @ApiOperation({ summary: 'Admin: revoke all sessions for a user' })
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  async adminRevokeAll(
    @CurrentUser() user: JwtPayload,
    @Param('userId') targetUserId: string,
  ) {
    return ResponseBuilder.success(
      await this.sessionService.revokeAllForUser(user.sub, targetUserId),
    );
  }
}
