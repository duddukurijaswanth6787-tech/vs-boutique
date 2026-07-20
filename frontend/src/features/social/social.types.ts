export enum SocialPostContentType {
  POST = 'POST',
  REEL = 'REEL',
}

export enum SocialPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
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

export interface ProductTagDto {
  productId: string;
  variantId?: string;
  displayOrder?: number;
  tagX?: number;
  tagY?: number;
  label?: string;
}

export interface PostMediaDto {
  mediaType: SocialMediaType;
  s3Key: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  displayOrder?: number;
  altText?: string;
}

export interface CreateSocialPostDto {
  contentType: SocialPostContentType;
  caption?: string;
  hashtags?: string[];
  visibility?: SocialPostVisibility;
  allowComments?: boolean;
}

export interface UpdateSocialPostDto {
  caption?: string;
  hashtags?: string[];
  visibility?: SocialPostVisibility;
  allowComments?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
}

export interface UpdatePostStatusDto {
  action: 'PUBLISH' | 'UNPUBLISH' | 'HIDE' | 'UNHIDE' | 'ARCHIVE' | 'RESTORE' | 'FEATURE' | 'UNFEATURE';
}

export interface ResolveReportDto {
  action: 'DISMISS' | 'MARK_REVIEWED' | 'TAKE_ACTION';
  resolution?: string;
}

export interface AdminSocialQueryDto {
  contentType?: SocialPostContentType;
  status?: SocialPostStatus;
  page?: number;
  limit?: number;
}

export interface AdminReportsQueryDto {
  status?: SocialReportStatus;
  reason?: SocialReportReason;
  postId?: string;
  page?: number;
  limit?: number;
}

export interface SocialPostResponse {
  id: string;
  userId: string;
  contentType: SocialPostContentType;
  caption?: string;
  hashtags: string[];
  status: SocialPostStatus;
  visibility: SocialPostVisibility;
  allowComments: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  media: PostMediaDto[];
  productTags: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostListResponse {
  data: SocialPostResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SocialReportResponse {
  id: string;
  postId: string;
  userId: string;
  reason: SocialReportReason;
  description?: string;
  status: SocialReportStatus;
  resolution?: string;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
  post?: SocialPostResponse;
}

export interface SocialReportListResponse {
  data: SocialReportResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
