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
import { DrugInteractionService } from './drug-interaction.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  CheckInteractionDto,
  InteractionQueryDto,
} from './drug-interaction.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Drug Interactions')
@Controller('drug-interactions')
export class DrugInteractionController {
  constructor(
    private readonly drugInteractionService: DrugInteractionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List drug interactions' })
  async findAll(@Query() query: InteractionQueryDto) {
    return ResponseBuilder.success(
      await this.drugInteractionService.findAll(query),
    );
  }

  @Get('medicine/:name')
  @ApiOperation({ summary: 'Get interactions by medicine name' })
  async findByMedicine(@Param('name') name: string) {
    return ResponseBuilder.success(
      await this.drugInteractionService.findByMedicine(name),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interaction by ID' })
  async findById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.drugInteractionService.findById(id),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a drug interaction' })
  async create(@Body() dto: CreateInteractionDto) {
    return ResponseBuilder.created(
      await this.drugInteractionService.create(dto),
      'Drug interaction created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a drug interaction' })
  async update(@Param('id') id: string, @Body() dto: UpdateInteractionDto) {
    return ResponseBuilder.success(
      await this.drugInteractionService.update(id, dto),
      'Drug interaction updated',
    );
  }

  @Post('check')
  @ApiOperation({ summary: 'Check interactions between medicines' })
  async checkInteractions(@Body() dto: CheckInteractionDto) {
    return ResponseBuilder.success(
      await this.drugInteractionService.checkInteractions(dto),
    );
  }
}
