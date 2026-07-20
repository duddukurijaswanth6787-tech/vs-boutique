import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { PasswordResetService } from './password-reset.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateTokenDto,
} from './password-reset.types';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Password Reset')
@Controller('password')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (generates reset token)' })
  async forgot(@Body() dto: ForgotPasswordDto) {
    const result = await this.passwordResetService.forgot(dto.email);
    return ResponseBuilder.success(result, result.message);
  }

  @Post('reset')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using reset token' })
  async reset(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const result = await this.passwordResetService.reset(
      dto.token,
      dto.newPassword,
      req.ip,
      req.headers['user-agent'],
    );
    return ResponseBuilder.success(result, result.message);
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate reset token without consuming it' })
  async validateToken(@Body() dto: ValidateTokenDto) {
    return ResponseBuilder.success(
      await this.passwordResetService.validateToken(dto.token),
    );
  }
}
