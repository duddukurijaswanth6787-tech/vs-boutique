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
import { AttributesService } from './attributes.service';
import {
  CreateAttributeGroupDto,
  UpdateAttributeGroupDto,
  AttributeGroupQueryDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  AttributeQueryDto,
  CreateAttributeOptionDto,
  UpdateAttributeOptionDto,
  AttributeOptionQueryDto,
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
  CategoryAttributesQueryDto,
} from './attributes.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Attributes')
@Controller()
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  // ─── Groups ─────────────────────────────────────────────

  @Get('attribute-groups')
  @ApiOperation({ summary: 'List attribute groups' })
  async findAllGroups(@Query() query: AttributeGroupQueryDto) {
    return ResponseBuilder.success(
      await this.attributesService.findAllGroups(query),
    );
  }

  @Get('attribute-groups/:id')
  @ApiOperation({ summary: 'Get attribute group by ID' })
  async findGroupById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.attributesService.findGroupById(id),
    );
  }

  @Post('attribute-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an attribute group' })
  async createGroup(
    @Body() dto: CreateAttributeGroupDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.attributesService.createGroup(dto, user.sub),
      'Attribute group created',
    );
  }

  @Patch('attribute-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an attribute group' })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeGroupDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.updateGroup(id, dto, user.sub),
      'Attribute group updated',
    );
  }

  @Delete('attribute-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an attribute group' })
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.attributesService.deleteGroup(id, user.sub);
    return ResponseBuilder.deleted('Attribute group deleted');
  }

  @Post('attribute-groups/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted attribute group' })
  async restoreGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.attributesService.restoreGroup(id, user.sub),
      'Attribute group restored',
    );
  }

  // ─── Attributes ─────────────────────────────────────────

  @Get('attributes')
  @ApiOperation({ summary: 'List attributes' })
  async findAllAttributes(@Query() query: AttributeQueryDto) {
    return ResponseBuilder.success(
      await this.attributesService.findAllAttributes(query),
    );
  }

  @Get('attributes/:id')
  @ApiOperation({ summary: 'Get attribute by ID' })
  async findAttributeById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.attributesService.findAttributeById(id),
    );
  }

  @Post('attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an attribute' })
  async createAttribute(
    @Body() dto: CreateAttributeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.attributesService.createAttribute(dto, user.sub),
      'Attribute created',
    );
  }

  @Patch('attributes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an attribute' })
  async updateAttribute(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.updateAttribute(id, dto, user.sub),
      'Attribute updated',
    );
  }

  @Delete('attributes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an attribute' })
  async deleteAttribute(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.attributesService.deleteAttribute(id, user.sub);
    return ResponseBuilder.deleted('Attribute deleted');
  }

  @Post('attributes/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted attribute' })
  async restoreAttribute(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.restoreAttribute(id, user.sub),
      'Attribute restored',
    );
  }

  // ─── Options ────────────────────────────────────────────

  @Get('attribute-options')
  @ApiOperation({ summary: 'List options for an attribute' })
  async findAllOptions(@Query() query: AttributeOptionQueryDto) {
    return ResponseBuilder.success(
      await this.attributesService.findAllOptions(query),
    );
  }

  @Get('attribute-options/:id')
  @ApiOperation({ summary: 'Get option by ID' })
  async findOptionById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.attributesService.findOptionById(id),
    );
  }

  @Post('attribute-options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an attribute option' })
  async createOption(
    @Body() dto: CreateAttributeOptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.attributesService.createOption(dto, user.sub),
      'Attribute option created',
    );
  }

  @Patch('attribute-options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an attribute option' })
  async updateOption(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeOptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.updateOption(id, dto, user.sub),
      'Attribute option updated',
    );
  }

  @Delete('attribute-options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an attribute option' })
  async deleteOption(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.attributesService.deleteOption(id, user.sub);
    return ResponseBuilder.deleted('Attribute option deleted');
  }

  @Post('attribute-options/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted attribute option' })
  async restoreOption(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.restoreOption(id, user.sub),
      'Attribute option restored',
    );
  }

  // ─── Category Mappings ──────────────────────────────────

  @Get('category-attributes')
  @ApiOperation({ summary: 'List attribute mappings for a category' })
  async findAllCategoryMappings(@Query() query: CategoryAttributesQueryDto) {
    return ResponseBuilder.success(
      await this.attributesService.findAllCategoryMappings(query.categoryId),
    );
  }

  @Post('category-attributes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Map an attribute to a category' })
  async createCategoryMapping(
    @Body() dto: CreateCategoryAttributeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.attributesService.createCategoryMapping(dto, user.sub),
      'Attribute mapped to category',
    );
  }

  @Patch('category-attributes/:categoryId/:attributeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category-attribute mapping' })
  async updateCategoryMapping(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateCategoryAttributeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.attributesService.updateCategoryMapping(
        categoryId,
        attributeId,
        dto,
        user.sub,
      ),
      'Category attribute mapping updated',
    );
  }

  @Delete('category-attributes/:categoryId/:attributeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an attribute from a category' })
  async deleteCategoryMapping(
    @Param('categoryId') categoryId: string,
    @Param('attributeId') attributeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.attributesService.deleteCategoryMapping(
      categoryId,
      attributeId,
      user.sub,
    );
    return ResponseBuilder.deleted('Attribute unmapped from category');
  }
}
