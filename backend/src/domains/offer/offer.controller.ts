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
import { OfferService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto, OfferQueryDto } from './offer.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Offers')
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List offers with filtering and pagination' })
  async findAll(@Query() query: OfferQueryDto) {
    return ResponseBuilder.success(await this.offerService.findAll(query));
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active offers' })
  async getActiveOffers() {
    return ResponseBuilder.success(await this.offerService.getActiveOffers());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.offerService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new offer' })
  async create(@Body() dto: CreateOfferDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.offerService.create(user.sub, dto),
      'Offer created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an offer' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.offerService.update(id, dto, user.sub),
      'Offer updated',
    );
  }
}
