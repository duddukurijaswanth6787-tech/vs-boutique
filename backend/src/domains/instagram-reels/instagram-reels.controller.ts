import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { InstagramReelsService } from './instagram-reels.service';
import { ReelResponse } from './instagram-reels.types';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Instagram Reels')
@Controller('instagram-reels')
export class InstagramReelsController {
  constructor(private readonly service: InstagramReelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get published, public Instagram Reels' })
  @ApiOkResponse({ type: [ReelResponse] })
  async findPublic(@Query('featured') featured?: string) {
    const isFeatured =
      featured === 'true' ? true : featured === 'false' ? false : undefined;
    return ResponseBuilder.success(await this.service.findPublic(isFeatured));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a public Instagram Reel by slug' })
  @ApiOkResponse({ type: ReelResponse })
  @ApiNotFoundResponse({ description: 'Reel not found' })
  async findBySlug(@Param('slug') slug: string) {
    const reel = await this.service.findBySlug(slug);
    if (!reel) throw new NotFoundException('Reel not found');
    return ResponseBuilder.success(reel);
  }
}
