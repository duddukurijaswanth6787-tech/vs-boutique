import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty() @IsString() module!: string;
  @ApiProperty({
    enum: ['GLOBAL', 'MODULE', 'DOMAIN', 'SELF'],
    default: 'MODULE',
  })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PermissionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() module!: string;
  @ApiProperty() scope!: string;
  @ApiProperty() isActive!: boolean;
}
