import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiRecommendationService } from './ai-recommendation.service';
import {
  RecommendationQueryDto,
  RecommendationHistoryQueryDto,
} from './ai-recommendation.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('AI Recommendations')
@Controller('ai/recommendations')
export class AiRecommendationController {
  constructor(
    private readonly aiRecommendationService: AiRecommendationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommendations' })
  async getRecommendations(
    @Query() query: RecommendationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiRecommendationService.getRecommendations(user.sub, query),
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommendation history' })
  async getHistory(
    @Query() query: RecommendationHistoryQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiRecommendationService.getHistory(user.sub, query),
    );
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate recommendations' })
  async generateRecommendations(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.aiRecommendationService.generateRecommendations(user.sub),
      'Recommendations generated',
    );
  }

  @Post(':id/click')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track recommendation click' })
  async trackClick(@CurrentUser() user: JwtPayload) {
    await this.aiRecommendationService.trackClick(user.sub);
    return ResponseBuilder.success(null, 'Click tracked');
  }
}
