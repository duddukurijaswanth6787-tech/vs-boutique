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
import { ProductVariantsService } from './product-variants.service';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantQueryDto,
  AssignAttributeValuesDto,
} from './product-variants.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Product Variants')
@Controller('variants')
export class ProductVariantsController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  @Get()
  @ApiOperation({
    summary: 'List variants with filtering, pagination, sorting',
  })
  async findAll(@Query() query: VariantQueryDto) {
    return ResponseBuilder.success(await this.variantsService.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get variant by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.variantsService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new variant' })
  async create(@Body() dto: CreateVariantDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.variantsService.create(dto, user.sub),
      'Variant created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a variant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.variantsService.update(id, dto, user.sub),
      'Variant updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a variant' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.variantsService.delete(id, user.sub);
    return ResponseBuilder.deleted('Variant deleted');
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted variant' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.variantsService.restore(id, user.sub),
      'Variant restored',
    );
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a variant' })
  async activate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.variantsService.activate(id, user.sub),
      'Variant activated',
    );
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a variant' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.variantsService.deactivate(id, user.sub),
      'Variant deactivated',
    );
  }

  @Post(':id/set-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set variant as default for its product' })
  async setDefault(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.variantsService.setDefault(id, user.sub),
      'Default variant set',
    );
  }

  @Post(':id/attribute-values')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign attribute values to variant' })
  async assignAttributeValues(
    @Param('id') id: string,
    @Body() dto: AssignAttributeValuesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.variantsService.assignAttributeValues(id, dto, user.sub),
      'Attribute values assigned',
    );
  }

  @Delete(':id/attribute-values/:attributeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove attribute value from variant' })
  async removeAttributeValue(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return ResponseBuilder.success(
      await this.variantsService.removeAttributeValue(id, attributeId),
      'Attribute value removed',
    );
  }
}
