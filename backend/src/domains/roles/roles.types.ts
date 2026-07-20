import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() displayName!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ enum: ['GLOBAL', 'DOMAIN', 'CUSTOM'], default: 'DOMAIN' })
  @IsOptional()
  @IsString()
  scope?: string;
  @ApiProperty({ default: 0 }) @IsOptional() @IsInt() hierarchy?: number;
}

export class UpdateRoleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() hierarchy?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

export class RoleResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() hierarchy!: number;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: [String] }) permissions!: string[];
}
