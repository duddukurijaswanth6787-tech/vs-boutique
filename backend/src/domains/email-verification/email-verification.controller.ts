import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailVerificationService } from './email-verification.service';
import { VerifyEmailDto } from './email-verification.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Email Verification')
@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('send')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and return verification token' })
  async send(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.emailVerificationService.send(user.sub),
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using verification token' })
  async verify(@Body() dto: VerifyEmailDto) {
    return ResponseBuilder.success(
      await this.emailVerificationService.verify(dto.token),
    );
  }

  @Post('resend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification token' })
  async resend(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.emailVerificationService.resend(user.sub),
    );
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate verification token without consuming it' })
  async validateToken(@Body() dto: VerifyEmailDto) {
    return ResponseBuilder.success(
      await this.emailVerificationService.validateToken(dto.token),
    );
  }
}
