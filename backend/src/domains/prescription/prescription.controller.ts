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
import { PrescriptionService } from './prescription.service';
import {
  UploadPrescriptionDto,
  UpdatePrescriptionDto,
  VerifyPrescriptionDto,
  PrescriptionQueryDto,
  UploadMultiPageDto,
  OcrResultDto,
  AssignPharmacistDto,
  ApproveRejectDto,
  RejectDto,
  AdminPrescriptionQueryDto,
} from './prescription.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own prescriptions' })
  async findAll(
    @Query() query: PrescriptionQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.findAll(user.sub, query),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get prescription by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.prescriptionService.findById(id, user.sub),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload prescription' })
  async upload(
    @Body() dto: UploadPrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.prescriptionService.upload(user.sub, dto),
      'Prescription uploaded',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update prescription' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.update(id, dto, user.sub),
      'Prescription updated',
    );
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify prescription (admin)' })
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyPrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.verify(id, dto, user.sub),
      'Prescription verified',
    );
  }

  @Post('multi-page')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multi-page prescription' })
  async uploadMultiPage(
    @Body() dto: UploadMultiPageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.prescriptionService.uploadMultiPage(user.sub, dto),
      'Multi-page prescription uploaded',
    );
  }

  @Post(':id/ocr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit OCR results for prescription' })
  async processOcr(
    @Param('id') id: string,
    @Body() dto: OcrResultDto,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.processOcr(id, dto),
      'OCR processed',
    );
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign pharmacist to prescription' })
  async assignPharmacist(
    @Param('id') id: string,
    @Body() dto: AssignPharmacistDto,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.assignPharmacist(id, dto.pharmacistId),
      'Pharmacist assigned',
    );
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve prescription' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveRejectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.approve(id, user.sub, dto.notes),
      'Prescription approved',
    );
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject prescription' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.prescriptionService.reject(id, user.sub, dto.reason),
      'Prescription rejected',
    );
  }

  @Post(':id/match-medicines')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Match prescription medicines against product catalog' })
  async matchMedicines(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.prescriptionService.matchMedicines(id),
      'Medicine matching complete',
    );
  }

  // ── Admin endpoints ────────

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin prescription review queue' })
  async adminQueue(@Query() query: AdminPrescriptionQueryDto) {
    return ResponseBuilder.success(
      await this.prescriptionService.getAdminQueue(query),
    );
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Prescription analytics stats' })
  async adminStats() {
    return ResponseBuilder.success(
      await this.prescriptionService.getStats(),
    );
  }
}
