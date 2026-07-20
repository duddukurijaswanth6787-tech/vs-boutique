import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@vasanthidesigners.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewP@ssw0rd2026' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class ValidateTokenDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
