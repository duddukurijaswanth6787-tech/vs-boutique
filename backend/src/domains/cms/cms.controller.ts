import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerQueryDto,
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CmsPageQueryDto,
  CreateCmsSectionDto,
} from './cms.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { SanitizeFieldsPipe } from '@common/validation/pipes.validation';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('banners')
  @ApiOperation({ summary: 'List banners' })
  async findBanners(@Query() query: BannerQueryDto) {
    return ResponseBuilder.success(await this.cmsService.findBanners(query));
  }

  @Get('banners/:id')
  @ApiOperation({ summary: 'Get banner by ID' })
  async findBannerById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.cmsService.findBannerById(id));
  }

  @Post('banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new banner' })
  async createBanner(
    @Body() dto: CreateBannerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.cmsService.createBanner(dto, user.sub),
      'Banner created',
    );
  }

  @Patch('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a banner' })
  async updateBanner(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.cmsService.updateBanner(id, dto, user.sub),
      'Banner updated',
    );
  }

  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a banner' })
  async deleteBanner(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.cmsService.deleteBanner(id, user.sub);
    return ResponseBuilder.deleted('Banner deleted');
  }

  @Post('banners/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a deleted banner' })
  async restoreBanner(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.cmsService.restoreBanner(id, user.sub),
      'Banner restored',
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'List CMS pages' })
  async findPages(@Query() query: CmsPageQueryDto) {
    return ResponseBuilder.success(await this.cmsService.findPages(query));
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get page by slug' })
  async findPageBySlug(@Param('slug') slug: string) {
    return ResponseBuilder.success(await this.cmsService.findPageBySlug(slug));
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new CMS page' })
  async createPage(
    @Body(new SanitizeFieldsPipe(['content'])) dto: CreateCmsPageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.cmsService.createPage(dto, user.sub),
      'Page created',
    );
  }

  @Patch('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a CMS page' })
  async updatePage(
    @Param('id') id: string,
    @Body(new SanitizeFieldsPipe(['content'])) dto: UpdateCmsPageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.cmsService.updatePage(id, dto, user.sub),
      'Page updated',
    );
  }

  @Get('sections')
  @ApiOperation({ summary: 'List CMS sections' })
  async findSections() {
    return ResponseBuilder.success(await this.cmsService.findSections());
  }

  @Post('sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new CMS section' })
  async createSection(
    @Body(new SanitizeFieldsPipe(['content'])) dto: CreateCmsSectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.cmsService.createSection(dto, user.sub),
      'Section created',
    );
  }

  @Post('banners/:id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clone a banner' })
  async cloneBanner(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.cmsService.cloneBanner(id, user.sub),
      'Banner cloned',
    );
  }

  @Post('pages/:id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clone a CMS page' })
  async clonePage(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.cmsService.clonePage(id, user.sub),
      'Page cloned',
    );
  }
}
