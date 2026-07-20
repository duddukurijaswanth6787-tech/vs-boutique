import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiSearchService } from './ai-search.service';
import { AiSearchDto, SearchHistoryQueryDto } from './ai-search.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('AI Search')
@Controller('ai/search')
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform AI search' })
  async search(@Body() dto: AiSearchDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.aiSearchService.search(user.sub, dto),
      'Search completed',
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  async getSuggestions() {
    return ResponseBuilder.success(await this.aiSearchService.getSuggestions());
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get search history' })
  async getHistory(
    @Query() query: SearchHistoryQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiSearchService.getHistory(
        user.sub,
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  async getTrendingSearches() {
    return ResponseBuilder.success(
      await this.aiSearchService.getTrendingSearches(),
    );
  }
}
