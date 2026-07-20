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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustStockDto,
  StockMovementDto,
  InventoryQueryDto,
  MovementQueryDto,
} from './inventory.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Public ────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List inventory with filtering, pagination, sorting',
  })
  async findAll(@Query() query: InventoryQueryDto) {
    return ResponseBuilder.success(await this.inventoryService.findAll(query));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get stock summary statistics' })
  async getStockSummary() {
    return ResponseBuilder.success(
      await this.inventoryService.getStockSummary(),
    );
  }

  @Get('movements')
  @ApiOperation({ summary: 'List inventory movements with filtering' })
  async findMovements(@Query() query: MovementQueryDto) {
    return ResponseBuilder.success(
      await this.inventoryService.findMovements(query),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.inventoryService.findById(id));
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get inventory by variant ID' })
  async findByVariantId(@Param('variantId') variantId: string) {
    return ResponseBuilder.success(
      await this.inventoryService.findByVariantId(variantId),
    );
  }

  // ─── Admin: CRUD ───────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create inventory for a variant' })
  async create(
    @Body() dto: CreateInventoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.inventoryService.create(dto, user.sub),
      'Inventory created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update inventory settings' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.update(id, dto, user.sub),
      'Inventory updated',
    );
  }

  // ─── Admin: Stock Operations ───────────────────────────

  @Post(':id/increase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increase stock' })
  async increaseStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.increaseStock(id, dto, user.sub),
      'Stock increased',
    );
  }

  @Post(':id/decrease')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decrease stock' })
  async decreaseStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.decreaseStock(id, dto, user.sub),
      'Stock decreased',
    );
  }

  @Post(':id/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust stock (positive or negative)' })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.adjustStock(id, dto, user.sub),
      'Stock adjusted',
    );
  }

  @Post(':id/reserve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reserve stock for order' })
  async reserveStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.reserveStock(id, dto, user.sub),
      'Stock reserved',
    );
  }

  @Post(':id/release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release reserved stock' })
  async releaseStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.releaseStock(id, dto, user.sub),
      'Stock released',
    );
  }

  @Post(':id/return')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process return stock' })
  async returnStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.returnStock(id, dto, user.sub),
      'Stock returned',
    );
  }

  @Post(':id/damage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report damaged stock' })
  async damageStock(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.inventoryService.damageStock(id, dto, user.sub),
      'Stock damaged',
    );
  }
}
