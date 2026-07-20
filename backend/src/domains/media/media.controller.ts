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
import { MediaService } from './media.service';
import {
  CreateMediaDto,
  UpdateMediaDto,
  MediaQueryDto,
  ReorderMediaDto,
} from './media.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Product Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List product media with filtering, pagination' })
  async findAll(@Query() query: MediaQueryDto) {
    return ResponseBuilder.success(await this.mediaService.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.mediaService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload/add media to product' })
  async create(@Body() dto: CreateMediaDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.mediaService.create(dto, user.sub),
      'Media created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update media' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.mediaService.update(id, dto, user.sub),
      'Media updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete media' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.mediaService.delete(id, user.sub);
    return ResponseBuilder.deleted('Media deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted media' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.mediaService.restore(id, user.sub),
      'Media restored',
    );
  }

  @Post(':id/set-primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set media as primary image' })
  async setPrimary(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.mediaService.setPrimary(id, user.sub),
      'Primary media set',
    );
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder media gallery' })
  async reorder(@Body() dto: ReorderMediaDto) {
    return ResponseBuilder.success(
      await this.mediaService.reorder(dto),
      'Gallery reordered',
    );
  }

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a signed S3 upload URL for product media' })
  async getUploadUrl(
    @Body()
    body: {
      productId: string;
      mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | '360_IMAGE';
      extension: string;
    },
  ) {
    const data = await this.mediaService.getUploadUrl(
      body.productId,
      body.mediaType,
      body.extension,
    );
    return ResponseBuilder.success(data, 'Upload URL generated');
  }
}
