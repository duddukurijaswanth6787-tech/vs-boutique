import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  InviteStaffDto,
  AcceptInviteDto,
  AssignPermissionOverrideDto,
} from './staff.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import { BulkActionDto } from '@common/dto/bulk.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'List all staff with search, pagination, filter, sort',
  })
  async findAll(@Query() query: StaffQueryDto) {
    return ResponseBuilder.success(await this.staffService.findAll(query));
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Get staff by ID with roles, permissions, and profile',
  })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.staffService.findById(id));
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({
    summary:
      'Create a new staff member (supports invitation flow via sendInvite flag)',
  })
  async create(@Body() dto: CreateStaffDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.staffService.create(dto, user.sub),
      'Staff created',
    );
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update a staff member profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return ResponseBuilder.success(
      await this.staffService.update(id, dto),
      'Staff updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Soft delete a staff member' })
  async delete(@Param('id') id: string) {
    await this.staffService.delete(id);
    return ResponseBuilder.deleted('Staff deleted');
  }

  @Post(':id/restore')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Restore a soft-deleted staff member' })
  async restore(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.restore(id),
      'Staff restored',
    );
  }

  @Post(':id/activate')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Activate a staff member' })
  async activate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.activate(id),
      'Staff activated',
    );
  }

  @Post(':id/deactivate')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Deactivate a staff member' })
  async deactivate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.deactivate(id),
      'Staff deactivated',
    );
  }

  @Post(':id/suspend')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Suspend a staff member' })
  async suspend(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.suspend(id),
      'Staff suspended',
    );
  }

  @Post(':id/lock')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Lock a staff member account' })
  async lock(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.lock(id),
      'Staff locked',
    );
  }

  @Post(':id/unlock')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Unlock a staff member account' })
  async unlock(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.unlock(id),
      'Staff unlocked',
    );
  }

  @Post('bulk')
  @Roles('super_admin')
  @ApiOperation({
    summary:
      'Bulk action on staff (delete/restore/activate/deactivate/suspend/lock/unlock)',
  })
  async bulk(@Body() dto: BulkActionDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(await this.staffService.bulk(dto, user.sub));
  }

  // --- Invitation Endpoints ---

  @Post('invite')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Invite a new staff member via email' })
  async invite(@Body() dto: InviteStaffDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.staffService.invite(dto, user.sub),
      'Invitation sent',
    );
  }

  @Post('accept-invite')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Accept invitation and set password' })
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return ResponseBuilder.success(
      await this.staffService.acceptInvite(dto),
      'Invitation accepted',
    );
  }

  @Post(':id/resend-invite')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Resend invitation to staff member' })
  async resendInvite(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.resendInvite(id),
      'Invitation resent',
    );
  }

  @Post(':id/cancel-invite')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Cancel pending invitation' })
  async cancelInvite(@Param('id') id: string) {
    await this.staffService.cancelInvite(id);
    return ResponseBuilder.success(null, 'Invitation cancelled');
  }

  @Get(':id/invitations')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get invitation history for a staff member' })
  async getInvitations(@Param('id') id: string) {
    return ResponseBuilder.success(await this.staffService.getInvitations(id));
  }

  // --- Permission Override Endpoints ---

  @Post(':id/permission-overrides')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Assign or revoke a permission override for a staff member',
  })
  async assignPermissionOverride(
    @Param('id') id: string,
    @Body() dto: AssignPermissionOverrideDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.staffService.assignPermissionOverride(
        id,
        dto.permissionCode,
        dto.isGranted ?? true,
        user.sub,
      ),
      'Permission override assigned',
    );
  }

  @Delete(':id/permission-overrides/:permissionCode')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remove a permission override' })
  async removePermissionOverride(
    @Param('id') id: string,
    @Param('permissionCode') permissionCode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.staffService.removePermissionOverride(
        id,
        permissionCode,
        user.sub,
      ),
      'Permission override removed',
    );
  }

  @Get(':id/permission-overrides')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get all permission overrides for a staff member' })
  async getPermissionOverrides(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.staffService.getPermissionOverrides(id),
    );
  }
}
