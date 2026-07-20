import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderQueryDto } from './order.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order statistics by status' })
  async getStatistics() {
    return ResponseBuilder.success(await this.orderService.getStatistics());
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders with filtering and pagination' })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const isAdmin = user.roles?.some((r: string) =>
      ['super_admin', 'admin'].includes(r),
    );
    const q = isAdmin ? query : { ...query, customerId: user.sub };
    return ResponseBuilder.success(await this.orderService.findAll(q));
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by order number' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    const isAdmin = user.roles?.some((r: string) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (!isAdmin && order.customerId !== user.sub) {
      throw new NotFoundException('Order not found');
    }
    return ResponseBuilder.success(order);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const order = await this.orderService.findById(id);
    const isAdmin = user.roles?.some((r: string) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (!isAdmin && order.customerId !== user.sub) {
      throw new NotFoundException('Order not found');
    }
    return ResponseBuilder.success(order);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; message?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.orderService.updateStatus(
        id,
        body.status,
        user.sub,
        body.message,
      ),
      'Order status updated',
    );
  }
}
