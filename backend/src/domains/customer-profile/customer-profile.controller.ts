import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerProfileService } from './customer-profile.service';
import { UpdateProfileDto } from './customer-profile.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import { BulkActionDto } from '@common/dto/bulk.dto';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Customer Profile')
@Controller('customer-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerProfileController {
  constructor(private readonly profileService: CustomerProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get own customer profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.profileService.getProfile(user.sub),
    );
  }

  @Patch()
  @ApiOperation({ summary: 'Update own customer profile' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.profileService.updateProfile(user.sub, dto),
      'Profile updated',
    );
  }

  @Get('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get customer profile by user ID (Admin only)' })
  async adminGetProfile(@Param('userId') userId: string) {
    return ResponseBuilder.success(
      await this.profileService.getProfile(userId),
    );
  }

  @Patch('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Update customer profile by user ID (Admin only)' })
  async adminUpdateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return ResponseBuilder.success(
      await this.profileService.updateProfile(userId, dto),
      'Profile updated by Admin',
    );
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk action on customers (activate/deactivate/suspend)',
  })
  async bulk(@Body() dto: BulkActionDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.profileService.bulkUpdateStatus(dto, user.sub),
    );
  }
}
