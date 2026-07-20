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
import { TaxService } from './tax.service';
import {
  CreateTaxRuleDto,
  UpdateTaxRuleDto,
  CalculateTaxDto,
} from './tax.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Tax')
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tax rules' })
  async findAll(
    @Query()
    query: {
      type?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    return ResponseBuilder.success(await this.taxService.findAll(query));
  }

  @Get('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tax rule by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.taxService.findById(id));
  }

  @Post('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tax rule' })
  async create(@Body() dto: CreateTaxRuleDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.taxService.create(user.sub, dto),
      'Tax rule created',
    );
  }

  @Patch('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tax rule' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.taxService.update(id, user.sub, dto),
      'Tax rule updated',
    );
  }

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate tax' })
  async calculateTax(@Body() dto: CalculateTaxDto) {
    return ResponseBuilder.success(await this.taxService.calculateTax(dto));
  }
}
