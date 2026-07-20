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
import { WarehouseService } from './warehouse.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseQueryDto,
  CreateLocationDto,
  AssignWarehouseInventoryDto,
  TransferStockDto,
} from './warehouse.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Warehouses')
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'List warehouses with search, pagination, sorting' })
  async findAll(@Query() query: WarehouseQueryDto) {
    return ResponseBuilder.success(await this.warehouseService.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.warehouseService.findById(id));
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Get warehouse locations' })
  async getLocations(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.warehouseService.getLocations(id),
    );
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get warehouse inventory' })
  async getWarehouseInventory(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.warehouseService.getWarehouseInventory(id),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new warehouse' })
  async create(
    @Body() dto: CreateWarehouseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.warehouseService.create(dto, user.sub),
      'Warehouse created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a warehouse' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.warehouseService.update(id, dto, user.sub),
      'Warehouse updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a warehouse' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.warehouseService.delete(id, user.sub);
    return ResponseBuilder.deleted('Warehouse deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted warehouse' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.warehouseService.restore(id, user.sub),
      'Warehouse restored',
    );
  }

  @Post(':id/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add location to warehouse' })
  async createLocation(
    @Param('id') id: string,
    @Body() dto: CreateLocationDto,
  ) {
    return ResponseBuilder.created(
      await this.warehouseService.createLocation(id, dto),
      'Location created',
    );
  }

  @Post(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign variant inventory to warehouse' })
  async assignInventory(
    @Param('id') id: string,
    @Body() dto: AssignWarehouseInventoryDto,
  ) {
    return ResponseBuilder.created(
      await this.warehouseService.assignInventory(id, dto),
      'Inventory assigned',
    );
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  async transferStock(
    @Body() dto: TransferStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.warehouseService.transferStock(dto, user.sub),
      'Stock transferred',
    );
  }
}
