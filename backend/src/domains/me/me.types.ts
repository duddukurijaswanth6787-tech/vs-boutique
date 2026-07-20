import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

// ─── Profile ─────────────────────────────────────────────

export class UpdateMeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredCurrency?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrands?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSizes?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredColors?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
}

// ─── Addresses ───────────────────────────────────────────

export class CreateAddressDto {
  @ApiPropertyOptional({ default: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;
  @ApiProperty() @IsString() fullName!: string;
  @ApiProperty() @IsString() phone!: string;
  @ApiProperty() @IsString() addressLine1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine2?: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() state!: string;
  @ApiPropertyOptional({ default: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;
  @ApiProperty() @IsString() postalCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() latitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() longitude?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultBilling?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() landmark?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() latitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() longitude?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultBilling?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefaultShipping?: boolean;
}

// ─── Wishlist ────────────────────────────────────────────

export class AddToWishlistDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class WishlistQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
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

// ─── Cart ────────────────────────────────────────────────

export enum CartAction {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
  SAVE_FOR_LATER = 'SAVE_FOR_LATER',
  MOVE_TO_CART = 'MOVE_TO_CART',
}

export class CartActionDto {
  @ApiProperty({ enum: CartAction }) @IsEnum(CartAction) action!: CartAction;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class MergeCartDto {
  @ApiProperty() @IsString() guestId!: string;
}

// ─── Responses ───────────────────────────────────────────

export class MeResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() dateOfBirth?: Date;
  @ApiPropertyOptional() preferredLanguage?: string;
  @ApiPropertyOptional() preferredCurrency?: string;
  @ApiPropertyOptional() profileImage?: string;
  @ApiProperty() wishlistCount!: number;
  @ApiProperty() cartItemCount!: number;
  @ApiProperty() cartSubtotal!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class AddressResponse {
  @ApiProperty() id!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() label!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() addressLine1!: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() country!: string;
  @ApiProperty() postalCode!: string;
  @ApiPropertyOptional() landmark?: string;
  @ApiPropertyOptional() latitude?: string;
  @ApiPropertyOptional() longitude?: string;
  @ApiProperty() isDefaultBilling!: boolean;
  @ApiProperty() isDefaultShipping!: boolean;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class WishlistItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class WishlistResponse {
  @ApiProperty() id!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty({ type: [WishlistItemResponse] }) items!: WishlistItemResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class CartItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() savedForLater!: boolean;
  @ApiProperty() createdAt!: Date;
}

// ponytail: use CartResponse from cart.types.ts directly in controller
export { CartResponse } from '@domains/cart/cart.types';
