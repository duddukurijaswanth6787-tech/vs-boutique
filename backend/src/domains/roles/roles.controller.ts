import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from './roles.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'List all roles' })
  async findAll() {
    return ResponseBuilder.success(await this.rolesService.findAll());
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get role by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.rolesService.findById(id));
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() dto: CreateRoleDto) {
    return ResponseBuilder.created(
      await this.rolesService.create(dto),
      'Role created',
    );
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a role' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return ResponseBuilder.success(
      await this.rolesService.update(id, dto),
      'Role updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Deactivate a role' })
  async delete(@Param('id') id: string) {
    await this.rolesService.delete(id);
    return ResponseBuilder.deleted('Role deactivated');
  }

  @Post(':id/permissions')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Assign permissions to role' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return ResponseBuilder.success(
      await this.rolesService.assignPermissions(id, dto),
      'Permissions assigned',
    );
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remove permission from role' })
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return ResponseBuilder.success(
      await this.rolesService.removePermission(id, permissionId),
      'Permission removed',
    );
  }
}
