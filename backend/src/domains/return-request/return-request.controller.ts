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
import { ReturnRequestService } from './return-request.service';
import {
  CreateReturnDto,
  UpdateReturnStatusDto,
  ReturnQueryDto,
} from './return-request.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Returns')
@Controller('returns')
export class ReturnRequestController {
  constructor(private readonly returnService: ReturnRequestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List returns (admin: all, customer: own)' })
  async findAll(
    @Query() query: ReturnQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const isAdmin = user.roles?.some((r) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (!isAdmin) query.orderId = undefined;
    return ResponseBuilder.success(await this.returnService.findAll(query));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get return by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(await this.returnService.findById(id, user));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create return request' })
  async create(@Body() dto: CreateReturnDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.returnService.create(user.sub, dto),
      'Return request created',
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update return status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.returnService.updateStatus(id, dto, user.sub),
      'Return status updated',
    );
  }
}
