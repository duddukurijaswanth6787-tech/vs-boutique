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
import { ReviewService } from './review.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
} from './review.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews with filtering and pagination' })
  async findAll(@Query() query: ReviewQueryDto) {
    return ResponseBuilder.success(await this.reviewService.findAll(query));
  }

  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Get product rating summary' })
  async getProductRatingSummary(@Param('productId') productId: string) {
    return ResponseBuilder.success(
      await this.reviewService.getProductRatingSummary(productId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.reviewService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.reviewService.create(user.sub, dto),
      'Review created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.reviewService.update(id, dto, user.sub),
      'Review updated',
    );
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review' })
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.reviewService.approve(id, user.sub),
      'Review approved',
    );
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a review' })
  async reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.reviewService.reject(id, user.sub),
      'Review rejected',
    );
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a review' })
  async vote(
    @Param('id') id: string,
    @Body('isHelpful') isHelpful: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.reviewService.vote(id, user.sub, isHelpful),
      'Vote recorded',
    );
  }
}
