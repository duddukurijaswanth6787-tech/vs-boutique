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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permissions.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiQuery({ name: 'module', required: false })
  async findAll(@Query('module') module?: string) {
    return ResponseBuilder.success(
      await this.permissionsService.findAll(module),
    );
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get permission by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.permissionsService.findById(id));
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() dto: CreatePermissionDto) {
    return ResponseBuilder.created(
      await this.permissionsService.create(dto),
      'Permission created',
    );
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a permission' })
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return ResponseBuilder.success(
      await this.permissionsService.update(id, dto),
      'Permission updated',
    );
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Deactivate a permission' })
  async delete(@Param('id') id: string) {
    await this.permissionsService.delete(id);
    return ResponseBuilder.deleted('Permission deactivated');
  }
}
