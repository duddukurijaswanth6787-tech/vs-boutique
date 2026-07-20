import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { FileUploadException } from '@common/exceptions';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { ImportConfirmDto } from './import.types';

@ApiTags('Import')
@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview/:entity')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload CSV for preview and validation' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      // ponytail: reject non-CSV files at the upload boundary
      fileFilter: (_req, file, callback) => {
        const allowed = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        if (allowed.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new FileUploadException(
              'Only CSV files are allowed',
              'IMPORT_INVALID_TYPE',
            ),
            false,
          );
        }
      },
    }),
  )
  async preview(@Param('entity') entity: string, @UploadedFile() file: any) {
    if (!file)
      throw new FileUploadException('File is required', 'IMPORT_NO_FILE');
    return ResponseBuilder.success(
      await this.importService.preview(entity, file.buffer),
    );
  }

  @Post('confirm/:entity')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm and process an import' })
  async confirm(
    @Param('entity') entity: string,
    @Body() dto: ImportConfirmDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.importService.confirm(entity, dto, user.sub),
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'List import history' })
  async history() {
    return ResponseBuilder.success(await this.importService.getHistory());
  }
}
