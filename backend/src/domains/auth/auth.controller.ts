import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  ChangePasswordDto,
  AuthTokensResponse,
} from './auth.types';
import { JwtAuthGuard, CurrentUser } from './guards/jwt-auth.guard';
import type { JwtPayload } from './services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return ResponseBuilder.created(result, 'Registration successful');
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return ResponseBuilder.success(result, 'Login successful');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    return ResponseBuilder.success(null, 'Logout successful');
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    const result = await this.authService.refresh(
      dto.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
    if (!result) {
      return ResponseBuilder.success(
        null as unknown as AuthTokensResponse,
        'Invalid or expired refresh token',
      );
    }
    return ResponseBuilder.success(result, 'Token refreshed');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async me(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.me(user.sub);
    return ResponseBuilder.success(result, 'User profile retrieved');
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.sub, dto);
    return ResponseBuilder.success(null, 'Password changed successfully');
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify JWT token validity' })
  async verifyToken(@Body() body: { token: string }) {
    try {
      this.authService.verifyToken(body.token);
      return ResponseBuilder.success({ valid: true }, 'Token is valid');
    } catch {
      // ponytail: invalid token is an expected outcome — return valid:false, intentionally not logged
      return ResponseBuilder.success({ valid: false }, 'Token is invalid');
    }
  }
}
