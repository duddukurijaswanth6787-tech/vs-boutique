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
import { CampaignService } from './campaign.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignQueryDto,
} from './campaign.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { SanitizeFieldsPipe } from '@common/validation/pipes.validation';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List campaigns (admin)' })
  async findAll(@Query() query: CampaignQueryDto) {
    return ResponseBuilder.success(await this.campaignService.findAll(query));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get campaign by ID (admin)' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.campaignService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create campaign (admin)' })
  async create(
    @Body(new SanitizeFieldsPipe(['content'])) dto: CreateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.campaignService.create(dto, user.sub),
      'Campaign created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign (admin)' })
  async update(
    @Param('id') id: string,
    @Body(new SanitizeFieldsPipe(['content'])) dto: UpdateCampaignDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.campaignService.update(id, dto, user.sub),
      'Campaign updated',
    );
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send campaign (admin)' })
  async send(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.campaignService.send(id, user.sub),
      'Campaign sent',
    );
  }
}
