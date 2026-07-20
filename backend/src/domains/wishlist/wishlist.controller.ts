import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto, WishlistQueryDto } from './wishlist.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own wishlist' })
  async getWishlist(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.wishlistService.getWishlist(user.sub),
    );
  }

  @Get('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List wishlist items' })
  async getItems(
    @CurrentUser() user: JwtPayload,
    @Query() query: WishlistQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.wishlistService.getItems(user.sub, query),
    );
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist item count' })
  async getCount(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.wishlistService.getCount(user.sub),
    );
  }

  @Get('check/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  async isInWishlist(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
  ) {
    return ResponseBuilder.success(
      await this.wishlistService.isInWishlist(user.sub, productId),
    );
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to wishlist' })
  async addItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddToWishlistDto,
  ) {
    return ResponseBuilder.created(
      await this.wishlistService.addItem(user.sub, dto),
      'Item added to wishlist',
    );
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
  ) {
    await this.wishlistService.removeItem(user.sub, productId);
    return ResponseBuilder.deleted('Item removed from wishlist');
  }

  @Post('items/:productId/move-to-cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move wishlist item to cart' })
  async moveToCart(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
  ) {
    await this.wishlistService.moveToCart(user.sub, productId);
    return ResponseBuilder.success(null, 'Item moved to cart');
  }

  @Get('admin/customer/:customerId/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wishlist items of any customer (Admin only)' })
  async getItemsAdmin(@Param('customerId') customerId: string) {
    return ResponseBuilder.success(
      await this.wishlistService.getItemsByCustomerIdAdmin(customerId),
    );
  }
}
