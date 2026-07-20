import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  Max,
  IsBoolean,
  IsInt,
  IsUrl,
} from 'class-validator';

export enum SocialPostContentType {
  POST = 'POST',
  REEL = 'REEL',
}

export enum SocialPostStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum SocialPostVisibility {
  PUBLIC = 'PUBLIC',
  HIDDEN = 'HIDDEN',
}

export enum SocialMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum SocialReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISLEADING = 'MISLEADING',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum SocialReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  DISMISSED = 'DISMISSED',
  ACTION_TAKEN = 'ACTION_TAKEN',
}

export enum SocialInteractionAction {
  LIKE = 'LIKE',
  UNLIKE = 'UNLIKE',
  SAVE = 'SAVE',
  UNSAVE = 'UNSAVE',
  SHARE = 'SHARE',
  VIEW = 'VIEW',
  PLAY = 'PLAY',
  COMPLETE = 'COMPLETE',
}

// ─── Post Product Tag DTO ──────────────────────────────────
export class ProductTagDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'tagX must be between 0 and 100' })
  @Max(100, { message: 'tagX must be between 0 and 100' })
  tagX?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'tagY must be between 0 and 100' })
  @Max(100, { message: 'tagY must be between 0 and 100' })
  tagY?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;
}

// ─── Post Media Attachment DTO ──────────────────────────────
export class PostMediaDto {
  @ApiProperty({ enum: SocialMediaType })
  @IsEnum(SocialMediaType)
  mediaType!: SocialMediaType;

  @ApiProperty()
  @IsString()
  s3Key!: string;

  @ApiProperty()
  @IsUrl()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  mediumUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  largeUrl?: string;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  size!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  duration?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;
}

// ─── Create Social Post DTO ────────────────────────────────
export class CreateSocialPostDto {
  @ApiProperty({ enum: SocialPostContentType })
  @IsEnum(SocialPostContentType)
  contentType!: SocialPostContentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    enum: SocialPostVisibility,
    default: SocialPostVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(SocialPostVisibility)
  visibility?: SocialPostVisibility;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;
}

// ─── Update Social Post DTO ────────────────────────────────
export class UpdateSocialPostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ enum: SocialPostVisibility })
  @IsOptional()
  @IsEnum(SocialPostVisibility)
  visibility?: SocialPostVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

// ─── Post Status Action DTO ────────────────────────────────
export class UpdatePostStatusDto {
  @ApiProperty({
    enum: [
      'PUBLISH',
      'UNPUBLISH',
      'HIDE',
      'UNHIDE',
      'ARCHIVE',
      'RESTORE',
      'FEATURE',
      'UNFEATURE',
    ],
  })
  @IsString()
  action!:
    | 'PUBLISH'
    | 'UNPUBLISH'
    | 'HIDE'
    | 'UNHIDE'
    | 'ARCHIVE'
    | 'RESTORE'
    | 'FEATURE'
    | 'UNFEATURE';
}

// ─── Interaction Action DTO ────────────────────────────────
export class SocialInteractionDto {
  @ApiProperty({ enum: SocialInteractionAction })
  @IsEnum(SocialInteractionAction)
  action!: SocialInteractionAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  watchDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

// ─── Create Comment DTO ────────────────────────────────────
export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

// ─── Create Report DTO ─────────────────────────────────────
export class CreateReportDto {
  @ApiProperty({ enum: SocialReportReason })
  @IsEnum(SocialReportReason)
  reason!: SocialReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// ─── Resolve Report DTO ────────────────────────────────────
export class ResolveReportDto {
  @ApiProperty({ enum: ['DISMISS', 'MARK_REVIEWED', 'TAKE_ACTION'] })
  @IsString()
  action!: 'DISMISS' | 'MARK_REVIEWED' | 'TAKE_ACTION';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;
}

// ─── Social Feed Query DTO ──────────────────────────────────
export class SocialFeedQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class SocialReelsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminSocialQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SocialPostContentType)
  contentType?: SocialPostContentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SocialPostStatus)
  status?: SocialPostStatus;

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

export class AdminReportsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SocialReportStatus)
  status?: SocialReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SocialReportReason)
  reason?: SocialReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  postId?: string;

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
