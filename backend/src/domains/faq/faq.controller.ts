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
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, FaqQueryDto } from './faq.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { SanitizeFieldsPipe } from '@common/validation/pipes.validation';

@ApiTags('FAQ')
@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'List FAQs (public)' })
  async findAll(@Query() query: FaqQueryDto) {
    return ResponseBuilder.success(await this.faqService.findAll(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by ID (public)' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(await this.faqService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ (admin)' })
  async create(@Body(new SanitizeFieldsPipe(['answer'])) dto: CreateFaqDto) {
    return ResponseBuilder.created(
      await this.faqService.create(dto),
      'FAQ created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ (admin)' })
  async update(
    @Param('id') id: string,
    @Body(new SanitizeFieldsPipe(['answer'])) dto: UpdateFaqDto,
  ) {
    return ResponseBuilder.success(
      await this.faqService.update(id, dto),
      'FAQ updated',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ (admin)' })
  async delete(@Param('id') id: string) {
    await this.faqService.delete(id);
    return ResponseBuilder.deleted('FAQ deleted');
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Mark FAQ as helpful (public)' })
  async markHelpful(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.faqService.markHelpful(id),
      'Marked as helpful',
    );
  }
}
