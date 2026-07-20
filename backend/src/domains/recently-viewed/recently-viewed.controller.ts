import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecentlyViewedService } from './recently-viewed.service';
import {
  RecordViewDto,
  RecentlyViewedQueryDto,
  MergeGuestDto,
} from './recently-viewed.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Recently Viewed')
@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private readonly service: RecentlyViewedService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a product view' })
  async record(@CurrentUser() user: JwtPayload, @Body() dto: RecordViewDto) {
    await this.service.record(user.sub, dto.productId);
    return ResponseBuilder.success(null, 'View recorded');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recently viewed products' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: RecentlyViewedQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.service.findAll(user.sub, query.page ?? 1, query.limit ?? 10),
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear recently viewed history' })
  async deleteAll(@CurrentUser() user: JwtPayload) {
    await this.service.deleteAll(user.sub);
    return ResponseBuilder.deleted('History cleared');
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove one product from recently viewed' })
  async deleteOne(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    await this.service.deleteOne(user.sub, productId);
    return ResponseBuilder.deleted('Item removed');
  }

  @Post('merge-guest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest recently viewed data on login' })
  async mergeGuest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MergeGuestDto,
  ) {
    await this.service.mergeFromGuest(user.sub, dto.items);
    return ResponseBuilder.success(null, 'Guest data merged');
  }
}
