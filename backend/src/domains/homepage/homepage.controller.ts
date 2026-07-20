import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { HomepageService } from './homepage.service';
import { HomepageResponseDto } from './homepage.response.dto';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@ApiTags('Homepage')
@Controller('home')
export class HomepageController {
  constructor(private readonly homepage: HomepageService) {}

  @Get()
  @ApiOperation({
    summary: 'Aggregated customer homepage payload (single request)',
  })
  @ApiResponse({ status: 200, type: HomepageResponseDto })
  async getHome(@Req() req: RequestWithUser): Promise<HomepageResponseDto> {
    const userId = req.user?.id;
    return this.homepage.getHomepage(userId);
  }
}
