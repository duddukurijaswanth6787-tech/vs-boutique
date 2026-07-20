import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  MinLength,
  MaxLength,
  IsDateString,
  IsNumber,
} from 'class-validator';
import {
  StaffDepartment,
  StaffDesignation,
} from '@shared/identity/identity.enums';

export class CreateStaffDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(50) firstName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty({ enum: StaffDepartment })
  @IsEnum(StaffDepartment)
  department!: StaffDepartment;
  @ApiProperty({ enum: StaffDesignation })
  @IsEnum(StaffDesignation)
  designation!: StaffDesignation;
  @ApiProperty() @IsString() employeeId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shift?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salary?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sendInvite?: boolean;
}

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ enum: StaffDepartment })
  @IsOptional()
  @IsEnum(StaffDepartment)
  department?: StaffDepartment;
  @ApiPropertyOptional({ enum: StaffDesignation })
  @IsOptional()
  @IsEnum(StaffDesignation)
  designation?: StaffDesignation;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shift?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salary?: number;
  @ApiPropertyOptional() @IsOptional() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
}

export class StaffQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: StaffDepartment })
  @IsOptional()
  @IsEnum(StaffDepartment)
  department?: StaffDepartment;
  @ApiPropertyOptional({ enum: StaffDesignation })
  @IsOptional()
  @IsEnum(StaffDesignation)
  designation?: StaffDesignation;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shift?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() limit?: number;
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
  @ApiPropertyOptional({
    description: 'null=active only, "only"=deleted only, omit=all',
  })
  @IsOptional()
  @IsString()
  deleted?: string;
}

export class StaffResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiProperty() department!: string;
  @ApiProperty() designation!: string;
  @ApiProperty() employeeId!: string;
  @ApiPropertyOptional() jobTitle?: string;
  @ApiPropertyOptional() reportingManagerId?: string;
  @ApiPropertyOptional() employmentType?: string;
  @ApiPropertyOptional() shift?: string;
  @ApiPropertyOptional() joinedAt?: Date;
  @ApiPropertyOptional() dateOfBirth?: Date;
  @ApiPropertyOptional() salary?: number;
  @ApiProperty() employmentStatus!: string;
  @ApiProperty() accountStatus!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() profileImage?: string;
  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() emergencyContact?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() lastLoginAt?: Date;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty() createdAt!: Date;
}

export class StaffDetailResponse extends StaffResponse {
  @ApiPropertyOptional({ type: [Object] }) sessions?: any[];
  @ApiPropertyOptional({ type: [Object] }) recentActivity?: any[];
  @ApiPropertyOptional() forcePasswordChange?: boolean;
  @ApiPropertyOptional() createdBy?: string;
}

export class InviteStaffDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(50) firstName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
  @ApiProperty({ enum: StaffDepartment })
  @IsEnum(StaffDepartment)
  department!: StaffDepartment;
  @ApiProperty({ enum: StaffDesignation })
  @IsEnum(StaffDesignation)
  designation!: StaffDesignation;
  @ApiProperty() @IsString() employeeId!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}

export class AcceptInviteDto {
  @ApiProperty() @IsString() token!: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

export class AssignPermissionOverrideDto {
  @ApiProperty() @IsString() permissionCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isGranted?: boolean;
}
