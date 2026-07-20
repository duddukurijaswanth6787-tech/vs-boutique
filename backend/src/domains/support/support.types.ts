import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactMessageDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() message!: string;
}

export class CreateSupportTicketDto {
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
}

export class CreateSupportReplyDto {
  @ApiProperty() @IsString() message!: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() attachments?: string[];
}

export class UpdateTicketStatusDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
}

export class ContactMessageResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty() subject!: string;
  @ApiProperty() message!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() assignedTo?: string;
  @ApiProperty() createdAt!: Date;
}

export class SupportReplyResponse {
  @ApiProperty() id!: string;
  @ApiProperty() message!: string;
  @ApiProperty() isStaff!: boolean;
  @ApiProperty() attachments!: string[];
  @ApiProperty() createdAt!: Date;
}

export class SupportTicketResponse {
  @ApiProperty() id!: string;
  @ApiProperty() ticketNumber!: string;
  @ApiPropertyOptional() customerId?: string;
  @ApiProperty() subject!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() category?: string;
  @ApiProperty() priority!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() assignedTo?: string;
  @ApiPropertyOptional({ type: [SupportReplyResponse] })
  replies?: SupportReplyResponse[];
  @ApiProperty() createdAt!: Date;
}

export class ContactQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TicketQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
