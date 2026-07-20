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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignRoleDto,
  UserQueryDto,
} from './users.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'List users with search, pagination, filter, sort' })
  async findAll(@Query() query: UserQueryDto) {
    return ResponseBuilder.success(await this.usersService.findAll(query));
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get user by ID with roles and permissions' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.usersService.findById(id));
  }

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto) {
    return ResponseBuilder.created(
      await this.usersService.create(dto),
      'User created',
    );
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update user profile' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return ResponseBuilder.success(
      await this.usersService.update(id, dto),
      'User updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Soft delete user' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
    return ResponseBuilder.deleted('User deleted');
  }

  @Post(':id/restore')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  async restore(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.usersService.restore(id),
      'User restored',
    );
  }

  @Post(':id/activate')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Activate user account' })
  async activate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.usersService.activate(id),
      'User activated',
    );
  }

  @Post(':id/deactivate')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Deactivate user account' })
  async deactivate(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.usersService.deactivate(id),
      'User deactivated',
    );
  }

  @Post(':id/suspend')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Suspend user account' })
  async suspend(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.usersService.suspend(id),
      'User suspended',
    );
  }

  @Post(':id/unlock')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Unlock user account after lockout' })
  async unlock(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.usersService.unlock(id),
      'User unlocked',
    );
  }

  @Post(':id/roles')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.usersService.assignRole(id, dto, user.sub),
      'Role assigned',
    );
  }

  @Delete(':id/roles/:roleId')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.usersService.removeRole(id, roleId, user.sub),
      'Role removed',
    );
  }

  @Get(':id/roles')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get user roles' })
  async getRoles(@Param('id') id: string) {
    return ResponseBuilder.success(await this.usersService.getRoles(id));
  }

  @Get(':id/permissions')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get user permissions (computed from roles)' })
  async getPermissions(@Param('id') id: string) {
    return ResponseBuilder.success(await this.usersService.getPermissions(id));
  }
}
