import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
} from './shipping.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('methods')
  @ApiOperation({ summary: 'List all shipping methods' })
  async getMethods() {
    return ResponseBuilder.success(await this.shippingService.getMethods());
  }

  @Get('methods/:code/calculate')
  @ApiOperation({ summary: 'Calculate shipping rate for a method' })
  async calculateShipping(
    @Param('code') code: string,
    @Query() query: CalculateShippingDto,
  ) {
    return ResponseBuilder.success(
      await this.shippingService.calculateShipping({
        ...query,
        methodCode: code,
      }),
    );
  }

  @Post('methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping method' })
  async createMethod(
    @Body() dto: CreateShippingMethodDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.shippingService.createMethod(dto, user.sub),
      'Shipping method created',
    );
  }

  @Get('zones')
  @ApiOperation({ summary: 'List shipping zones for a method' })
  async getZones(@Query('methodId') methodId: string) {
    return ResponseBuilder.success(
      await this.shippingService.getZones(methodId),
    );
  }

  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping zone' })
  async createZone(
    @Body() dto: CreateShippingZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.shippingService.createZone(dto, user.sub),
      'Shipping zone created',
    );
  }
}
