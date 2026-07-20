import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer@vasanthidesigners.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd2026' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Vasanthi' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Devi', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'customer@vasanthidesigners.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd2026' })
  @IsString()
  password!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class AuthTokensResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;
}

export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  userType!: string;

  @ApiProperty()
  accountStatus!: string;
}

export class MeResponse extends UserResponse {
  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiProperty({ type: [String] })
  permissions!: string[];
}
